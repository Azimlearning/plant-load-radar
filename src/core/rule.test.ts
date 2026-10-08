import { describe, expect, it } from "vitest";
import { contributionMarginRM, slipCostRM } from "./costs";
import { decide } from "./rule";
import type { CustomerCard, PricedRequest, ProjectCard, WeekCapacity } from "./types";

// ILLUSTRATIVE fixtures reproducing the deck's week-43 story (context 03 §2). Not Chin Hin data.
const projectA: ProjectCard = {
  projectId: "project-a",
  purchasePriceRM: 300_000_000,
  projectedHandover: "2026-12-01",
  handoverDeadline: "2026-11-01",
  bufferDays: 0,
  idleSiteCostPerDayRM: 0,
  scheduleSensitivity: 1,
};
const contractorB: CustomerCard = {
  customerId: "contractor-b",
  pricePerM3RM: 230,
  variableCostPerM3RM: 200,
  keyAccount: false,
  lossRiskRM: 0,
};

const internal = (id: string, volumeM3: number, week: string, confirmedOn: string, card = projectA): PricedRequest => ({
  id,
  side: "internal",
  volumeM3,
  requestedWeek: week,
  confirmedOn,
  deferralCostRM: () => slipCostRM(card, 7),
});
const external = (id: string, volumeM3: number, week: string, confirmedOn: string, customer = contractorB): PricedRequest => ({
  id,
  side: "external",
  volumeM3,
  requestedWeek: week,
  confirmedOn,
  deferralCostRM: () => contributionMarginRM(volumeM3, customer),
});
const flat = (id: string, value: number, volumeM3: number, week: string, confirmedOn: string): PricedRequest => ({
  id,
  side: "external",
  volumeM3,
  requestedWeek: week,
  confirmedOn,
  deferralCostRM: () => value,
});

const weeks: WeekCapacity[] = [
  { week: "2026-W43", capacityM3: 10_000, committedM3: 8_500 }, // 1,500 free
  { week: "2026-W44", capacityM3: 10_000, committedM3: 5_900 }, // 4,100 free
];

describe("the worked example", () => {
  it("serves Project A in week 43 and moves Contractor B to week 44", () => {
    const d = decide(weeks, [
      internal("A", 1_500, "2026-W43", "2026-10-12"),
      external("B", 600, "2026-W43", "2026-10-01"),
    ]);

    const w43 = d.weeks.find((w) => w.week === "2026-W43")!;
    expect(w43.contested).toBe(true);
    expect(w43.served.map((s) => s.requestId)).toEqual(["A"]);
    expect(w43.deferred.map((s) => s.requestId)).toEqual(["B"]);
    // The ringgit on each side is recorded for the ledger.
    expect(w43.served[0]!.valueRM).toBeCloseTo(7 * 82_191.78, 1);
    expect(w43.deferred[0]!.valueRM).toBe(18_000);
    expect(w43.served[0]!.byCloseCall).toBe(false);

    expect(d.placements.find((p) => p.requestId === "A")).toMatchObject({ servedWeek: "2026-W43", status: "served" });
    expect(d.placements.find((p) => p.requestId === "B")).toMatchObject({
      servedWeek: "2026-W44",
      weeksDeferred: 1,
      status: "moved",
    });
  });

  it("gives the same answer whatever order the requests arrive in", () => {
    const reqs = [internal("A", 1_500, "2026-W43", "2026-10-12"), external("B", 600, "2026-W43", "2026-10-01")];
    const forward = decide(weeks, reqs);
    const backward = decide(weeks, [...reqs].reverse());
    expect(backward.weeks).toEqual(forward.weeks);
  });
});

describe("promises are kept", () => {
  it("never takes back committed capacity, however valuable the new request", () => {
    const full: WeekCapacity[] = [
      { week: "2026-W43", capacityM3: 1_000, committedM3: 1_000 },
      { week: "2026-W44", capacityM3: 1_000, committedM3: 0 },
    ];
    const d = decide(full, [internal("A", 500, "2026-W43", "2026-10-01")]);
    const w43 = d.weeks[0]!;
    expect(w43.committedM3).toBe(1_000);
    expect(w43.freeM3).toBe(0);
    expect(w43.served).toEqual([]);
    expect(d.placements[0]).toMatchObject({ servedWeek: "2026-W44", status: "moved" });
  });
});

describe("close call: first confirmed wins", () => {
  const cap: WeekCapacity[] = [
    { week: "2026-W43", capacityM3: 100, committedM3: 0 },
    { week: "2026-W44", capacityM3: 100, committedM3: 0 },
  ];

  it("the earlier confirmed request goes first when values are within 10%", () => {
    const d = decide(cap, [flat("late", 100, 100, "2026-W43", "2026-10-09"), flat("early", 95, 100, "2026-W43", "2026-10-01")]);
    expect(d.weeks[0]!.served.map((s) => s.requestId)).toEqual(["early"]);
    expect(d.weeks[0]!.served[0]!.byCloseCall).toBe(true);
  });

  it("the higher value wins when the gap is wider than 10%", () => {
    const d = decide(cap, [flat("late", 100, 100, "2026-W43", "2026-10-09"), flat("early", 85, 100, "2026-W43", "2026-10-01")]);
    expect(d.weeks[0]!.served.map((s) => s.requestId)).toEqual(["late"]);
  });
});

describe("move before you refuse", () => {
  it("offers the next week with room", () => {
    const cap: WeekCapacity[] = [
      { week: "2026-W43", capacityM3: 100, committedM3: 100 },
      { week: "2026-W44", capacityM3: 100, committedM3: 100 },
      { week: "2026-W45", capacityM3: 100, committedM3: 0 },
    ];
    const d = decide(cap, [flat("x", 10, 80, "2026-W43", "2026-10-01")]);
    expect(d.placements[0]).toMatchObject({ servedWeek: "2026-W45", weeksDeferred: 2, status: "moved" });
  });

  it("marks a request unplaced only when no week in the horizon has room", () => {
    const cap: WeekCapacity[] = [{ week: "2026-W43", capacityM3: 100, committedM3: 100 }];
    const d = decide(cap, [flat("x", 10, 80, "2026-W43", "2026-10-01")]);
    expect(d.placements[0]).toMatchObject({ servedWeek: null, status: "unplaced", weeksDeferred: 1 });
  });

  it("re-prices a request each week it is deferred", () => {
    const cap: WeekCapacity[] = [
      { week: "2026-W43", capacityM3: 100, committedM3: 100 },
      { week: "2026-W44", capacityM3: 100, committedM3: 0 },
    ];
    const growing: PricedRequest = {
      ...flat("g", 0, 50, "2026-W43", "2026-10-01"),
      deferralCostRM: (n) => 1_000 * (n + 1),
    };
    const d = decide(cap, [growing]);
    expect(d.weeks[0]!.deferred[0]!.valueRM).toBe(1_000); // first time deferred
    expect(d.weeks[1]!.served[0]!.valueRM).toBe(2_000); // after one deferral
  });
});

describe("capacity is not left idle", () => {
  it("serves a smaller lower-ranked request when the top one does not fit", () => {
    const cap: WeekCapacity[] = [
      { week: "2026-W43", capacityM3: 100, committedM3: 0 },
      { week: "2026-W44", capacityM3: 200, committedM3: 0 },
    ];
    const d = decide(cap, [flat("big", 1_000, 150, "2026-W43", "2026-10-01"), flat("small", 10, 60, "2026-W43", "2026-10-02")]);
    expect(d.weeks[0]!.served.map((s) => s.requestId)).toEqual(["small"]);
    expect(d.placements.find((p) => p.requestId === "big")).toMatchObject({ servedWeek: "2026-W44" });
  });
});

describe("input checks", () => {
  const cap: WeekCapacity[] = [{ week: "2026-W43", capacityM3: 100, committedM3: 0 }];
  it("rejects duplicate request ids", () => {
    expect(() => decide(cap, [flat("x", 1, 1, "2026-W43", "2026-10-01"), flat("x", 1, 1, "2026-W43", "2026-10-01")])).toThrow(/Duplicate/);
  });
  it("rejects a non-positive volume", () => {
    expect(() => decide(cap, [flat("x", 1, 0, "2026-W43", "2026-10-01")])).toThrow(/volumeM3/);
  });
  it("treats over-committed weeks as zero free capacity, not negative", () => {
    const over: WeekCapacity[] = [{ week: "2026-W43", capacityM3: 100, committedM3: 150 }];
    expect(decide(over, []).weeks[0]!.freeM3).toBe(0);
  });
});
