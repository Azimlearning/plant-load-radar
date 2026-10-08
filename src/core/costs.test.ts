import { describe, expect, it } from "vitest";
import {
  contributionMarginRM,
  dailyDelayRateRM,
  delayCostPerDayRM,
  externalValueRM,
  slipCostRM,
  workingCapitalCostPerYearRM,
} from "./costs";
import type { CustomerCard, ProjectCard } from "./types";

// All figures below are ILLUSTRATIVE test fixtures (the deck's worked example), not Chin Hin data.
const bigBlock: ProjectCard = {
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

describe("delay cost (LAD)", () => {
  it("reproduces the pitch's worked example: RM300m block past deadline = 82,191.78 a day", () => {
    expect(dailyDelayRateRM(bigBlock)).toBeCloseTo(82_191.78, 2);
    expect(delayCostPerDayRM(bigBlock, "2026-11-02")).toBeCloseTo(82_191.78, 2);
  });

  it("is zero on or before the deadline", () => {
    expect(delayCostPerDayRM(bigBlock, "2026-11-01")).toBe(0);
    expect(delayCostPerDayRM(bigBlock, "2026-10-15")).toBe(0);
  });

  it("starts only after deadline plus buffer days", () => {
    const withBuffer = { ...bigBlock, bufferDays: 10 };
    expect(delayCostPerDayRM(withBuffer, "2026-11-11")).toBe(0);
    expect(delayCostPerDayRM(withBuffer, "2026-11-12")).toBeGreaterThan(0);
  });

  it("adds idle site cost to the daily rate", () => {
    const stalled = { ...bigBlock, idleSiteCostPerDayRM: 5_000 };
    expect(dailyDelayRateRM(stalled)).toBeCloseTo(82_191.78 + 5_000, 2);
  });

  it("matches a single-unit LAD example: RM500,000 unit, 30 days late = 4,109.59", () => {
    const unit = { ...bigBlock, purchasePriceRM: 500_000 };
    expect(dailyDelayRateRM(unit) * 30).toBeCloseTo(4_109.59, 2);
  });
});

describe("slip cost (what a week of waiting costs)", () => {
  it("charges a full week when the project is already past its deadline", () => {
    expect(slipCostRM(bigBlock, 7)).toBeCloseTo(7 * 82_191.78, 1);
  });

  it("is free while the slip stays inside the float", () => {
    const early = { ...bigBlock, projectedHandover: "2026-10-01" }; // 31 days of float
    expect(slipCostRM(early, 7)).toBe(0);
  });

  it("charges only the part of the slip that crosses the threshold", () => {
    const nearEdge = { ...bigBlock, projectedHandover: "2026-10-29" }; // 3 days of float
    expect(slipCostRM(nearEdge, 7)).toBeCloseTo(4 * 82_191.78, 1);
  });

  it("scales with schedule sensitivity", () => {
    const half = { ...bigBlock, scheduleSensitivity: 0.5 };
    expect(slipCostRM(half, 7)).toBeCloseTo(0.5 * 7 * 82_191.78, 1);
  });

  it("rejects a negative delay", () => {
    expect(() => slipCostRM(bigBlock, -1)).toThrow();
  });
});

describe("margin and carrying cost", () => {
  it("contribution margin = volume × (price − variable cost)", () => {
    expect(contributionMarginRM(600, contractorB)).toBe(18_000);
  });

  it("outside value adds loss risk to margin", () => {
    expect(externalValueRM(600, { ...contractorB, lossRiskRM: 7_000 })).toBe(25_000);
  });

  it("working capital: RM5m excess at a 25% rate = RM1.25m a year", () => {
    expect(workingCapitalCostPerYearRM(5_000_000, 0.25)).toBe(1_250_000);
  });
});
