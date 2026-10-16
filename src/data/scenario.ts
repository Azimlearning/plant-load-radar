// Bridge between a loaded scenario and the deterministic core: turns files into the core's inputs.
// Server-side or test code only (no fs here, but it is the data layer's seam into src/core).

import { externalValueRM, slipCostRM } from "@/core/costs";
import { addDays } from "@/core/dates";
import { committedForWeek } from "@/core/fairness";
import { plannedWeeks } from "@/core/planner";
import type { PricedRequest, WeekCapacity } from "@/core/types";
import type { SyntheticScenario } from "./schema";

const DAYS_PER_WEEK = 7;

/** Date used when a scenario has no `asOf`: early enough that every unconfirmed reservation is still active. */
const BEFORE_ANY_RELEASE = "1970-01-01";

/** Capacity per week with firm orders and still-active reservations taken out as committed volume (slide 7, guardrail 2). */
export function toWeekCapacities(s: SyntheticScenario): WeekCapacity[] {
  const asOf = s.asOf ?? BEFORE_ANY_RELEASE;
  return s.capacity.map((c) => ({ week: c.week, capacityM3: c.capacityM3, committedM3: committedForWeek(s.firmOrders, s.reservations ?? [], c.week, asOf) }));
}

/**
 * Capacity as the decisions see it: the raw weeks with every short week that building ahead fully covers already
 * covered (ADR D-20). The chart and "ask the board" use the raw weeks; the rule, the decisions page and the ledger use these.
 */
export function toPlannedWeekCapacities(s: SyntheticScenario): WeekCapacity[] {
  return plannedWeeks(toWeekCapacities(s), toPricedRequests(s), s.plannerSettings.stockCapM3);
}

/**
 * Price each new request in ringgit (ADR D-13).
 *  - Internal: the extra delay cost of pushing it one more week, given it has already waited n weeks —
 *    the difference between the slip cost after n+1 weeks and after n weeks.
 *  - External: contribution margin plus loss risk (pessimistic; see D-13).
 */
export function toPricedRequests(s: SyntheticScenario): PricedRequest[] {
  const projects = new Map(s.projects.map((p) => [p.projectId, p]));
  const customers = new Map(s.customers.map((c) => [c.customerId, c]));
  return s.requests.map((r) => {
    if (r.side === "internal") {
      const card = projects.get(r.partyId);
      if (!card) throw new Error(`Request ${r.id}: unknown project ${r.partyId}`);
      return {
        id: r.id,
        side: r.side,
        volumeM3: r.volumeM3,
        requestedWeek: r.week,
        confirmedOn: r.confirmedOn,
        deferralCostRM: (n: number) => slipCostRM(card, DAYS_PER_WEEK * (n + 1)) - slipCostRM(card, DAYS_PER_WEEK * n),
      };
    }
    const customer = customers.get(r.partyId);
    if (!customer) throw new Error(`Request ${r.id}: unknown customer ${r.partyId}`);
    const value = externalValueRM(r.volumeM3, customer);
    return {
      id: r.id,
      side: r.side,
      volumeM3: r.volumeM3,
      requestedWeek: r.week,
      confirmedOn: r.confirmedOn,
      deferralCostRM: () => value,
    };
  });
}

/** The scenario with one project given `floatDays` of float: its projected handover moves that far inside deadline plus buffer. */
export function withProjectFloat(s: SyntheticScenario, projectId: string, floatDays: number): SyntheticScenario {
  return {
    ...s,
    projects: s.projects.map((p) => (p.projectId === projectId ? { ...p, projectedHandover: addDays(addDays(p.handoverDeadline, p.bufferDays), -floatDays) } : p)),
  };
}
