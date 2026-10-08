import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { weekOfDate } from "@/core/weeks";
import { findMissingFiles, findUnmanifested, loadJsonDataset, loadManifest } from "@/data/loaders";
import { InboxFileSchema, SyntheticScenarioSchema, type GoldLine, type InboxMessageRecord } from "@/data/schema";
import { SCENARIO_FILE } from "@/data/synth";

const dir = join(process.cwd(), "data");
const { data: file } = loadJsonDataset("synthetic/inbox-samples.json", InboxFileSchema, dir);
const scenario = loadJsonDataset(SCENARIO_FILE, SyntheticScenarioSchema, dir).data;
const messages = file.messages;
const byId = new Map(messages.map((m) => [m.id, m]));
const allLines = messages.flatMap((m) => m.gold.lines.map((l) => ({ m, l })));

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Does the message show this ISO date, as "2026-10-20" or as "20 Oct"? */
const dateAppears = (text: string, iso: string): boolean => {
  const [, mo, d] = iso.split("-").map(Number) as [number, number, number];
  return text.includes(iso) || new RegExp(`\\b${d} ${MONTHS[mo - 1]}\\b`, "i").test(text);
};

describe("the sample file", () => {
  it("is valid, in the manifest as 'synthetic', and the manifest audits stay clean", () => {
    expect(messages.length).toBe(22);
    expect(loadManifest(dir).find((e) => e.file === "synthetic/inbox-samples.json")?.kind).toBe("synthetic");
    expect(findUnmanifested(dir)).toEqual([]);
    expect(findMissingFiles(dir)).toEqual([]);
  });

  it("contains the deck's slide-8 message, verbatim", () => {
    expect(messages.some((m) => m.text === "Boss, Project A site need 1,500 m3 AAC 100mm by Tue 20 Oct. Can confirm ya")).toBe(true);
  });

  it("covers the hard cases: every confidence state, chatter, duplicates, an injection, a spreadsheet row, two orders in one message", () => {
    const states = new Set(allLines.flatMap(({ l }) => [l.customer[1], l.product[1], l.volumeM3[1], l.neededBy[1], l.reference[1]]));
    expect([...states].sort()).toEqual(["confirmed", "conflicting", "inferred", "missing"]);
    expect(messages.some((m) => m.gold.lines.length === 0)).toBe(true);
    expect(messages.filter((m) => m.gold.relatesTo?.kind === "duplicate").length).toBeGreaterThan(0);
    expect(messages.filter((m) => m.gold.relatesTo?.kind === "confirms").length).toBeGreaterThan(0);
    expect(messages.some((m) => m.gold.flags?.includes("injection-attempt"))).toBe(true);
    expect(messages.some((m) => m.channel === "excel")).toBe(true);
    expect(messages.some((m) => m.gold.lines.length > 1)).toBe(true);
    expect(allLines.some(({ l }) => l.partyId === null && (l.partyCandidates?.length ?? 0) > 1)).toBe(true);
    expect(allLines.some(({ l }) => l.expectRulesLimit)).toBe(true); // at least one case the rules are expected not to read
  });
});

describe("the gold labels are consistent with themselves (so a mismatch later points at the code, not the labels)", () => {
  it("every missing or conflicting field has a null value, and every confirmed or inferred one has a value", () => {
    for (const { m, l } of allLines) {
      for (const [name, cell] of Object.entries({ customer: l.customer, product: l.product, volumeM3: l.volumeM3, neededBy: l.neededBy, reference: l.reference })) {
        const [value, conf] = cell as [unknown, string];
        if (conf === "missing" || conf === "conflicting") expect(value, `${m.id} ${name}`).toBeNull();
        else expect(value, `${m.id} ${name}`).not.toBeNull();
      }
    }
  });

  it("every 'confirmed' value can be found in its message (the property the grounding check enforces)", () => {
    for (const { m, l } of allLines) {
      if (l.customer[1] === "confirmed") expect(m.text.toLowerCase(), `${m.id} customer`).toContain(String(l.customer[0]).toLowerCase());
      if (l.reference[1] === "confirmed") expect(m.text, `${m.id} reference`).toContain(String(l.reference[0]));
      if (l.volumeM3[1] === "confirmed") {
        const v = l.volumeM3[0] as number;
        const forms = [String(v), v.toLocaleString("en-US")];
        expect(forms.some((f) => m.text.includes(f)), `${m.id} volume ${v}`).toBe(true);
      }
      if (l.neededBy[1] === "confirmed") expect(dateAppears(m.text, l.neededBy[0] as string), `${m.id} date`).toBe(true);
    }
  });

  it("a weekday written next to a date matches that date (catches authoring mistakes like 'Tue 21 Oct')", () => {
    const re = /\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun) (\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/g;
    let checked = 0;
    for (const m of messages) {
      for (const [, wd, d, mon] of m.text.matchAll(re)) {
        const iso = `2026-${String(MONTHS.indexOf(mon!) + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        expect(WEEKDAYS[new Date(`${iso}T00:00:00Z`).getUTCDay()], `${m.id}: ${wd} ${d} ${mon}`).toBe(wd);
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThanOrEqual(8);
  });

  it("a duplicate or confirmation points at an earlier message, and the earlier one exists", () => {
    for (const m of messages.filter((x) => x.gold.relatesTo)) {
      const other = byId.get(m.gold.relatesTo!.id)!;
      expect(other.receivedAt < m.receivedAt || m.gold.relatesTo!.kind === "confirms", m.id).toBe(true);
      expect(other.gold.lines.length).toBeGreaterThan(0);
    }
  });

  it("tiers follow the stated rule: a reference means firm; any missing or conflicting field means possible; otherwise likely", () => {
    for (const { m, l } of allLines) {
      const incomplete = [l.customer, l.product, l.volumeM3, l.neededBy].some((c) => c[1] === "missing" || c[1] === "conflicting");
      const expected = incomplete ? "possible" : l.reference[0] ? "firm" : "likely";
      expect(l.tier, m.id).toBe(expected);
    }
  });

  it("a message needs a person unless it is a complete, firm, unique order or not an order at all", () => {
    for (const m of messages) {
      const clean = m.gold.lines.every((l: GoldLine) => l.tier === "firm" && [l.customer, l.product, l.volumeM3, l.neededBy].every((c) => c[1] === "confirmed") && l.partyId !== null) && !m.gold.relatesTo && !m.gold.flags;
      expect(m.gold.needsPerson, m.id).toBe(!clean);
    }
  });
});

describe("honesty of the samples", () => {
  it("every party is one of the fictional ones (A to J) and every sender says it is fictional", () => {
    for (const { m, l } of allLines) {
      expect(String(l.customer[0]), m.id).toMatch(/^(Project|Projek|Proj|Site|Contractor) [A-J](\/[A-J])?$/);
    }
    for (const m of messages) expect(m.sender, m.id).toMatch(/fictional/);
  });

  it("no real company or person from the project's context appears in any message", () => {
    const real = /Chin Hin|Starken|G-Cast|Kabel|Azim|Aleef|Widad|Abel|Serendah|Kota Tinggi/i;
    for (const m of messages) expect(m.text, m.id).not.toMatch(real);
  });

  it("the file says it is synthetic and that agreement shows behaviour, not accuracy", () => {
    expect(file.meta.note).toMatch(/invented/i);
    expect(file.meta.note).toMatch(/not\s+real-world accuracy/);
  });
});

describe("the sample set agrees with the board's scenario", () => {
  const story = (id: string) => scenario.requests.find((r) => r.id === id)!;

  it("message 02 is the board's internal story request: Project A, 1,500 m3, week 43", () => {
    const l = byId.get("msg-02")!.gold.lines[0]!;
    const s = story("req-story-internal");
    expect(l.partyId).toBe(s.partyId);
    expect(l.volumeM3[0]).toBe(s.volumeM3);
    expect(weekOfDate(l.neededBy[0] as string)).toBe(s.week);
  });

  it("message 03 is the board's outside story request: Contractor B, 600 m3, week 43", () => {
    const l = byId.get("msg-03")!.gold.lines[0]!;
    const s = story("req-story-external");
    expect(l.partyId).toBe(s.partyId);
    expect(l.volumeM3[0]).toBe(s.volumeM3);
    expect(weekOfDate(l.neededBy[0] as string)).toBe(s.week);
  });

  it("every party the samples resolve to exists in the scenario", () => {
    const known = new Set([...scenario.projects.map((p) => p.projectId), ...scenario.customers.map((c) => c.customerId)]);
    for (const { m, l } of allLines) {
      if (l.partyId) expect(known.has(l.partyId), `${m.id} ${l.partyId}`).toBe(true);
      for (const c of l.partyCandidates ?? []) expect(known.has(c), `${m.id} candidate ${c}`).toBe(true);
    }
  });

  it("the slide-8 message and message 02 describe the same order, so it is a confirmation, not a second order", () => {
    const a = byId.get("msg-01")!.gold.lines[0]!;
    const b = byId.get("msg-02")!.gold.lines[0]!;
    expect([a.partyId, a.volumeM3[0], a.neededBy[0]]).toEqual([b.partyId, b.volumeM3[0], b.neededBy[0]]);
    expect(a.tier).toBe("likely");
    expect(b.tier).toBe("firm");
  });
});

// keep the type import used in a way tsc cannot elide it
export type _Msg = InboxMessageRecord;
