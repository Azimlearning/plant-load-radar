// What the scheduler may do with a contested week: accept the rule's recommendation, or change it by choosing
// a different request to serve. The calculator recomputes both sides either way, so the ledger can never say
// something the calculator did not (ADR D-18). Pure and deterministic: no I/O, no clock.

import { decide } from "./rule";
import { recommend, type Recommendation } from "./planner";
import type { PricedRequest, Week, WeekCapacity } from "./types";

export type DecisionRefusal = "unknown-week" | "bad-choice" | "does-not-fit";

export class DecisionError extends Error {
  constructor(
    readonly code: DecisionRefusal,
    message: string,
  ) {
    super(message);
    this.name = "DecisionError";
  }
}

/** The rule's own recommendation for a contested week. */
export function recommendationFor(weeks: readonly WeekCapacity[], requests: readonly PricedRequest[], week: Week): Recommendation {
  const rec = recommend(weeks, requests).find((r) => r.week === week);
  if (!rec) throw new DecisionError("unknown-week", `Week ${week} has no contested decision`);
  return rec;
}

/**
 * The same week when the scheduler overrules the rule and serves `chosenId` first. The chosen request is served
 * whole (it must fit the week's free capacity); the rule is then re-run on everything else with that capacity
 * taken out. Both sides' ringgit come from the requests' own pricing, as in the recommendation.
 */
export function recommendationWithChoice(
  weeks: readonly WeekCapacity[],
  requests: readonly PricedRequest[],
  week: Week,
  chosenId: string,
): Recommendation {
  const base = recommendationFor(weeks, requests, week);
  if (base.served.some((s) => s.requestId === chosenId)) {
    throw new DecisionError("bad-choice", "The rule already serves that request this week, so there is nothing to change");
  }
  const chosen = requests.find((r) => r.id === chosenId);
  if (!chosen || !base.deferred.some((d) => d.requestId === chosenId)) {
    throw new DecisionError("bad-choice", "That request is not one the rule pushed back this week");
  }
  if (chosen.volumeM3 > base.freeM3) {
    throw new DecisionError("does-not-fit", "That request does not fit in this week's free capacity");
  }

  const ordered = [...weeks].sort((a, b) => a.week.localeCompare(b.week)).map((w) => w.week);
  const weeksWaited = Math.max(0, ordered.indexOf(week) - ordered.indexOf(chosen.requestedWeek));
  const adjusted = weeks.map((w) => (w.week === week ? { ...w, committedM3: w.committedM3 + chosen.volumeM3 } : w));
  const rest = decide(
    adjusted,
    requests.filter((r) => r.id !== chosenId),
  );
  const after = rest.weeks.find((w) => w.week === week)!;

  return {
    week,
    freeM3: base.freeM3,
    demandM3: base.demandM3,
    shortM3: base.shortM3,
    served: [
      { requestId: chosen.id, side: chosen.side, volumeM3: chosen.volumeM3, valueRM: chosen.deferralCostRM(weeksWaited), byCloseCall: false, wasMoved: weeksWaited > 0 },
      ...after.served,
    ],
    deferred: after.deferred.map((d) => ({ ...d, movedTo: rest.placements.find((p) => p.requestId === d.requestId)?.servedWeek ?? null })),
  };
}
