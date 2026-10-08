import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadJsonDataset } from "@/data/loaders";
import { SyntheticScenarioSchema, type LedgerRow } from "@/data/schema";
import { SCENARIO_FILE } from "@/data/synth";
import { recommendationFor } from "@/core/decision";
import { toPricedRequests, toWeekCapacities } from "@/data/scenario";
import { decodeRows, encodeRows, isGenuine, MAX_COOKIE_CHARS } from "./cookie-ledger";
import { recordDecision } from "./decide";

const scenario = loadJsonDataset(SCENARIO_FILE, SyntheticScenarioSchema, join(process.cwd(), "data")).data;
const NOW = () => new Date("2026-10-12T02:00:00Z");
const WEEK = "2026-W43";

function record(input: Parameters<typeof recordDecision>[1]): LedgerRow {
  const rows: LedgerRow[] = [];
  const out = recordDecision(scenario, input, { read: () => rows, append: (r) => void rows.push(r) }, NOW);
  if (!out.ok) throw new Error(out.message);
  return out.row;
}
const approved = record({ week: WEEK, mode: "approve", approvedBy: "Siti (scheduler)", note: "" });
const pushedBack = recommendationFor(toWeekCapacities(scenario), toPricedRequests(scenario), WEEK).deferred[0]!.requestId;
const changed = record({ week: WEEK, mode: "change", chosenRequestId: pushedBack, approvedBy: "Siti (scheduler)", note: "" });

describe("the per-browser ledger cookie", () => {
  it("round-trips a genuine approval and a genuine change", () => {
    expect(decodeRows(encodeRows([approved]), scenario)).toEqual([approved]);
    expect(decodeRows(encodeRows([changed]), scenario)).toEqual([changed]);
  });

  it("fits comfortably inside a cookie", () => {
    expect(encodeRows([approved]).length).toBeLessThan(MAX_COOKIE_CHARS);
  });

  it("a missing, empty or garbage cookie is simply an empty ledger", () => {
    for (const v of [undefined, "", "not-base64!!", encodeRows([]), Buffer.from("{}").toString("base64url"), Buffer.from("null").toString("base64url")]) {
      expect(decodeRows(v, scenario)).toEqual([]);
    }
    expect(decodeRows("x".repeat(MAX_COOKIE_CHARS * 3), scenario)).toEqual([]);
  });

  it("drops a row whose figures were edited: a forged total, line value, volume or party", () => {
    const forged: LedgerRow[] = [
      { ...approved, servedValueRM: 1, deferredValueRM: 99_999 },
      { ...approved, served: approved.served.map((l) => ({ ...l, valueRM: 7 })), servedValueRM: 7 },
      { ...approved, served: approved.served.map((l) => ({ ...l, volumeM3: l.volumeM3 + 1 })) },
      { ...approved, deferred: approved.deferred.map((l) => ({ ...l, partyId: "project-a" })) },
      { ...approved, deferred: approved.deferred.map((l) => ({ ...l, movedTo: "2026-W50" })) },
    ];
    for (const row of forged) {
      expect(isGenuine(scenario, row)).toBe(false);
      expect(decodeRows(encodeRows([row]), scenario)).toEqual([]);
    }
  });

  it("drops a row for a week that has no decision, a wrong id, or a change to a request that is not pushed back", () => {
    expect(decodeRows(encodeRows([{ ...approved, week: "2026-W44", id: "dec-2026-W44" }]), scenario)).toEqual([]);
    expect(decodeRows(encodeRows([{ ...approved, id: "dec-other" }]), scenario)).toEqual([]);
    expect(decodeRows(encodeRows([{ ...changed, mode: "changed-by-scheduler", served: approved.served }]), scenario)).toEqual([]);
  });

  it("keeps the person's own words (name and note) but never lets a second row for the same week through", () => {
    const renamed = { ...approved, approvedBy: "Judge One", note: "Looks right" };
    expect(decodeRows(encodeRows([renamed]), scenario)).toEqual([renamed]);
    expect(decodeRows(encodeRows([approved, renamed]), scenario)).toEqual([approved]);
  });

  it("rejects a blank approver even inside an otherwise genuine row", () => {
    expect(decodeRows(encodeRows([{ ...approved, approvedBy: "  " }]), scenario)).toEqual([]);
  });
});
