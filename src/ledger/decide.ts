// Recording a decision. This is the only write path in the app, so it is the most defended code in it (ADR D-18).
// It takes a person's input (week, mode, chosen request, name, note), recomputes everything from the scenario, and
// appends exactly one row. It never reads a number from the input: any extra field is ignored.

import { DecisionError, recommendationFor, recommendationWithChoice } from "@/core/decision";
import type { Recommendation } from "@/core/planner";
import { toPricedRequests, toWeekCapacities } from "@/data/scenario";
import type { LedgerLine, LedgerRow, SyntheticScenario } from "@/data/schema";
import type { Store } from "./store";

export type Refusal = "name-required" | "bad-mode" | "unknown-week" | "already-decided" | "bad-choice" | "does-not-fit";

export type Outcome = { ok: true; row: LedgerRow } | { ok: false; error: Refusal; message: string };

export interface DecisionInput {
  week: unknown;
  mode: unknown;
  chosenRequestId?: unknown;
  approvedBy: unknown;
  note?: unknown;
}

export const MAX_NAME = 80;
export const MAX_NOTE = 500;
const text = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

/** The ledger lines for a recommendation, with the party and the calculator's ringgit. */
export function linesOf(s: SyntheticScenario, rec: Recommendation): { served: LedgerLine[]; deferred: LedgerLine[] } {
  const partyOf = new Map(s.requests.map((r) => [r.id, r.partyId] as const));
  const line = (e: { requestId: string; side: "internal" | "external"; volumeM3: number; valueRM: number }, movedTo?: string | null): LedgerLine => ({
    requestId: e.requestId,
    partyId: partyOf.get(e.requestId) ?? e.requestId,
    side: e.side,
    volumeM3: e.volumeM3,
    valueRM: e.valueRM,
    ...(movedTo === undefined ? {} : { movedTo }),
  });
  return { served: rec.served.map((e) => line(e)), deferred: rec.deferred.map((e) => line(e, e.movedTo)) };
}

/** The weeks the rule has to settle that no person has decided yet. */
export function pendingWeeks(s: SyntheticScenario, decided: readonly string[]): string[] {
  const weeks = toWeekCapacities(s);
  const reqs = toPricedRequests(s);
  const all = [...new Set(weeks.map((w) => w.week))].filter((w) => {
    try {
      recommendationFor(weeks, reqs, w);
      return true;
    } catch {
      return false;
    }
  });
  return all.filter((w) => !decided.includes(w));
}

export function recordDecision(s: SyntheticScenario, input: DecisionInput, store: Store, now: () => Date = () => new Date()): Outcome {
  const refuse = (error: Refusal, message: string): Outcome => ({ ok: false, error, message });

  const approvedBy = text(input.approvedBy);
  if (approvedBy === "") return refuse("name-required", "A named person must approve. Type your name.");
  if (approvedBy.length > MAX_NAME) return refuse("name-required", "The name is too long.");
  const mode = input.mode === "approve" || input.mode === "change" ? input.mode : null;
  if (!mode) return refuse("bad-mode", "Choose Approve or Change.");
  const week = text(input.week);
  const note = text(input.note).slice(0, MAX_NOTE);

  if (store.read().some((r) => r.week === week)) return refuse("already-decided", `${week} already has a decision in the ledger.`);

  const weeks = toWeekCapacities(s);
  const reqs = toPricedRequests(s);
  let rec: Recommendation;
  try {
    rec = mode === "approve" ? recommendationFor(weeks, reqs, week) : recommendationWithChoice(weeks, reqs, week, text(input.chosenRequestId));
  } catch (e) {
    if (e instanceof DecisionError) return refuse(e.code, e.message);
    throw e;
  }

  const { served, deferred } = linesOf(s, rec);
  const row: LedgerRow = {
    id: `dec-${week}`,
    decidedAt: now().toISOString(),
    week,
    served,
    deferred,
    servedValueRM: served.reduce((t, l) => t + l.valueRM, 0),
    deferredValueRM: deferred.reduce((t, l) => t + l.valueRM, 0),
    approvedBy,
    mode: mode === "approve" ? "recommendation-approved" : "changed-by-scheduler",
    note,
  };
  store.append(row);
  return { ok: true, row };
}
