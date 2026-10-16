import { CLOSE_CALL_BAND, planPrebuild, type PrebuildMove, type WeekSpare } from "./fairness";
import { decide, type Decision, type DeferredEntry, type ServedEntry, type WeekDecision } from "./rule";
import type { PricedRequest, Week, WeekCapacity } from "./types";

// The planner turns the rule's raw decision into what a scheduler needs to see: how short each week is,
// who is served and who moves where (with the ringgit on each side), and whether building ahead could
// change the answer. It adds no new rule — everything is `decide()` and `planPrebuild()` — only sums,
// differences and re-runs.

export interface WeekBalance {
  week: Week;
  capacityM3: number;
  committedM3: number;
  /** Capacity left for new requests (never negative). */
  freeM3: number;
  /** New volume that asked for exactly this week. */
  requestedM3: number;
  /** freeM3 − requestedM3: positive = spare, negative = short. */
  spareM3: number;
}

export function weekBalances(weeks: readonly WeekCapacity[], requests: readonly PricedRequest[]): WeekBalance[] {
  return [...weeks]
    .sort((a, b) => a.week.localeCompare(b.week))
    .map((w) => {
      const freeM3 = Math.max(0, w.capacityM3 - w.committedM3);
      const requestedM3 = requests.filter((r) => r.requestedWeek === w.week).reduce((s, r) => s + r.volumeM3, 0);
      return {
        week: w.week,
        capacityM3: w.capacityM3,
        committedM3: w.committedM3,
        freeM3,
        requestedM3,
        spareM3: freeM3 - requestedM3,
      };
    });
}

export interface MovedEntry extends DeferredEntry {
  /** The week it is finally served, or null if no week in the horizon has room. */
  movedTo: Week | null;
}

/** The rule's answer for one contested week, with where each pushed-back request ends up. */
export interface Recommendation {
  week: Week;
  freeM3: number;
  demandM3: number;
  /** How far demand exceeds free capacity this week. */
  shortM3: number;
  served: ServedEntry[];
  deferred: MovedEntry[];
}

function toRecommendation(w: WeekDecision, decision: Decision): Recommendation {
  return {
    week: w.week,
    freeM3: w.freeM3,
    demandM3: w.demandM3,
    shortM3: Math.max(0, w.demandM3 - w.freeM3),
    served: w.served,
    deferred: w.deferred.map((d) => ({
      ...d,
      movedTo: decision.placements.find((p) => p.requestId === d.requestId)?.servedWeek ?? null,
    })),
  };
}

/** One recommendation for every week where the rule had to choose, earliest first. */
export function recommend(
  weeks: readonly WeekCapacity[],
  requests: readonly PricedRequest[],
  band: number = CLOSE_CALL_BAND,
): Recommendation[] {
  const decision = decide(weeks, requests, band);
  return decision.weeks.filter((w) => w.contested).map((w) => toRecommendation(w, decision));
}

export interface PrebuildAlternative {
  targetWeek: Week;
  stockCapM3: number;
  /** Production moved into earlier weeks to be held as stock, all destined for weeks up to the target. */
  moves: PrebuildMove[];
  /** How much of the target week's shortage the stock covers. */
  coveredM3: number;
  /** What is still short after building ahead. */
  residualShortM3: number;
  /** The rule's answer for the target week once the stock is added; null = no longer contested. */
  outcome: Recommendation | null;
}

/**
 * What if the quiet weeks before `targetWeek` built ahead (AAC can be stocked), within `stockCapM3`?
 * The moved volume uses capacity in the earlier week (so it counts as committed there) and becomes extra
 * capacity in the target week; then the same rule is run again. The stock cap is an input, never a literal.
 */
export function prebuildAlternative(
  weeks: readonly WeekCapacity[],
  requests: readonly PricedRequest[],
  targetWeek: Week,
  stockCapM3: number,
  band: number = CLOSE_CALL_BAND,
): PrebuildAlternative {
  const balances = weekBalances(weeks, requests);
  const idx = balances.findIndex((b) => b.week === targetWeek);
  if (idx === -1) throw new Error(`Unknown week ${targetWeek}`);

  const spares: WeekSpare[] = balances.slice(0, idx + 1).map((b) => ({ week: b.week, spareM3: b.spareM3 }));
  const { moves, stillShort } = planPrebuild(spares, stockCapM3);

  const added = new Map<Week, number>(); // extra capacity arriving in a week (from stock)
  const used = new Map<Week, number>(); // production used earlier to build that stock
  for (const m of moves) {
    added.set(m.toWeek, (added.get(m.toWeek) ?? 0) + m.m3);
    used.set(m.fromWeek, (used.get(m.fromWeek) ?? 0) + m.m3);
  }
  const adjusted: WeekCapacity[] = weeks.map((w) => ({
    week: w.week,
    capacityM3: w.capacityM3 + (added.get(w.week) ?? 0),
    committedM3: w.committedM3 + (used.get(w.week) ?? 0),
  }));

  const residual = stillShort.find((s) => s.week === targetWeek);
  const after = decide(adjusted, requests, band);
  const targetAfter = after.weeks.find((w) => w.week === targetWeek)!;
  return {
    targetWeek,
    stockCapM3,
    moves,
    coveredM3: moves.filter((m) => m.toWeek === targetWeek).reduce((s, m) => s + m.m3, 0),
    residualShortM3: residual ? -residual.spareM3 : 0, // not -(0): that is negative zero, which a screen could print as "-0"
    outcome: targetAfter.contested ? toRecommendation(targetAfter, after) : null,
  };
}

export interface CoveredWeek {
  week: Week;
  /** How far the week is short before building ahead. */
  shortM3: number;
  /** The production moved into earlier weeks that covers it completely. */
  moves: PrebuildMove[];
}

/**
 * Short weeks that building ahead covers completely, within the stock cap (slide 9: "one is already covered by
 * pre-build, the other needs a call"). Weeks are judged in time order. A week that only partly covers is not listed
 * and its partial moves are not applied, which only ever leaves more room for later weeks, so a listed week stays
 * covered. Pure; the cap is an input.
 */
export function coveredByPrebuild(weeks: readonly WeekCapacity[], requests: readonly PricedRequest[], stockCapM3: number): CoveredWeek[] {
  const balances = weekBalances(weeks, requests);
  const spares: WeekSpare[] = balances.map((b) => ({ week: b.week, spareM3: b.spareM3 }));
  const { moves, stillShort } = planPrebuild(spares, stockCapM3);
  const open = new Set(stillShort.map((s) => s.week));
  return balances
    .filter((b) => b.spareM3 < 0 && !open.has(b.week))
    .map((b) => ({ week: b.week, shortM3: -b.spareM3, moves: moves.filter((m) => m.toWeek === b.week) }));
}

/** The same weeks with the covered weeks' build-ahead applied: stock arrives in the target week, and uses capacity earlier. */
export function plannedWeeks(weeks: readonly WeekCapacity[], requests: readonly PricedRequest[], stockCapM3: number): WeekCapacity[] {
  const added = new Map<Week, number>();
  const used = new Map<Week, number>();
  for (const c of coveredByPrebuild(weeks, requests, stockCapM3)) {
    for (const m of c.moves) {
      added.set(m.toWeek, (added.get(m.toWeek) ?? 0) + m.m3);
      used.set(m.fromWeek, (used.get(m.fromWeek) ?? 0) + m.m3);
    }
  }
  return weeks.map((w) => ({ week: w.week, capacityM3: w.capacityM3 + (added.get(w.week) ?? 0), committedM3: w.committedM3 + (used.get(w.week) ?? 0) }));
}
