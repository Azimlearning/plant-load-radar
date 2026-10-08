import { describe, expect, it } from "vitest";
import { contributionMarginRM, slipCostRM } from "./costs";
import { prebuildAlternative, recommend, weekBalances } from "./planner";
import type { CustomerCard, PricedRequest, ProjectCard, WeekCapacity } from "./types";

// ILLUSTRATIVE fixtures (the deck's week-43 shape, scaled down so every number is checkable by hand).
const projectA: ProjectCard = {
  projectId: "a",
  purchasePriceRM: 300_000_000,
  projectedHandover: "2026-12-01",
  handoverDeadline: "2026-11-01",
  bufferDays: 0,
  idleSiteCostPerDayRM: 0,
  scheduleSensitivity: 1,
};
const contractorB: CustomerCard = { customerId: "b", pricePerM3RM: 230, variableCostPerM3RM: 200, keyAccount: false, lossRiskRM: 0 };

const A: PricedRequest = {
  id: "A", side: "internal", volumeM3: 8, requestedWeek: "2026-W43", confirmedOn: "2026-10-12",
  deferralCostRM: () => slipCostRM(projectA, 7),
};
const B: PricedRequest = {
  id: "B", side: "external", volumeM3: 5, requestedWeek: "2026-W43", confirmedOn: "2026-10-01",
  deferralCostRM: () => contributionMarginRM(5, contractorB),
};
const early: PricedRequest = {
  id: "E", side: "external", volumeM3: 10, requestedWeek: "2026-W41", confirmedOn: "2026-09-25",
  deferralCostRM: () => 1,
};

const weeks: WeekCapacity[] = [
  { week: "2026-W41", capacityM3: 100, committedM3: 40 }, // free 60, requested 10 -> spare +50
  { week: "2026-W42", capacityM3: 100, committedM3: 70 }, // free 30, requested 0  -> spare +30
  { week: "2026-W43", capacityM3: 100, committedM3: 90 }, // free 10, requested 13 -> spare -3
  { week: "2026-W44", capacityM3: 100, committedM3: 0 }, //  free 100 -> a huge spare AFTER the target
];
const requests = [early, A, B];

describe("weekBalances", () => {
  it("reports free, requested and spare/short for each week", () => {
    const b = weekBalances(weeks, requests);
    expect(b.map((x) => [x.week, x.freeM3, x.requestedM3, x.spareM3])).toEqual([
      ["2026-W41", 60, 10, 50],
      ["2026-W42", 30, 0, 30],
      ["2026-W43", 10, 13, -3],
      ["2026-W44", 100, 0, 100],
    ]);
  });

  it("sorts weeks and never reports negative free capacity", () => {
    const b = weekBalances([{ week: "2026-W44", capacityM3: 5, committedM3: 9 }, { week: "2026-W43", capacityM3: 5, committedM3: 0 }], []);
    expect(b.map((x) => x.week)).toEqual(["2026-W43", "2026-W44"]);
    expect(b[1]!.freeM3).toBe(0);
  });
});

describe("recommend", () => {
  const recs = recommend(weeks, requests);

  it("finds only the contested week", () => {
    expect(recs.map((r) => r.week)).toEqual(["2026-W43"]);
  });

  it("serves A, moves B to the next week, and shows the ringgit on each side", () => {
    const r = recs[0]!;
    expect(r.shortM3).toBe(3);
    expect(r.served.map((s) => s.requestId)).toEqual(["A"]);
    expect(r.deferred.map((d) => [d.requestId, d.movedTo])).toEqual([["B", "2026-W44"]]);
    expect(r.served[0]!.valueRM).toBeCloseTo(slipCostRM(projectA, 7), 6);
    expect(r.deferred[0]!.valueRM).toBe(contributionMarginRM(5, contractorB));
  });

  it("returns nothing when everything fits", () => {
    expect(recommend([{ week: "2026-W43", capacityM3: 100, committedM3: 0 }], [A, B])).toEqual([]);
  });

  it("reports an unplaced request as movedTo null", () => {
    const tight: WeekCapacity[] = [{ week: "2026-W43", capacityM3: 10, committedM3: 0 }];
    const r = recommend(tight, [A, B])[0]!;
    expect(r.deferred[0]).toMatchObject({ requestId: "B", movedTo: null });
  });
});

describe("prebuildAlternative", () => {
  const target = "2026-W43";

  it("with a zero cap changes nothing", () => {
    const alt = prebuildAlternative(weeks, requests, target, 0);
    expect(alt.moves).toEqual([]);
    expect(alt.coveredM3).toBe(0);
    expect(alt.residualShortM3).toBe(3);
    expect(alt.outcome?.deferred.map((d) => d.requestId)).toEqual(["B"]);
  });

  it("with a large cap covers the whole shortage and dissolves the contest", () => {
    const alt = prebuildAlternative(weeks, requests, target, 1_000);
    expect(alt.coveredM3).toBe(3);
    expect(alt.residualShortM3).toBe(0);
    expect(alt.outcome).toBeNull();
  });

  it("a partial cap reduces the residual shortage by exactly what it covers", () => {
    const alt = prebuildAlternative(weeks, requests, target, 2);
    expect(alt.coveredM3).toBe(2);
    expect(alt.residualShortM3).toBe(1);
    expect(alt.outcome?.deferred.map((d) => d.requestId)).toEqual(["B"]); // 12 free < 13 wanted: still contested
  });

  it("builds ahead only from weeks before the target, nearest first", () => {
    const alt = prebuildAlternative(weeks, requests, target, 1_000);
    expect(alt.moves.every((m) => m.fromWeek < target)).toBe(true);
    expect(alt.moves[0]).toMatchObject({ fromWeek: "2026-W42", toWeek: target, m3: 3 });
  });

  it("uses up the earlier week's spare, so its own requests are still served", () => {
    // E asks for 10 m3 in W41; building ahead in W41 must not push E out.
    const forced: WeekCapacity[] = [
      { week: "2026-W41", capacityM3: 100, committedM3: 85 }, // free 15, E wants 10 -> spare 5
      { week: "2026-W43", capacityM3: 100, committedM3: 90 },
    ];
    const alt = prebuildAlternative(forced, requests, target, 1_000);
    expect(alt.coveredM3).toBe(3);
    const after = alt.outcome;
    expect(after).toBeNull();
  });

  it("rejects an unknown target week", () => {
    expect(() => prebuildAlternative(weeks, requests, "2030-W01", 10)).toThrow(/Unknown week/);
  });
});
