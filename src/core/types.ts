// Plain types for the deterministic core. No zod, no framework: src/core must stay importable
// by tests and server code alike. src/data/schema.ts validates files into these shapes (a
// compile-time check in schema.test.ts keeps the two in step).

/** ISO week label, e.g. "2026-W43". Lexicographic order is chronological order. */
export type Week = string;

/** How certain a demand line is (context 03 §4). */
export type Tier = "firm" | "likely" | "possible";

export type Side = "internal" | "external";

/** Delay-cost card: one per internal project (context 03 §4). */
export interface ProjectCard {
  projectId: string;
  /** Sum of purchase prices of the units that this material supply affects, in RM. */
  purchasePriceRM: number;
  /** Date handover would happen if materials arrive on time (ISO date). */
  projectedHandover: string;
  /** Contractual handover deadline (ISO date). */
  handoverDeadline: string;
  /** Float after the deadline before liquidated damages start accruing, in days. */
  bufferDays: number;
  /** Idle site cost per day once the project is stalled, in RM. 0 when unknown (no public source). */
  idleSiteCostPerDayRM: number;
  /**
   * Days of handover slip caused by one day of material delay, 0..1. 1 = every day of delay slips
   * the whole handover by a day. Research 01 §3: the headline "RM300m block" figure assumes 1.
   */
  scheduleSensitivity: number;
}

/** Margin card: one per outside customer (context 03 §4). */
export interface CustomerCard {
  customerId: string;
  pricePerM3RM: number;
  variableCostPerM3RM: number;
  keyAccount: boolean;
  /** Extra RM at stake if this customer is lost, on top of the order margin. 0 when unknown. */
  lossRiskRM: number;
}

/** A new request competing for scarce capacity, already priced by the caller. */
export interface PricedRequest {
  id: string;
  side: Side;
  volumeM3: number;
  /** The week the requester wants it (ISO week label). */
  requestedWeek: Week;
  /** ISO date the request was confirmed; the earlier one wins a close call. */
  confirmedOn: string;
  /**
   * RM lost by pushing this request back one more week, given it has already been pushed back
   * `weeksAlreadyDeferred` weeks. Internal: cost of delay. External: contribution margin + loss risk.
   */
  deferralCostRM: (weeksAlreadyDeferred: number) => number;
}

/** Capacity for one week after confirmed orders and active reservations are taken out. */
export interface WeekCapacity {
  week: Week;
  capacityM3: number;
  /** Firm confirmed orders plus active reservations. The rule never takes this back (promises kept). */
  committedM3: number;
}
