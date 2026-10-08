import { CLOSE_CALL_BAND, pickNext } from "./fairness";
import type { PricedRequest, Side, Week, WeekCapacity } from "./types";

/** One request that was served in a week, with the ringgit that justified it. */
export interface ServedEntry {
  requestId: string;
  side: Side;
  volumeM3: number;
  /** RM that would have been lost by pushing it back one more week. */
  valueRM: number;
  /** True when it won a close call against a higher-valued request (first confirmed went first). */
  byCloseCall: boolean;
  /** True when the request had to be pushed back at least one week before it was served. */
  wasMoved: boolean;
}

/** One request that could not be served this week and moves on, with its ringgit. */
export interface DeferredEntry {
  requestId: string;
  side: Side;
  volumeM3: number;
  valueRM: number;
}

export interface WeekDecision {
  week: Week;
  capacityM3: number;
  committedM3: number;
  /** Capacity left for new requests before deciding. */
  freeM3: number;
  /** Total new volume wanting this week (served + deferred). */
  demandM3: number;
  /** True when demand exceeded free capacity, so the rule had to choose. */
  contested: boolean;
  served: ServedEntry[];
  deferred: DeferredEntry[];
  freeAfterM3: number;
}

export interface Placement {
  requestId: string;
  /** The week it is finally served, or null if no week in the horizon had room. */
  servedWeek: Week | null;
  /** How many weeks it was pushed back. */
  weeksDeferred: number;
  status: "served" | "moved" | "unplaced";
}

export interface Decision {
  weeks: WeekDecision[];
  placements: Placement[];
}

/**
 * The allocation rule (context 03 §2), one week at a time, earliest week first:
 *  - Capacity already committed (firm orders, active reservations) is never taken back — promises kept.
 *  - Of the requests that want this week or earlier, serve whichever has more ringgit at stake
 *    (RM lost by deferring it one more week); within the close-call band, first confirmed goes first.
 *  - A request that does not fit is NOT refused: it carries into the next week and competes again
 *    ("move before you refuse"). It is "unplaced" only if no week in the horizon has room.
 *  - Work-conserving: if the next-ranked request does not fit, later (smaller) ones may still be served,
 *    so capacity is not left idle. Requests are served whole, never split. ADR D-13.
 * Pure and deterministic: no randomness, no clock, no I/O.
 */
export function decide(
  weeks: readonly WeekCapacity[],
  requests: readonly PricedRequest[],
  band: number = CLOSE_CALL_BAND,
): Decision {
  const ids = new Set<string>();
  for (const r of requests) {
    if (ids.has(r.id)) throw new Error(`Duplicate request id: ${r.id}`);
    ids.add(r.id);
    if (!(r.volumeM3 > 0)) throw new Error(`Request ${r.id}: volumeM3 must be > 0`);
  }
  for (const w of weeks) {
    if (w.capacityM3 < 0 || w.committedM3 < 0) throw new Error(`Week ${w.week}: negative capacity or commitment`);
  }

  const horizon = [...weeks].sort((a, b) => a.week.localeCompare(b.week));
  const pending = new Map(requests.map((r) => [r.id, r]));
  const deferredCount = new Map<string, number>();
  const placements = new Map<string, Placement>();
  const decisions: WeekDecision[] = [];

  for (const w of horizon) {
    const freeM3 = Math.max(0, w.capacityM3 - w.committedM3);
    let free = freeM3;
    // Requests that want this week or earlier, in a stable order.
    let pool = [...pending.values()]
      .filter((r) => r.requestedWeek <= w.week)
      .sort((a, b) => a.id.localeCompare(b.id));
    const demandM3 = pool.reduce((s, r) => s + r.volumeM3, 0);
    const served: ServedEntry[] = [];
    const deferred: DeferredEntry[] = [];

    const priced = (r: PricedRequest) => ({
      id: r.id,
      confirmedOn: r.confirmedOn,
      valueRM: r.deferralCostRM(deferredCount.get(r.id) ?? 0),
      req: r,
    });

    while (pool.length > 0) {
      const next = pickNext(pool.map(priced), band);
      if (!next) break;
      const r = next.pick.req;
      pool = pool.filter((p) => p.id !== r.id);
      if (r.volumeM3 <= free) {
        free -= r.volumeM3;
        pending.delete(r.id);
        const weeksDeferred = deferredCount.get(r.id) ?? 0;
        served.push({
          requestId: r.id,
          side: r.side,
          volumeM3: r.volumeM3,
          valueRM: next.pick.valueRM,
          byCloseCall: next.byCloseCall,
          wasMoved: weeksDeferred > 0,
        });
        placements.set(r.id, {
          requestId: r.id,
          servedWeek: w.week,
          weeksDeferred,
          status: weeksDeferred > 0 ? "moved" : "served",
        });
      } else {
        deferred.push({ requestId: r.id, side: r.side, volumeM3: r.volumeM3, valueRM: next.pick.valueRM });
      }
    }

    for (const d of deferred) deferredCount.set(d.requestId, (deferredCount.get(d.requestId) ?? 0) + 1);

    decisions.push({
      week: w.week,
      capacityM3: w.capacityM3,
      committedM3: w.committedM3,
      freeM3,
      demandM3,
      contested: deferred.length > 0,
      served,
      deferred,
      freeAfterM3: free,
    });
  }

  for (const r of pending.values()) {
    placements.set(r.id, {
      requestId: r.id,
      servedWeek: null,
      weeksDeferred: deferredCount.get(r.id) ?? 0,
      status: "unplaced",
    });
  }

  return {
    weeks: decisions,
    placements: requests.map((r) => placements.get(r.id)!),
  };
}
