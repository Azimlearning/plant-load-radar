// View-model for the pilot scorecard (slide 11: a 90-day pilot ends in a ringgit verdict; slide 12: risks and what the pilot needs).
// It shows the measurement plan with its baselines EMPTY ON PURPOSE: nothing has been measured at Chin Hin. Beside each measure
// it shows what the demo can already show, labelled as seeded or illustrative. Every number goes through `Figures`.

import { breakEvenMarginShare, contributionMarginRM, dailyDelayRateRM } from "@/core/costs";
import { comparePolicies, type PolicyId } from "@/core/policies";
import { recommend } from "@/core/planner";
import { Figures } from "./board";
import { financeRows } from "./finance";
import { toPlannedWeekCapacities, toPricedRequests, withProjectFloat } from "./scenario";
import type { DemoHistory, LedgerRow, SyntheticScenario } from "./schema";

export interface Measure {
  id: string;
  label: string;
  how: string;
  baseline: string;
  target: string;
  demo: string;
  demoNote: string;
}

export interface PolicyRow {
  policy: string;
  waits: string;
  waitingValue: string;
  note: string;
}

export interface PolicyCase {
  title: string;
  rows: PolicyRow[];
}

export interface Sensitivity {
  title: string;
  lines: string[];
}

export interface PilotModel {
  title: string;
  banner: string;
  intro: string;
  phases: { id: string; label: string; title: string; bullets: string[]; milestone: string }[];
  measures: Measure[];
  policyIntro: string;
  policyCases: PolicyCase[];
  /** How much the story week's call depends on the outside margin assumption (ADR D-20), or null. */
  sensitivity: Sensitivity | null;
  risks: { risk: string; how: string; where: string; href: string }[];
  needs: string[];
  nextStep: string;
  note: string;
  allowedFigures: string[];
}

const POLICY_LABEL: Record<PolicyId, string> = {
  "ringgit-at-stake": "The ringgit-at-stake rule",
  "first-confirmed": "First confirmed, first served",
  "internal-first": "Group projects first",
  "outside-first": "Outside orders first",
};
const POLICY_NOTE: Record<PolicyId, string> = {
  "ringgit-at-stake": "Serves whichever side has more ringgit at stake; a request that loses is offered the next week.",
  "first-confirmed": "Ignores what waiting costs.",
  "internal-first": "Ignores float: serves projects that could wait ahead of outside orders that cannot.",
  "outside-first": "Ignores handover deadlines.",
};

function policyCase(s: SyntheticScenario, fig: Figures, title: string): PolicyCase | null {
  const weeks = toPlannedWeekCapacities(s);
  const reqs = toPricedRequests(s);
  const rec = recommend(weeks, reqs)[0];
  if (!rec) return null;
  const names = new Map<string, string>([...s.projects.map((p) => [p.projectId, p.name] as const), ...s.customers.map((c) => [c.customerId, c.name] as const)]);
  const party = new Map(s.requests.map((r) => [r.id, names.get(r.partyId) ?? r.partyId] as const));
  const out = comparePolicies(weeks, reqs, rec.week);
  return {
    title: `${title}: ${fig.week(rec.week)}`,
    rows: out.map((p) => ({
      policy: POLICY_LABEL[p.policy],
      waits: p.waitingIds.length === 0 ? "nobody" : p.waitingIds.map((id) => fig.text(party.get(id) ?? id)).join(", "),
      waitingValue: fig.rm(p.waitingRM),
      note: POLICY_NOTE[p.policy],
    })),
  };
}

const PERCENT = 100;

/** The outside margin is the public PBT margin, lower than a contribution margin. This shows how far it would have to rise to change the call. */
function marginSensitivity(s: SyntheticScenario, fig: Figures): Sensitivity | null {
  const rec = recommend(toPlannedWeekCapacities(s), toPricedRequests(s))[0];
  if (!rec) return null;
  const internal = rec.served.filter((e) => e.side === "internal").reduce((t, e) => t + e.valueRM, 0);
  const outside = rec.deferred.find((e) => e.side === "external");
  if (!outside || internal <= 0) return null;
  const request = s.requests.find((r) => r.id === outside.requestId);
  const customer = s.customers.find((c) => c.customerId === request?.partyId);
  if (!request || !customer) return null;
  const used = contributionMarginRM(outside.volumeM3, customer) / (outside.volumeM3 * customer.pricePerM3RM);
  const needed = breakEvenMarginShare(outside.volumeM3, customer, internal);
  const lead = `${fig.text(customer.name)}'s order is worth ${fig.rm(outside.volumeM3 * customer.pricePerM3RM)} in sales. The demo gives it the public ${fig.dec(used * PERCENT)}% margin (${fig.rm(outside.valueRM)}).`;
  return {
    title: "How much does this call depend on the margin assumption?",
    lines: [
      lead,
      needed > 1
        ? `To go first it would need a margin of ${fig.n(needed * PERCENT)}% of its sales to match the project's ${fig.rm(internal)}. No margin can be above ${fig.n(PERCENT)}%, so the call holds at any margin, including a contribution margin well above the public figure.`
        : `To go first it would need a margin of ${fig.dec(needed * PERCENT)}% of its sales to match the project's ${fig.rm(internal)}. Above that, the rule would serve the outside order first.`,
    ],
  };
}

export function buildPilot(s: SyntheticScenario, history: DemoHistory, ledger: readonly LedgerRow[]): PilotModel {
  const fig = new Figures();
  const rows = financeRows(s, history, ledger);
  const daysSeeded = history.entries.reduce((t, e) => t + e.daysAvoided, 0);
  const huddle = s.huddle;
  const rate = Math.max(0, ...s.projects.map((p) => dailyDelayRateRM(p)));

  const measures: Measure[] = [
    {
      id: "delay",
      label: "Fewer days of group-project delay caused by AAC supply",
      how: "Days a project passes its handover deadline because blocks were late, from the project programmes, against the month-1 baseline.",
      baseline: "Measured in month 1",
      target: "Set against the baseline, not promised up front",
      demo: `${fig.n(daysSeeded)} days in the seeded history`,
      demoNote: `Invented decisions in earlier weeks; the largest project's late-handover rate is ${fig.rm(rate)} a day, an upper bound.`,
    },
    {
      id: "bumped",
      label: "Zero confirmed outside orders bumped",
      how: "A count from the decision ledger: confirmed orders that lost capacity to a newer request.",
      baseline: "Counted in month 1 from WhatsApp and paper",
      target: "Zero",
      demo: `${fig.n(0)} of ${fig.n(rows.length)} decisions moved a confirmed order`,
      demoNote: "By construction: the rule only decides new requests and confirmed orders are committed capacity it never takes back. A test asserts it.",
    },
    {
      id: "stock",
      label: "Lower days of finished AAC held, with planned pre-build",
      how: "Stock levels by week from the plant, before and after, against the month-1 baseline.",
      baseline: "Measured in month 1",
      target: "Set against the baseline, not promised up front",
      demo: `Stock limit ${fig.m3(s.plannerSettings.stockCapM3)} (an assumption)`,
      demoNote: "The board shows when building ahead covers a short week; yard space and curing are not modelled.",
    },
    {
      id: "huddle",
      label: "Under 30 minutes a week for the decision huddle",
      how: "Time from the huddle page's timer and the scheduler's own log.",
      baseline: "Timed in month 1",
      target: huddle ? `Under ${fig.n(huddle.minutes)} minutes` : "Under the agreed time",
      demo: huddle ? `${fig.n(huddle.minutes)} minutes planned, in ${fig.n(huddle.blocks.length)} blocks` : "No frame in this scenario",
      demoNote: "The weekly huddle page builds the agenda from what is open; the timer is a convenience, not a record.",
    },
  ];

  const story = policyCase(s, fig, "As in the story");
  const float = s.whatIf ? policyCase(withProjectFloat(s, s.whatIf.projectId, s.whatIf.floatDays), fig, `If ${s.projects.find((p) => p.projectId === s.whatIf!.projectId)?.name ?? "the project"} had ${fig.n(s.whatIf.floatDays)} days of float`) : null;

  return {
    title: "Pilot scorecard",
    banner: "Synthetic demo data. Every party is fictional and every figure is illustrative. This is not Chin Hin data.",
    intro: "A 90-day pilot on the new line ends in a ringgit verdict. This page is the measurement plan. The baseline column is empty on purpose: nothing has been measured at Chin Hin, and the demo makes no claim of benefit.",
    phases: [
      {
        id: "m1",
        label: fig.text("Month 1"),
        title: "Understand and build",
        bullets: ["Sit with the scheduler for two weeks", "Rebuild three months of decisions from WhatsApp and paper, and price them", "Build the board and agents on real orders"],
        milestone: fig.text("By day 30: a baseline and a working board"),
      },
      {
        id: "m2",
        label: fig.text("Month 2"),
        title: "Agree and go live",
        bullets: ["Agree the rule with the plant manager and two project directors", "Start the weekly 30-minute huddle", "Log every decision with its ringgit"],
        milestone: fig.text("By day 60: the plant decides by the rule"),
      },
      {
        id: "m3",
        label: fig.text("Month 3"),
        title: "Measure and decide",
        bullets: ["Compare delay days, margin and stock with the baseline", "Fix what did not work", "Decide on precast and ready-mix"],
        milestone: fig.text("By day 90: a ringgit result and a go or no-go"),
      },
    ],
    measures,
    policyIntro: "One synthetic week, four ways of choosing who waits. It shows how the choice moves the cost between the two sides, not how much anyone would save: the inputs are invented.",
    policyCases: [story, float].filter((c): c is PolicyCase => c !== null),
    sensitivity: marginSensitivity(s, fig),
    risks: [
      { risk: "The AI misreads an order", how: "Confidence on every field; anything unsure goes to a person first.", where: "Try it", href: "/inbox/try" },
      { risk: "Teams inflate their cost of delay", how: "Late-handover cost comes from the sale-and-purchase dates and programmes; finance audits the ledger monthly.", where: "Finance", href: "/finance" },
      { risk: "The plant feels overruled", how: "The plant manager owns decisions; served group orders are credited with the delay avoided.", where: "Weekly huddle", href: "/huddle" },
      { risk: "Messy data at the start", how: "No forecasting models until three months of clean, logged orders exist.", where: "Cost of today", href: "/value" },
    ],
    needs: [
      "Two weeks alongside the plant scheduler",
      "Three months of WhatsApp, delivery orders and Kingdee sales orders",
      "Programmes for two active group projects",
      fig.text("A Power Platform environment in the Microsoft 365 tenant"),
    ],
    nextStep: "A 30-minute walkthrough with the Building Materials team to pick the pilot week.",
    note: "The pilot needs access, not budget. It does not forecast and it does not let AI decide; both wait until the data is clean.",
    allowedFigures: fig.all(),
  };
}
