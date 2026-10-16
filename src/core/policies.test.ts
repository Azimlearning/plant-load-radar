import { describe, expect, it } from "vitest";
import { comparePolicies } from "./policies";
import type { PricedRequest, WeekCapacity } from "./types";

const req = (id: string, side: "internal" | "external", volumeM3: number, confirmedOn: string, cost: number): PricedRequest => ({ id, side, volumeM3, requestedWeek: "w", confirmedOn, deferralCostRM: () => cost });
const week: WeekCapacity = { week: "w", capacityM3: 2000, committedM3: 200 }; // 1,800 free

// The story's shape: an outside order confirmed first, a project that cannot wait last, two projects with float.
const set = [req("B", "external", 600, "2026-10-07", 18000), req("D", "internal", 650, "2026-10-09", 0), req("C", "internal", 1050, "2026-10-15", 0), req("A", "internal", 1500, "2026-10-16", 435000)];
const get = (id: string) => comparePolicies([week], set, "w").find((p) => p.policy === id)!;

describe("one contested week under four policies", () => {
  it("the ringgit rule serves the project that cannot wait and lets the outside order wait", () => {
    expect(get("ringgit-at-stake")).toMatchObject({ servedIds: ["A"], waitingRM: 18000 });
    expect(get("ringgit-at-stake").waitingIds.sort()).toEqual(["B", "C", "D"]);
  });
  it("first confirmed first serves the early outside order and lets the project that cannot wait pay", () => {
    expect(get("first-confirmed")).toMatchObject({ servedIds: ["B", "D"], waitingRM: 435000 });
  });
  it("internal first fills the week with projects that have float and still lets the one that cannot wait pay, plus the outside order", () => {
    expect(get("internal-first").servedIds).toEqual(["D", "C"]);
    expect(get("internal-first").waitingRM).toBe(453000);
  });
  it("outside first makes the project that cannot wait pay", () => {
    expect(get("outside-first").waitingRM).toBe(435000);
  });
  it("with float on the project, internal first now charges an outside order for nothing, and the rule does not", () => {
    const floaty = [req("B", "external", 600, "2026-10-07", 18000), req("A", "internal", 1500, "2026-10-16", 0)];
    const out = comparePolicies([week], floaty, "w");
    expect(out.find((p) => p.policy === "ringgit-at-stake")!.waitingRM).toBe(0);
    expect(out.find((p) => p.policy === "internal-first")!.waitingRM).toBe(18000);
  });
  it("no policy serves more than the week has free, and no request is both served and waiting", () => {
    for (const p of comparePolicies([week], set, "w")) {
      const served = set.filter((r) => p.servedIds.includes(r.id)).reduce((t, r) => t + r.volumeM3, 0);
      expect(served).toBeLessThanOrEqual(1800);
      expect(p.servedIds.filter((id) => p.waitingIds.includes(id))).toEqual([]);
      expect(p.servedIds.length + p.waitingIds.length).toBe(set.length);
    }
  });
  it("refuses an unknown week", () => {
    expect(() => comparePolicies([week], set, "nope")).toThrow(/Unknown week/);
  });
});
