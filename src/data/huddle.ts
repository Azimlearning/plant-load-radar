// View-model for the weekly huddle (slide 6: plant manager; slide 11: under 30 minutes). The agenda is built from what is
// actually open: decisions waiting, build-ahead plans to confirm, reserved slots that will lapse, orders to check.
// Every number goes through `Figures`; the time boxes come from the scenario's `huddle` block, not from code.

import { daysBetween, formatDayShort } from "@/core/dates";
import { coveredByPrebuild, recommend } from "@/core/planner";
import { Figures, lineFormatter, type Line } from "./board";
import { slotViews, type SlotView } from "./calloffs-view";
import { toPlannedWeekCapacities, toPricedRequests, toWeekCapacities } from "./scenario";
import type { CallOff, LedgerRow, SyntheticScenario } from "./schema";

export interface HuddleDecision {
  anchor: string;
  headline: string;
  freeText: string;
  wantedText: string;
  served: Line[];
  moved: Line[];
}

export interface HuddleBlock {
  id: string;
  label: string;
  minutes: string;
}

export interface HuddleModel {
  title: string;
  banner: string;
  intro: string;
  frame: { minutes: string; clock: string; blocks: HuddleBlock[] };
  decisions: HuddleDecision[];
  noDecisions: string;
  covered: { headline: string; moves: string[] }[];
  slots: (SlotView & { lapsesSoon: boolean })[];
  orders: { count: string; of: string } | null;
  credits: { line: string }[];
  note: string;
  allowedFigures: string[];
}

const LAPSE_WINDOW_DAYS = 14; // a slot is "about to lapse" when its release date is within two weeks of the as-of date

export function buildHuddle(s: SyntheticScenario, ledger: readonly LedgerRow[], capture: { needsPerson: number; lines: number } | null, mine: readonly CallOff[] = []): HuddleModel {
  const fig = new Figures();
  const weeks = toWeekCapacities(s);
  const planned = toPlannedWeekCapacities(s);
  const reqs = toPricedRequests(s);
  const fmt = lineFormatter(s, fig);
  const decided = new Set(ledger.map((r) => r.week));
  const huddle = s.huddle ?? { minutes: 30, blocks: [] };

  const decisions: HuddleDecision[] = recommend(planned, reqs)
    .filter((r) => !decided.has(r.week))
    .map((r) => ({
      anchor: `week-${r.week}`,
      headline: `${fig.week(r.week)} is ${fig.m3(r.shortM3)} short`,
      freeText: `${fig.m3(r.freeM3)} free after confirmed orders`,
      wantedText: `${fig.m3(r.demandM3)} wanted`,
      served: fmt.servedLines(r),
      moved: fmt.movedLines(r),
    }));

  const covered = coveredByPrebuild(weeks, reqs, s.plannerSettings.stockCapM3).map((c) => ({
    headline: `${fig.week(c.week)} is ${fig.m3(c.shortM3)} short, covered by building ahead`,
    moves: c.moves.map((m) => `Build ${fig.m3(m.m3)} in ${fig.week(m.fromWeek)} to hold for ${fig.week(m.toWeek)}`),
  }));

  const slots = slotViews(s, fig, mine).map((v, i) => {
    const r = [...(s.reservations ?? [])].sort((a, b) => a.week.localeCompare(b.week) || a.id.localeCompare(b.id))[i]!;
    const away = s.asOf ? daysBetween(s.asOf, r.releaseOn) : Number.POSITIVE_INFINITY;
    return { ...v, lapsesSoon: !r.callOffConfirmed && away >= 0 && away <= LAPSE_WINDOW_DAYS };
  });

  // Slide 12: served group orders are credited with the delay avoided, so the plant is not seen as having given margin away.
  const credits = ledger.map((r) => ({
    line: `${fig.week(r.week)}: ${s.plant.name} is credited ${fig.rm(r.servedValueRM)} of delay avoided for the group, decided by ${fig.text(r.approvedBy)}; ${fig.rm(r.deferredValueRM)} of outside margin waited a week.`,
  }));

  const clock = fig.text(`${String(huddle.minutes).padStart(2, "0")}:00`);
  return {
    title: "Weekly huddle",
    banner: "Synthetic demo data. Every party is fictional and every figure is illustrative. This is not Chin Hin data.",
    intro: "One page for the plant manager's weekly huddle: only what is still open, in the time the pilot aims for. The rule has already done the pricing; the huddle settles the exceptions.",
    frame: {
      minutes: fig.n(huddle.minutes),
      clock,
      blocks: huddle.blocks.map((b) => ({ id: b.id, label: b.label, minutes: fig.n(b.minutes) })),
    },
    decisions,
    noDecisions: "No week is waiting for a decision.",
    covered,
    slots,
    orders: capture ? { count: fig.n(capture.needsPerson), of: fig.n(capture.lines) } : null,
    credits,
    note: "The huddle timer is a convenience, not a record. Decisions are recorded on the decisions page, by a named person.",
    allowedFigures: fig.all(),
  };
}

/** Used by tests and the page: "Mon 26 Oct" style label for a date. */
export const dayLabel = (iso: string): string => formatDayShort(iso);
