import { daysBetween } from "./dates";
import type { Week } from "./types";

/**
 * "Close call": two values within about 10% of each other (context 03 §2 rule 3). Defined here as
 * abs(a − b) ≤ band × max(a, b), so the band is relative to the larger value. ADR D-13.
 */
export const CLOSE_CALL_BAND = 0.1;

export function isCloseCall(a: number, b: number, band: number = CLOSE_CALL_BAND): boolean {
  return Math.abs(a - b) <= band * Math.max(a, b);
}

export interface Scored {
  id: string;
  valueRM: number;
  /** ISO date; the earlier confirmation wins a close call. */
  confirmedOn: string;
}

/**
 * Rule 3: pick the next request to serve. Take the highest value; if others sit within the close-call
 * band of it, the earliest confirmed of that group goes first (ties on date broken by id so results
 * are deterministic). `byCloseCall` is true when the pick is NOT the highest-valued candidate.
 *
 * Why "band of the current maximum" rather than pairwise: a pairwise banded comparison is not
 * transitive (A≈B, B≈C, A≉C), which would make the order depend on sort internals.
 */
export function pickNext<T extends Scored>(
  candidates: readonly T[],
  band: number = CLOSE_CALL_BAND,
): { pick: T; byCloseCall: boolean } | null {
  if (candidates.length === 0) return null;
  const top = Math.max(...candidates.map((c) => c.valueRM));
  const group = candidates.filter((c) => isCloseCall(c.valueRM, top, band));
  const pick = [...group].sort(
    (a, b) => daysBetween(b.confirmedOn, a.confirmedOn) || a.id.localeCompare(b.id),
  )[0]!;
  return { pick, byCloseCall: pick.valueRM < top };
}

/** Rule 1: a reservation protects capacity for a project that planned ahead, until it lapses. */
export interface Reservation {
  projectId: string;
  week: Week;
  reservedM3: number;
  /** ISO date after which an unconfirmed reservation is released (use it or lose it). */
  releaseOn: string;
  /** Once the call-off is confirmed it becomes a firm order, so it must not also be reserved. */
  callOffConfirmed: boolean;
}

/** Volume a reservation still blocks on `asOf`. Confirmed → 0 (counted as a firm order); lapsed → 0. */
export function activeReservedM3(r: Reservation, asOf: string): number {
  if (r.callOffConfirmed) return 0;
  return daysBetween(r.releaseOn, asOf) <= 0 ? r.reservedM3 : 0;
}

/** Rule 2 input: what is already promised in `week` — firm orders plus active reservations. */
export function committedForWeek(
  firmOrders: readonly { week: Week; volumeM3: number }[],
  reservations: readonly Reservation[],
  week: Week,
  asOf: string,
): number {
  const firm = firmOrders.filter((o) => o.week === week).reduce((s, o) => s + o.volumeM3, 0);
  const reserved = reservations.filter((r) => r.week === week).reduce((s, r) => s + activeReservedM3(r, asOf), 0);
  return firm + reserved;
}

export interface WeekSpare {
  week: Week;
  /** Positive = spare, negative = short, in m³. */
  spareM3: number;
}

export interface PrebuildMove {
  fromWeek: Week;
  toWeek: Week;
  m3: number;
}

/**
 * Rule 4: fill the quiet weeks. For stockable product (AAC), cover a short week by building ahead in
 * earlier weeks that have spare, nearest first, without ever holding more than `stockCapM3` in
 * stock at the end of any week. Returns the moves and what is still short.
 */
export function planPrebuild(
  weeks: readonly WeekSpare[],
  stockCapM3: number,
): { moves: PrebuildMove[]; stillShort: WeekSpare[] } {
  if (stockCapM3 < 0) throw new Error("stockCapM3 must be >= 0");
  const remaining = weeks.map((w) => Math.max(0, w.spareM3));
  const stock = weeks.map(() => 0); // m³ held at the end of each week
  const moves: PrebuildMove[] = [];
  const stillShort: WeekSpare[] = [];

  weeks.forEach((target, j) => {
    let deficit = Math.max(0, -target.spareM3);
    for (let i = j - 1; i >= 0 && deficit > 0; i--) {
      const available = remaining[i]!;
      if (available <= 0) continue;
      let headroom = Infinity;
      for (let k = i; k < j; k++) headroom = Math.min(headroom, stockCapM3 - stock[k]!);
      const x = Math.min(available, deficit, headroom);
      if (x <= 0) continue;
      remaining[i]! -= x;
      for (let k = i; k < j; k++) stock[k]! += x;
      moves.push({ fromWeek: weeks[i]!.week, toWeek: target.week, m3: x });
      deficit -= x;
    }
    if (deficit > 0) stillShort.push({ week: target.week, spareM3: -deficit });
  });

  return { moves, stillShort };
}
