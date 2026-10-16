// Call-offs and reserved slots (slide 6, project director; slide 7, guardrail 2). Pure: no I/O, no clock.
// A call-off confirmed `aheadWeeks` or more ahead earns a reserved slot; an unused slot is released shortly before its week.
// The rule itself is unchanged (src/core/fairness.ts): a reservation is just committed volume until it lapses.

import { addDays } from "@/core/dates";
import { weekBalances } from "@/core/planner";
import { weekOfDate, weekStart } from "@/core/weeks";
import { toPricedRequests, toWeekCapacities } from "./scenario";
import { type CallOff, type SyntheticScenario } from "./schema";

export type CallOffRefusal = "name-required" | "unknown-project" | "bad-week" | "too-soon" | "bad-volume" | "no-room" | "already-reserved" | "no-policy";

export type CallOffOutcome = { ok: true; callOff: CallOff } | { ok: false; error: CallOffRefusal };

export const MAX_CALLOFF_VOLUME_M3 = 100_000; // a sanity bound on typed input, not a business figure

const clean = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

/** The first week that still earns a reserved slot on the as-of date. */
export function earliestReservableWeek(s: SyntheticScenario): string | null {
  if (!s.asOf || !s.reservationPolicy) return null;
  return weekOfDate(addDays(s.asOf, s.reservationPolicy.aheadWeeks * 7));
}

export function reservationFor(s: SyntheticScenario, c: CallOff): NonNullable<SyntheticScenario["reservations"]>[number] {
  return {
    id: c.id,
    projectId: c.projectId,
    week: c.week,
    reservedM3: c.volumeM3,
    releaseOn: addDays(weekStart(c.week), -(s.reservationPolicy?.releaseDaysBefore ?? 0)),
    callOffConfirmed: false,
  };
}

/** The scenario with a visitor's call-offs added as reservations. */
export function applyCallOffs(s: SyntheticScenario, callOffs: readonly CallOff[]): SyntheticScenario {
  if (callOffs.length === 0) return s;
  return { ...s, reservations: [...(s.reservations ?? []), ...callOffs.map((c) => reservationFor(s, c))] };
}

/** Check a typed call-off against the scenario. Every refusal is a code; the page prints fixed text for it. */
export function checkCallOff(s: SyntheticScenario, input: { projectId: unknown; week: unknown; volumeM3: unknown; requestedBy: unknown }, existing: readonly CallOff[], now: () => Date = () => new Date()): CallOffOutcome {
  const refuse = (error: CallOffRefusal): CallOffOutcome => ({ ok: false, error });
  const earliest = earliestReservableWeek(s);
  if (!earliest) return refuse("no-policy");
  const requestedBy = clean(input.requestedBy);
  if (requestedBy === "") return refuse("name-required");
  const projectId = clean(input.projectId);
  if (!s.projects.some((p) => p.projectId === projectId)) return refuse("unknown-project");
  const week = clean(input.week);
  if (!s.capacity.some((c) => c.week === week)) return refuse("bad-week");
  if (week < earliest) return refuse("too-soon");
  const raw = clean(input.volumeM3);
  const volume = Number(raw);
  if (raw === "" || !Number.isInteger(volume) || volume <= 0 || volume > MAX_CALLOFF_VOLUME_M3) return refuse("bad-volume");
  const id = `calloff-${projectId}-${week}`;
  if (existing.some((c) => c.id === id) || (s.reservations ?? []).some((r) => r.id === id)) return refuse("already-reserved");
  const here = weekBalances(toWeekCapacities(s), toPricedRequests(s)).find((b) => b.week === week)!;
  if (volume > here.spareM3) return refuse("no-room");
  return { ok: true, callOff: { id, createdAt: now().toISOString(), projectId, week, volumeM3: volume, requestedBy } };
}

export const CALLOFF_REFUSAL_TEXT: Record<CallOffRefusal | "unknown", string> = {
  "name-required": "Nothing was reserved: type the name of the person confirming the call-off.",
  "unknown-project": "Nothing was reserved: choose a project from the list.",
  "bad-week": "Nothing was reserved: choose a week from the list.",
  "too-soon": "Nothing was reserved: only call-offs confirmed far enough ahead earn a slot. A nearer one competes with other new requests under the rule.",
  "bad-volume": "Nothing was reserved: type a whole number of cubic metres, more than zero.",
  "no-room": "Nothing was reserved: that is more than the week has spare after confirmed orders and other reservations.",
  "already-reserved": "Nothing was reserved: that project already holds a slot in that week.",
  "no-policy": "Nothing was reserved: this scenario has no reservation policy.",
  unknown: "Nothing was reserved.",
};
