// Bridge between a loaded scenario and the deterministic core: turns files into the core's inputs.
// Server-side or test code only (no fs here, but it is the data layer's seam into src/core).

import { externalValueRM, slipCostRM } from "@/core/costs";
import type { PricedRequest, WeekCapacity } from "@/core/types";
import type { SyntheticScenario } from "./schema";

const DAYS_PER_WEEK = 7;

/** Capacity per week with firm orders taken out as committed volume. */
export function toWeekCapacities(s: SyntheticScenario): WeekCapacity[] {
  const committed = new Map<string, number>();
  for (const o of s.firmOrders) committed.set(o.week, (committed.get(o.week) ?? 0) + o.volumeM3);
  return s.capacity.map((c) => ({ week: c.week, capacityM3: c.capacityM3, committedM3: committed.get(c.week) ?? 0 }));
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
