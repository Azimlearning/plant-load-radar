import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadJsonDataset } from "@/data/loaders";
import { InboxFileSchema } from "@/data/schema";
import { extractWithRules, detectFlags } from "./rules";
import type { ExtractedLine } from "./types";

const { data: file } = loadJsonDataset("synthetic/inbox-samples.json", InboxFileSchema, join(process.cwd(), "data"));
const byId = new Map(file.messages.map((m) => [m.id, m]));
const read = (id: string): ExtractedLine[] => extractWithRules(byId.get(id)!);
const cell = (l: ExtractedLine) => ({
  customer: [l.customer.value, l.customer.confidence],
  product: [l.product.value, l.product.confidence],
  volumeM3: [l.volumeM3.value, l.volumeM3.confidence],
  neededBy: [l.neededBy.value, l.neededBy.confidence],
  reference: [l.reference.value, l.reference.confidence],
});

describe("the rules reader on the authored samples", () => {
  it("reads the deck's slide-8 message exactly as the slide shows", () => {
    const [line, ...rest] = read("msg-01");
    expect(rest).toEqual([]);
    expect(cell(line!)).toEqual({
      customer: ["Project A", "confirmed"],
      product: ["AAC block 100 mm", "confirmed"],
      volumeM3: [1500, "confirmed"],
      neededBy: ["2026-10-20", "confirmed"],
      reference: [null, "missing"],
    });
    expect(line!.tier).toBe("likely");
    expect(line!.tierReason).toBe("no PO or call-off number yet");
  });

  it("matches the gold labels on every sample, except the ones marked as expected limits", () => {
    const misses: string[] = [];
    for (const m of file.messages) {
      const got = extractWithRules({ id: m.id, channel: m.channel, receivedAt: m.receivedAt, sender: m.sender, text: m.text });
      if (got.length !== m.gold.lines.length) { misses.push(`${m.id}: ${got.length} lines, expected ${m.gold.lines.length}`); continue; }
      m.gold.lines.forEach((g, i) => {
        if (g.expectRulesLimit) return;
        const c = cell(got[i]!);
        for (const k of ["customer", "product", "volumeM3", "neededBy", "reference"] as const) {
          const want = g[k] as [unknown, string];
          if (JSON.stringify(c[k]) !== JSON.stringify(want)) misses.push(`${m.id} ${k}: got ${JSON.stringify(c[k])}, want ${JSON.stringify(want)}`);
        }
        if (got[i]!.tier !== g.tier) misses.push(`${m.id} tier: got ${got[i]!.tier}, want ${g.tier}`);
        if (!got[i]!.tierReason.includes(g.tierReasonIncludes)) misses.push(`${m.id} tier reason: "${got[i]!.tierReason}" lacks "${g.tierReasonIncludes}"`);
      });
    }
    expect(misses).toEqual([]);
  });

  it("fails the documented way on cases it cannot read: unsure, never wrong-and-confident", () => {
    const limited = file.messages.flatMap((m) => m.gold.lines.map((g, i) => ({ m, g, i }))).filter(({ g }) => g.expectRulesLimit);
    expect(limited.length).toBeGreaterThan(0);
    for (const { m, g, i } of limited) {
      const got = extractWithRules({ id: m.id, channel: m.channel, receivedAt: m.receivedAt, sender: m.sender, text: m.text })[i]!;
      expect(got.volumeM3.confidence, m.id).toBe("missing");
      expect(got.volumeM3.value, m.id).toBeNull();
      expect(got.volumeM3.reason.length, m.id).toBeGreaterThan(0);
      expect(g.volumeM3[1]).not.toBe("confirmed");
    }
  });

  it("returns no lines for chatter", () => {
    expect(read("msg-18")).toEqual([]);
    expect(read("msg-19")).toEqual([]);
  });

  it("keeps a self-correction as conflicting, with no silent pick", () => {
    const [l] = read("msg-09");
    expect(l!.volumeM3).toMatchObject({ value: null, confidence: "conflicting" });
    expect(l!.volumeM3.reason).toContain("1,200");
    expect(l!.volumeM3.reason).toContain("1,500");
  });

  it("splits two orders in one message", () => {
    const lines = read("msg-16");
    expect(lines.map((l) => [l.customer.value, l.volumeM3.value, l.neededBy.value])).toEqual([
      ["Project D", 500, "2026-10-14"],
      ["Project F", 300, "2026-10-22"],
    ]);
  });

  it("reads an injection message as an ordinary order and flags it, approving nothing", () => {
    const [l] = read("msg-20");
    expect(l!.tier).toBe("likely");
    expect(detectFlags(byId.get("msg-20")!.text)).toEqual(["injection-attempt"]);
    expect(detectFlags(byId.get("msg-01")!.text)).toEqual([]);
  });

  it("gives every non-missing field a source span that holds its words, and every missing one none", () => {
    for (const m of file.messages) {
      for (const l of extractWithRules({ id: m.id, channel: m.channel, receivedAt: m.receivedAt, sender: m.sender, text: m.text })) {
        for (const f of [l.customer, l.product, l.volumeM3, l.neededBy, l.reference]) {
          if (f.confidence === "missing" || f.confidence === "conflicting") expect(f.value, m.id).toBeNull();
          else {
            expect(f.source, m.id).not.toBeNull();
            expect(m.text.slice(f.source!.start, f.source!.end).length, m.id).toBeGreaterThan(0);
          }
          if (f.confidence !== "confirmed") expect(f.reason.length, `${m.id} reason`).toBeGreaterThan(0);
        }
      }
    }
  });
});
