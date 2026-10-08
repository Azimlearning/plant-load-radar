// "Ask the board": can we take N m3 in a given week? Answered by the calculator from the same week balances the
// board uses. It never guesses and it never decides: where the answer depends on the rule, it says so.

import { weekBalances } from "./planner";
import type { PricedRequest, Week, WeekCapacity } from "./types";

export type AskVerdict =
  /** Free capacity covers it even after the requests already asking for that week. */
  | "fits"
  /** It fits the free capacity only if requests already asking for that week lose. The rule would decide by ringgit. */
  | "contests"
  /** More than the week has free after confirmed orders. */
  | "no-room";

export interface AskAnswer {
  week: Week;
  volumeM3: number;
  /** Capacity left after confirmed orders and reservations. */
  freeM3: number;
  /** New volume already asking for this week. */
  requestedM3: number;
  /** freeM3 minus requestedM3; negative = already short. */
  spareM3: number;
  verdict: AskVerdict;
  /** The first later week in the horizon with room for it outright, or null. */
  nextWeek: Week | null;
}

export class AskError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AskError";
  }
}

export function canTake(weeks: readonly WeekCapacity[], requests: readonly PricedRequest[], week: Week, volumeM3: number): AskAnswer {
  if (!Number.isFinite(volumeM3) || volumeM3 <= 0) throw new AskError("The volume must be more than zero");
  const balances = weekBalances(weeks, requests);
  const here = balances.find((b) => b.week === week);
  if (!here) throw new AskError(`Week ${week} is outside the horizon`);
  const verdict: AskVerdict = volumeM3 <= here.spareM3 ? "fits" : volumeM3 <= here.freeM3 ? "contests" : "no-room";
  const next = balances.find((b) => b.week > week && b.spareM3 >= volumeM3);
  return {
    week,
    volumeM3,
    freeM3: here.freeM3,
    requestedM3: here.requestedM3,
    spareM3: here.spareM3,
    verdict,
    nextWeek: verdict === "fits" ? null : (next?.week ?? null),
  };
}
