// View-model for the call-off form and the list of reserved slots (slide 6: project director; slide 7: guardrail 2).
// Same honesty mechanism as the board: every number goes through `Figures`.

import { formatDayShort } from "@/core/dates";
import { weekBalances } from "@/core/planner";
import { daysBetween } from "@/core/dates";
import { Figures } from "./board";
import { CALLOFF_REFUSAL_TEXT, earliestReservableWeek } from "./calloffs";
import { toPricedRequests, toWeekCapacities } from "./scenario";
import type { CallOff, SyntheticScenario } from "./schema";

export interface SlotView {
  project: string;
  weekName: string;
  volume: string;
  releases: string;
  status: string;
  source: string;
}

export interface CallOffsModel {
  title: string;
  banner: string;
  intro: string;
  policy: string;
  error: string | null;
  confirmed: boolean;
  projectOptions: { value: string; label: string }[];
  weekOptions: { value: string; label: string }[];
  slots: SlotView[];
  /** Weeks too near to earn a slot, with the reason, so the form never looks arbitrary. */
  nearWeeksNote: string;
  note: string;
  allowedFigures: string[];
}

/** Reserved slots as shown on the board and the huddle: seeded ones plus the visitor's call-offs. */
export function slotViews(s: SyntheticScenario, fig: Figures, mine: readonly CallOff[] = []): SlotView[] {
  const names = new Map(s.projects.map((p) => [p.projectId, p.name] as const));
  const mineIds = new Set(mine.map((c) => c.id));
  return [...(s.reservations ?? [])]
    .sort((a, b) => a.week.localeCompare(b.week) || a.id.localeCompare(b.id))
    .map((r) => {
      const lapsed = s.asOf !== undefined && !r.callOffConfirmed && daysBetween(r.releaseOn, s.asOf) > 0;
      return {
        project: names.get(r.projectId) ?? r.projectId,
        weekName: fig.week(r.week),
        volume: fig.m3(r.reservedM3),
        releases: fig.text(formatDayShort(r.releaseOn)),
        status: r.callOffConfirmed ? "Call-off confirmed: now a firm order" : lapsed ? "Released: no call-off in time" : "Held until the call-off is confirmed",
        source: mineIds.has(r.id) ? "Your call-off" : "Seeded for the demo",
      };
    });
}

export function buildCallOffs(s: SyntheticScenario, mine: readonly CallOff[], params: { error?: string; ok?: boolean }): CallOffsModel {
  const fig = new Figures();
  const earliest = earliestReservableWeek(s);
  const policy = s.reservationPolicy;
  const balances = weekBalances(toWeekCapacities(s), toPricedRequests(s));
  const options = earliest ? balances.filter((b) => b.week >= earliest) : [];
  return {
    title: "Call-offs",
    banner: "Synthetic demo data. Every party is fictional and every figure is illustrative. This is not Chin Hin data.",
    intro: "A project that confirms its call-off early gets a reserved slot, so the plant keeps the blocks for it. Nothing here is sent anywhere; it is a form a project director would use instead of chasing the plant.",
    policy: policy
      ? `A call-off confirmed ${fig.n(policy.aheadWeeks)} or more weeks ahead earns a reserved slot. An unused slot is released ${fig.n(policy.releaseDaysBefore)} days before its week, so nobody can hoard capacity.`
      : "This scenario has no reservation policy.",
    error: params.error ? ((CALLOFF_REFUSAL_TEXT as Record<string, string>)[params.error] ?? CALLOFF_REFUSAL_TEXT.unknown) : null,
    confirmed: params.ok === true,
    projectOptions: s.projects.map((p) => ({ value: p.projectId, label: p.name })),
    weekOptions: options.map((b) => ({ value: b.week, label: `${fig.week(b.week)} (${fig.m3(Math.max(0, b.spareM3))} spare)` })),
    slots: slotViews(s, fig, mine),
    nearWeeksNote: earliest
      ? `On the as-of date, ${fig.text(formatDayShort(s.asOf!))}, only ${fig.week(earliest)} onward is far enough ahead. A nearer call-off is not refused; it competes with other new requests under the rule.`
      : "",
    note: "A typed name is not a login. Reserved capacity counts as committed, so it comes off the free capacity on the board, and it is never taken back once the call-off is confirmed.",
    allowedFigures: fig.all(),
  };
}
