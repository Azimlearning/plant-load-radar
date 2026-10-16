// One contested week under different ways of choosing who waits (slide 4: "never yet combined at a plant").
// Each policy serves requests in its own order while they fit the week's free capacity; whoever does not fit waits one
// week, and what that wait costs is the request's own deferral cost. The rule itself is `decide` (src/core/rule.ts); the
// others are the simple habits a plant might use instead. This is one synthetic week, an illustration of how the choice
// changes who pays, not an estimate of any saving.

import { daysBetween } from "./dates";
import { decide } from "./rule";
import type { PricedRequest, Week, WeekCapacity } from "./types";

export type PolicyId = "ringgit-at-stake" | "first-confirmed" | "internal-first" | "outside-first";

export interface PolicyOutcome {
  policy: PolicyId;
  servedIds: string[];
  waitingIds: string[];
  /** What the requests that wait one week would cost, summed. */
  waitingRM: number;
}

/** Serve in the given order while each request still fits the remaining free capacity. */
function greedy(order: readonly PricedRequest[], freeM3: number): { served: PricedRequest[]; waiting: PricedRequest[] } {
  const served: PricedRequest[] = [];
  const waiting: PricedRequest[] = [];
  let left = freeM3;
  for (const r of order) {
    if (r.volumeM3 <= left) {
      served.push(r);
      left -= r.volumeM3;
    } else waiting.push(r);
  }
  return { served, waiting };
}

const byConfirmed = (a: PricedRequest, b: PricedRequest): number => daysBetween(b.confirmedOn, a.confirmedOn) || a.id.localeCompare(b.id);

export function comparePolicies(weeks: readonly WeekCapacity[], requests: readonly PricedRequest[], week: Week): PolicyOutcome[] {
  const w = weeks.find((x) => x.week === week);
  if (!w) throw new Error(`Unknown week ${week}`);
  const free = Math.max(0, w.capacityM3 - w.committedM3);
  const here = requests.filter((r) => r.requestedWeek === week);
  const cost = (rs: readonly PricedRequest[]): number => rs.reduce((t, r) => t + r.deferralCostRM(0), 0);
  const outcome = (policy: PolicyId, served: PricedRequest[], waiting: PricedRequest[]): PolicyOutcome => ({ policy, servedIds: served.map((r) => r.id), waitingIds: waiting.map((r) => r.id), waitingRM: cost(waiting) });

  // The rule, as the app runs it, on this week alone.
  const ruleWeek = decide([w], here).weeks.find((x) => x.week === week);
  const ruleServed = new Set(ruleWeek?.served.map((s) => s.requestId) ?? []);
  const out: PolicyOutcome[] = [
    outcome("ringgit-at-stake", here.filter((r) => ruleServed.has(r.id)), here.filter((r) => !ruleServed.has(r.id))),
  ];
  const sorted = [...here].sort(byConfirmed);
  const first = greedy(sorted, free);
  out.push(outcome("first-confirmed", first.served, first.waiting));
  const internal = greedy([...sorted.filter((r) => r.side === "internal"), ...sorted.filter((r) => r.side === "external")], free);
  out.push(outcome("internal-first", internal.served, internal.waiting));
  const outside = greedy([...sorted.filter((r) => r.side === "external"), ...sorted.filter((r) => r.side === "internal")], free);
  out.push(outcome("outside-first", outside.served, outside.waiting));
  return out;
}
