import { appendFileSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { recommendationFor, recommendationWithChoice } from "@/core/decision";
import { loadJsonDataset } from "@/data/loaders";
import { SyntheticScenarioSchema, type LedgerRow } from "@/data/schema";
import { toPricedRequests, toWeekCapacities } from "@/data/scenario";
import { SCENARIO_FILE } from "@/data/synth";
import { pendingWeeks, recordDecision, type DecisionInput } from "./decide";
import { appendRow, fileStore, LedgerError, readLedger, type Store } from "./store";

const scenario = loadJsonDataset(SCENARIO_FILE, SyntheticScenarioSchema, join(process.cwd(), "data")).data;
const weeks = toWeekCapacities(scenario);
const reqs = toPricedRequests(scenario);
const WEEK = "2026-W43";
const rec = recommendationFor(weeks, reqs, WEEK);
const NOW = () => new Date("2026-10-12T02:00:00Z");

const memoryStore = (): Store & { rows: LedgerRow[] } => {
  const rows: LedgerRow[] = [];
  return { rows, read: () => [...rows], append: (r) => void rows.push(r) };
};
const approve = (over: Partial<DecisionInput> = {}): DecisionInput => ({ week: WEEK, mode: "approve", approvedBy: "Siti (scheduler)", note: "", ...over });

describe("the ledger file", () => {
  const tmp = () => join(mkdtempSync(join(tmpdir(), "plr-ledger-")), "nested", "ledger.jsonl");
  const store = memoryStore();
  const r = recordDecision(scenario, approve(), store, NOW);
  if (!r.ok) throw new Error("setup");
  const row = r.row;

  it("a missing file is an empty ledger; appending creates it and reads back in order", () => {
    const path = tmp();
    expect(readLedger(path)).toEqual([]);
    appendRow(row, path);
    appendRow({ ...row, id: "dec-2", week: "2026-W44" }, path);
    expect(readLedger(path).map((x) => x.id)).toEqual([row.id, "dec-2"]);
  });

  it("only ever appends: an existing line is never rewritten", () => {
    const path = tmp();
    appendRow(row, path);
    const before = readFileSync(path, "utf8");
    appendRow({ ...row, id: "dec-2", week: "2026-W44" }, path);
    expect(readFileSync(path, "utf8").startsWith(before)).toBe(true);
  });

  it("refuses to write a row with no approver or inconsistent totals, and writes nothing", () => {
    const path = tmp();
    expect(() => appendRow({ ...row, approvedBy: "" }, path)).toThrow();
    expect(() => appendRow({ ...row, servedValueRM: row.servedValueRM + 1 }, path)).toThrow();
    expect(readLedger(path)).toEqual([]);
  });

  it("fails loudly, naming the line, when the file has been damaged", () => {
    const path = tmp();
    appendRow(row, path);
    appendFileSync(path, "not json\n");
    expect(() => readLedger(path)).toThrow(LedgerError);
    expect(() => readLedger(path)).toThrow(/line 2/);
    const path2 = tmp();
    appendRow(row, path2);
    writeFileSync(path2, `${JSON.stringify({ ...row, approvedBy: "" })}\n`);
    expect(() => readLedger(path2)).toThrow(/not a valid row/);
  });

  it("the store module offers no way to update or delete", async () => {
    const mod = await import("./store");
    expect(Object.keys(mod).sort()).toEqual(["LEDGER_ENV", "LedgerError", "appendRow", "fileStore", "ledgerPath", "readLedger"]);
    expect(fileStore(tmp())).toHaveProperty("append");
  });
});

describe("recordDecision: approve", () => {
  it("writes one row with the calculator's ringgit on both sides, by a named person", () => {
    const store = memoryStore();
    const out = recordDecision(scenario, approve(), store, NOW);
    expect(out.ok).toBe(true);
    expect(store.rows).toHaveLength(1);
    const row = store.rows[0]!;
    expect(row).toMatchObject({ id: "dec-2026-W43", week: WEEK, approvedBy: "Siti (scheduler)", mode: "recommendation-approved", decidedAt: "2026-10-12T02:00:00.000Z" });
    expect(row.served.map((l) => [l.requestId, l.valueRM])).toEqual(rec.served.map((s) => [s.requestId, s.valueRM]));
    expect(row.deferred.map((l) => [l.requestId, l.valueRM, l.movedTo])).toEqual(rec.deferred.map((d) => [d.requestId, d.valueRM, d.movedTo]));
    expect(row.servedValueRM).toBeCloseTo(rec.served.reduce((t, s) => t + s.valueRM, 0));
  });

  it("ignores any number in the input: forged values never reach the ledger", () => {
    const store = memoryStore();
    const forged = { ...approve(), servedValueRM: 1, deferredValueRM: 99_999_999, served: [{ requestId: "x", valueRM: 5 }], volumeM3: 1, valueRM: 7 } as DecisionInput;
    const out = recordDecision(scenario, forged, store, NOW);
    expect(out.ok).toBe(true);
    const row = store.rows[0]!;
    expect(row.servedValueRM).toBeCloseTo(rec.served.reduce((t, s) => t + s.valueRM, 0));
    expect(row.deferredValueRM).not.toBe(99_999_999);
    expect(row.served.some((l) => l.requestId === "x")).toBe(false);
  });

  it("refuses an empty or blank name, a missing mode, an unknown week, and writes nothing", () => {
    const store = memoryStore();
    expect(recordDecision(scenario, approve({ approvedBy: "" }), store, NOW)).toMatchObject({ ok: false, error: "name-required" });
    expect(recordDecision(scenario, approve({ approvedBy: "   " }), store, NOW)).toMatchObject({ ok: false, error: "name-required" });
    expect(recordDecision(scenario, approve({ approvedBy: 42 }), store, NOW)).toMatchObject({ ok: false, error: "name-required" });
    expect(recordDecision(scenario, approve({ mode: "auto" }), store, NOW)).toMatchObject({ ok: false, error: "bad-mode" });
    expect(recordDecision(scenario, approve({ week: "2026-W41" }), store, NOW)).toMatchObject({ ok: false, error: "unknown-week" });
    expect(recordDecision(scenario, approve({ week: "nonsense" }), store, NOW)).toMatchObject({ ok: false, error: "unknown-week" });
    expect(store.rows).toEqual([]);
  });

  it("refuses a second decision for the same week", () => {
    const store = memoryStore();
    expect(recordDecision(scenario, approve(), store, NOW).ok).toBe(true);
    expect(recordDecision(scenario, approve({ approvedBy: "Someone else" }), store, NOW)).toMatchObject({ ok: false, error: "already-decided" });
    expect(store.rows).toHaveLength(1);
  });

  it("has no automatic path: the only mode values that write are the two a person chooses", () => {
    const store = memoryStore();
    for (const mode of [undefined, null, "", "auto", "auto-approve", true]) {
      expect(recordDecision(scenario, approve({ mode }), store, NOW).ok).toBe(false);
    }
    expect(store.rows).toEqual([]);
  });
});

describe("recordDecision: change", () => {
  const pushedBack = rec.deferred[0]!;

  it("serves the chosen request first and recomputes both sides with the calculator", () => {
    const store = memoryStore();
    const out = recordDecision(scenario, approve({ mode: "change", chosenRequestId: pushedBack.requestId, note: "Key customer call" }), store, NOW);
    expect(out.ok).toBe(true);
    const expected = recommendationWithChoice(weeks, reqs, WEEK, pushedBack.requestId);
    const row = store.rows[0]!;
    expect(row.mode).toBe("changed-by-scheduler");
    expect(row.note).toBe("Key customer call");
    expect(row.served[0]!.requestId).toBe(pushedBack.requestId);
    expect(row.served.map((l) => l.requestId)).toEqual(expected.served.map((s) => s.requestId));
    expect(row.deferred.map((l) => l.requestId)).toEqual(expected.deferred.map((d) => d.requestId));
    const servedVolume = row.served.reduce((t, l) => t + l.volumeM3, 0);
    expect(servedVolume).toBeLessThanOrEqual(rec.freeM3);
  });

  it("every request is accounted for exactly once, whether served or pushed back", () => {
    const expected = recommendationWithChoice(weeks, reqs, WEEK, pushedBack.requestId);
    const ids = [...expected.served, ...expected.deferred].map((e) => e.requestId).sort();
    const base = [...rec.served, ...rec.deferred].map((e) => e.requestId).sort();
    expect(ids).toEqual(base);
  });

  it("refuses a request the rule already serves, an unknown one, a missing one, and writes nothing", () => {
    const store = memoryStore();
    expect(recordDecision(scenario, approve({ mode: "change", chosenRequestId: rec.served[0]!.requestId }), store, NOW)).toMatchObject({ ok: false, error: "bad-choice" });
    expect(recordDecision(scenario, approve({ mode: "change", chosenRequestId: "req-nope" }), store, NOW)).toMatchObject({ ok: false, error: "bad-choice" });
    expect(recordDecision(scenario, approve({ mode: "change" }), store, NOW)).toMatchObject({ ok: false, error: "bad-choice" });
    expect(store.rows).toEqual([]);
  });

  it("refuses a request that is too big to fit this week's free capacity", () => {
    const tooBig = reqs.map((r) => (r.id === pushedBack.requestId ? { ...r, volumeM3: rec.freeM3 + 1 } : r));
    expect(() => recommendationWithChoice(weeks, tooBig, WEEK, pushedBack.requestId)).toThrow(/does not fit/);
  });
});

describe("pending decisions", () => {
  it("the contested week is pending until it has a ledger row, then it is not", () => {
    expect(pendingWeeks(scenario, [])).toEqual([WEEK]);
    expect(pendingWeeks(scenario, [WEEK])).toEqual([]);
  });
});
