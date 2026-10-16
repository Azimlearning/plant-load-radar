import { describe, expect, it } from "vitest";
import { dailyDelayRateRM } from "./costs";
import { delayAvoidedRM } from "./history";
import type { ProjectCard } from "./types";

const card = (projectId: string, purchasePriceRM: number): ProjectCard => ({
  projectId,
  purchasePriceRM,
  projectedHandover: "2026-12-01",
  handoverDeadline: "2026-12-01",
  bufferDays: 0,
  idleSiteCostPerDayRM: 0,
  scheduleSensitivity: 1,
});

describe("delay cost avoided from a seeded history", () => {
  const cards = [card("p1", 365_000_000), card("p2", 73_000_000)];
  it("adds each entry's days times that project's daily rate", () => {
    expect(delayAvoidedRM([{ projectId: "p1", daysAvoided: 2 }, { projectId: "p2", daysAvoided: 3 }], cards)).toBeCloseTo(2 * dailyDelayRateRM(cards[0]!) + 3 * dailyDelayRateRM(cards[1]!), 6);
  });
  it("is zero for no history", () => {
    expect(delayAvoidedRM([], cards)).toBe(0);
  });
  it("refuses a project it does not know and negative days", () => {
    expect(() => delayAvoidedRM([{ projectId: "zz", daysAvoided: 1 }], cards)).toThrow(/unknown project/);
    expect(() => delayAvoidedRM([{ projectId: "p1", daysAvoided: -1 }], cards)).toThrow(/>= 0/);
  });
});
