import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadJsonDataset } from "@/data/loaders";
import { InboxFileSchema, SyntheticScenarioSchema } from "@/data/schema";
import { SCENARIO_FILE } from "@/data/synth";
import { ground } from "./grounding";
import { matchParty, type KnownParty } from "./matching";
import { processInbox } from "./pipeline";
import { extractWithRules } from "./rules";
import type { ExtractedLine, InboxMessage } from "./types";

const dir = join(process.cwd(), "data");
const file = loadJsonDataset("synthetic/inbox-samples.json", InboxFileSchema, dir).data;
const scenario = loadJsonDataset(SCENARIO_FILE, SyntheticScenarioSchema, dir).data;
const known: KnownParty[] = [
  ...scenario.projects.map((p) => ({ id: p.projectId, name: p.name })),
  ...scenario.customers.map((c) => ({ id: c.customerId, name: c.name })),
];
const messages: InboxMessage[] = file.messages.map(({ id, channel, receivedAt, sender, text }) => ({ id, channel, receivedAt, sender, text }));
const result = processInbox(messages, known);
const byId = new Map(result.messages.map((m) => [m.message.id, m]));
const FIELDS = ["customer", "product", "volumeM3", "neededBy", "reference"] as const;

describe("grounding", () => {
  const msg = messages[0]!;
  const sample = extractWithRules(msg)[0]!;

  it("downgrades an invented volume, date, party and reference", () => {
    const bad: ExtractedLine = {
      ...sample,
      volumeM3: { ...sample.volumeM3, value: 7777 },
      neededBy: { ...sample.neededBy, value: "2026-12-25" },
      customer: { ...sample.customer, value: "Project Z" },
      reference: { value: "PO 9999", confidence: "confirmed", source: { start: 0, end: 4 }, reason: "" },
    };
    const { line, changes } = ground(msg, bad);
    expect(changes.map((c) => c.field).sort()).toEqual(["customer", "neededBy", "reference", "volumeM3"]);
    for (const f of [line.volumeM3, line.neededBy, line.customer, line.reference]) expect(f.confidence).toBe("inferred");
  });

  it("downgrades to missing when there is no source span at all", () => {
    const { line } = ground(msg, { ...sample, volumeM3: { value: 4242, confidence: "confirmed", source: null, reason: "" } });
    expect(line.volumeM3).toMatchObject({ value: null, confidence: "missing" });
    expect(line.tier).toBe("possible");
  });

  it("keeps a correct value written differently", () => {
    const { changes } = ground({ ...msg, text: "Project A site need 1500 m³ AAC 100 mm by 20 oct" }, sample);
    expect(changes).toEqual([]);
  });

  it("is idempotent and never raises confidence (seeded random corruption over every sample)", () => {
    const rank = { missing: 0, conflicting: 0, inferred: 1, confirmed: 2 } as const;
    let seed = 7;
    const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    for (const m of messages) {
      for (const l of extractWithRules(m)) {
        const corrupt: ExtractedLine = { ...l, volumeM3: { ...l.volumeM3, value: Math.floor(rnd() * 90000) + 10001, confidence: "confirmed", source: { start: 0, end: 1 } } };
        const once = ground(m, corrupt);
        const twice = ground(m, once.line);
        expect(twice.line).toEqual(once.line);
        expect(twice.changes).toEqual([]);
        for (const k of FIELDS) expect(rank[once.line[k].confidence]).toBeLessThanOrEqual(rank[corrupt[k].confidence]);
      }
    }
  });
});

describe("matching", () => {
  it("resolves aliases, keeps a slash pair ambiguous, and reports unknown parties", () => {
    expect(matchParty("Site A", known)).toMatchObject({ chosen: "project-a", confidence: "confirmed" });
    expect(matchParty("Projek C", known)).toMatchObject({ chosen: "project-c" });
    expect(matchParty("Contractor B", known)).toMatchObject({ chosen: "contractor-b" });
    expect(matchParty("Proj A/B", known)).toMatchObject({ chosen: null, confidence: "conflicting", candidates: ["project-a", "project-b"] });
    expect(matchParty("Project Z", known)).toMatchObject({ chosen: null, confidence: "missing" });
    expect(matchParty(null, known).chosen).toBeNull();
  });
});

describe("the pipeline on the authored samples", () => {
  it("agrees with every message's gold: party resolution, needs-a-person, relations, flags", () => {
    const misses: string[] = [];
    for (const m of file.messages) {
      const got = byId.get(m.id)!;
      if (got.needsPerson !== m.gold.needsPerson) misses.push(`${m.id} needsPerson ${got.needsPerson} want ${m.gold.needsPerson}`);
      const rel = got.lines[0]?.relatesTo ?? null;
      if (rel?.id !== m.gold.relatesTo?.id || rel?.kind !== m.gold.relatesTo?.kind) misses.push(`${m.id} relation ${JSON.stringify(rel)} want ${JSON.stringify(m.gold.relatesTo)}`);
      if (JSON.stringify(got.flags) !== JSON.stringify(m.gold.flags ?? [])) misses.push(`${m.id} flags ${got.flags}`);
      m.gold.lines.forEach((g, i) => {
        const p = got.lines[i];
        if (!p) return;
        if (p.party.chosen !== g.partyId) misses.push(`${m.id} party ${p.party.chosen} want ${g.partyId}`);
        if (g.partyCandidates && JSON.stringify(p.party.candidates) !== JSON.stringify(g.partyCandidates)) misses.push(`${m.id} candidates ${p.party.candidates}`);
      });
    }
    expect(misses).toEqual([]);
  });

  it("flags the slide-8 message for a person with the reason 'no call-off yet'", () => {
    const p = byId.get("msg-01")!.lines[0]!;
    expect(p.needsPerson).toBe(true);
    expect(p.reasons.join(" | ")).toContain("no PO or call-off number yet");
  });

  it("links a duplicate and does not drop it", () => {
    const m = byId.get("msg-15")!;
    expect(m.lines).toHaveLength(1);
    expect(m.lines[0]!.relatesTo).toEqual({ id: "msg-03", kind: "duplicate" });
  });

  it("the two story messages equal the scenario's story requests (party and volume)", () => {
    const a = byId.get("msg-02")!.lines[0]!;
    const b = byId.get("msg-03")!.lines[0]!;
    const story = scenario.requests.filter((r) => r.week === "2026-W43");
    expect(story.some((r) => r.partyId === a.party.chosen && r.volumeM3 === a.line.volumeM3.value)).toBe(true);
    expect(story.some((r) => r.partyId === b.party.chosen && r.volumeM3 === b.line.volumeM3.value)).toBe(true);
  });

  it("nothing is 'confirmed' without being in the text, and an injection approves nothing", () => {
    for (const pm of result.messages) for (const l of pm.lines) expect(ground(pm.message, l.line).changes, pm.message.id).toEqual([]);
    const inj = byId.get("msg-20")!;
    expect(inj.needsPerson).toBe(true);
    expect(inj.lines[0]!.line.tier).not.toBe("firm");
  });

  it("is deterministic", () => {
    expect(processInbox(messages, known)).toEqual(result);
  });
});
