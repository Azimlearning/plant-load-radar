import { daysBetween, addDays } from "./dates";
import type { CustomerCard, ProjectCard } from "./types";

/**
 * Liquidated damages for late vacant possession: 10% a year of the purchase price, "calculated
 * from day to day" (Housing Development (Control and Licensing) Regulations 1989, Schedule G
 * clause 24 / Schedule H clause 25). Source: refdocs/research/01-problem-statement.md §3.
 */
export const LAD_RATE_PER_YEAR = 0.1;

/** LAD is counted daily on a 365-day year (research 01 §3; PropertyGuru worked example). */
export const DAYS_PER_YEAR = 365;

/**
 * RM per day while a project is past its deadline-plus-buffer: LAD on the affected purchase
 * price, plus idle site cost. This is the *raw* rate; scheduleSensitivity is applied in slipCostRM.
 */
export function dailyDelayRateRM(card: ProjectCard): number {
  return (card.purchasePriceRM * LAD_RATE_PER_YEAR) / DAYS_PER_YEAR + card.idleSiteCostPerDayRM;
}

/**
 * Delay cost per day on `asOf`: the raw daily rate once `asOf` is strictly past the handover
 * deadline plus buffer days, otherwise 0 (context 03 §9: "only once handover passes deadline").
 */
export function delayCostPerDayRM(card: ProjectCard, asOf: string): number {
  const thresholdPassedBy = daysBetween(addDays(card.handoverDeadline, card.bufferDays), asOf);
  return thresholdPassedBy > 0 ? dailyDelayRateRM(card) : 0;
}

/**
 * RM added by slipping the supply `materialDelayDays` days. Handover slips by
 * `materialDelayDays × scheduleSensitivity` days; only the part that falls beyond
 * deadline + buffer costs anything. A project with float absorbs a short delay for free.
 */
export function slipCostRM(card: ProjectCard, materialDelayDays: number): number {
  if (materialDelayDays < 0) throw new Error("materialDelayDays must be >= 0");
  const threshold = addDays(card.handoverDeadline, card.bufferDays);
  const overrunNow = Math.max(0, daysBetween(threshold, card.projectedHandover));
  const overrunAfter = Math.max(
    0,
    daysBetween(threshold, card.projectedHandover) + materialDelayDays * card.scheduleSensitivity,
  );
  return (overrunAfter - overrunNow) * dailyDelayRateRM(card);
}

/** Contribution margin on an order of `volumeM3`: volume × (price − variable cost) per m³. */
export function contributionMarginRM(volumeM3: number, customer: CustomerCard): number {
  if (volumeM3 < 0) throw new Error("volumeM3 must be >= 0");
  return volumeM3 * (customer.pricePerM3RM - customer.variableCostPerM3RM);
}

/** What an outside order is worth fighting for: its margin plus the customer's loss risk. */
export function externalValueRM(volumeM3: number, customer: CustomerCard): number {
  return contributionMarginRM(volumeM3, customer) + customer.lossRiskRM;
}

/**
 * Annual cost of holding excess stock: value × carrying rate. The rate is a required input
 * (a sourced range, never a literal here; research 01 §4 gives 20–30% as a generic upper range).
 */
export function workingCapitalCostPerYearRM(excessInventoryValueRM: number, annualCarryingRate: number): number {
  if (excessInventoryValueRM < 0 || annualCarryingRate < 0) throw new Error("inputs must be >= 0");
  return excessInventoryValueRM * annualCarryingRate;
}
