// "Send to the huddle" as a stored state: a person flags a pending decision for the weekly huddle instead of deciding it
// alone. A flag is only a marker. It changes no number and no recommendation, and it records no decision; the ledger
// is still written by the decisions page, by a named person. Pure: no I/O, no clock beyond the injected one.

import { recommend } from "@/core/planner";
import { MAX_NAME } from "@/ledger/decide";
import { toPlannedWeekCapacities, toPricedRequests } from "./scenario";
import type { HuddleFlag, LedgerRow, SyntheticScenario } from "./schema";

export type HuddleFlagRefusal = "huddle-name-required" | "huddle-unknown-week" | "already-flagged" | "huddle-storage-full";

export type HuddleFlagOutcome = { ok: true; flag: HuddleFlag } | { ok: false; error: HuddleFlagRefusal };

export const HUDDLE_FLAG_REFUSAL_TEXT: Record<HuddleFlagRefusal, string> = {
  "huddle-name-required": "Nothing was sent to the huddle: type your name first (at most 80 characters).",
  "huddle-unknown-week": "Nothing was sent to the huddle: that week has no decision waiting.",
  "already-flagged": "That week is already on the huddle's list.",
  "huddle-storage-full": "Nothing was sent to the huddle: this browser's demo list is full. Start the demo again.",
};

const clean = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

export const huddleFlagId = (week: string): string => `huddle-${week}`;

/** Check a typed request to flag a week. Refuses an unnamed person, a week with no open decision, and a repeat. */
export function checkHuddleFlag(
  s: SyntheticScenario,
  ledger: readonly LedgerRow[],
  input: { week: unknown; flaggedBy: unknown },
  existing: readonly HuddleFlag[],
  now: () => Date = () => new Date(),
): HuddleFlagOutcome {
  const refuse = (error: HuddleFlagRefusal): HuddleFlagOutcome => ({ ok: false, error });
  const flaggedBy = clean(input.flaggedBy);
  if (flaggedBy === "" || flaggedBy.length > MAX_NAME) return refuse("huddle-name-required");
  const week = clean(input.week);
  const decided = new Set(ledger.map((r) => r.week));
  const open = recommend(toPlannedWeekCapacities(s), toPricedRequests(s)).some((r) => r.week === week && !decided.has(week));
  if (!open) return refuse("huddle-unknown-week");
  const id = huddleFlagId(week);
  if (existing.some((f) => f.id === id)) return refuse("already-flagged");
  return { ok: true, flag: { id, week, flaggedBy, flaggedAt: now().toISOString() } };
}

/** The flags that still matter: a decided week has left the huddle's list, so its flag is spent. */
export const openFlags = (flags: readonly HuddleFlag[], ledger: readonly LedgerRow[]): HuddleFlag[] => {
  const decided = new Set(ledger.map((r) => r.week));
  return flags.filter((f) => !decided.has(f.week));
};
