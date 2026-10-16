// Finance's view (slide 6: group finance, "decision ledger, monthly"; slide 12: finance audits the ledger monthly).
// Combines the seeded demo history with this visitor's own decisions. Every ringgit is the calculator's: history rows are
// priced here from the project and customer cards with the same functions the rule uses; ledger rows were recomputed
// on the server when they were recorded. Every figure goes through `Figures`.

import { externalValueRM, dailyDelayRateRM } from "@/core/costs";
import { Figures } from "./board";
import type { DemoHistory, LedgerRow, SyntheticScenario } from "./schema";

export interface FinanceRow {
  id: string;
  decidedOn: string;
  month: string;
  week: string;
  weekName: string;
  servedSide: "internal" | "external";
  served: string;
  servedRM: number;
  pushed: string;
  pushedRM: number;
  approvedBy: string;
  source: "Seeded demo history" | "Your decision";
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
export const monthLabel = (iso: string): string => `${MONTH_NAMES[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
const monthKey = (iso: string): string => iso.slice(0, 7);

/** Every decision, oldest first, priced by the calculator. */
export function financeRows(s: SyntheticScenario, history: DemoHistory, ledger: readonly LedgerRow[]): FinanceRow[] {
  const projects = new Map(s.projects.map((p) => [p.projectId, p] as const));
  const customers = new Map(s.customers.map((c) => [c.customerId, c] as const));
  const name = (id: string): string => projects.get(id)?.name ?? customers.get(id)?.name ?? id;

  const seeded: FinanceRow[] = history.entries.map((e) => {
    const project = projects.get(e.projectId);
    const customer = customers.get(e.customerId);
    if (!project || !customer) throw new Error(`History entry ${e.id} names an unknown party`);
    const projectRM = dailyDelayRateRM(project) * e.daysAvoided;
    const customerRM = externalValueRM(e.volumeM3, customer);
    const internalFirst = e.servedSide === "internal";
    return {
      id: e.id,
      decidedOn: e.decidedOn,
      month: monthKey(e.decidedOn),
      week: e.week,
      weekName: "",
      servedSide: e.servedSide,
      served: internalFirst ? e.projectId : e.customerId,
      servedRM: internalFirst ? projectRM : customerRM,
      pushed: internalFirst ? e.customerId : e.projectId,
      pushedRM: internalFirst ? customerRM : projectRM,
      approvedBy: e.approvedBy,
      source: "Seeded demo history" as const,
    };
  });

  const live: FinanceRow[] = ledger.map((r) => ({
    id: r.id,
    decidedOn: r.decidedAt.slice(0, 10),
    month: monthKey(r.decidedAt),
    week: r.week,
    weekName: "",
    servedSide: r.served[0]!.side,
    served: r.served.map((l) => l.partyId).join(", "),
    servedRM: r.servedValueRM,
    pushed: r.deferred.map((l) => l.partyId).join(", "),
    pushedRM: r.deferredValueRM,
    approvedBy: r.approvedBy,
    source: "Your decision" as const,
  }));

  return [...seeded, ...live].sort((a, b) => a.decidedOn.localeCompare(b.decidedOn) || a.id.localeCompare(b.id)).map((r) => ({ ...r, served: r.served.split(", ").map(name).join(", "), pushed: r.pushed === "" ? "nobody" : r.pushed.split(", ").map(name).join(", ") }));
}

/** "Internal served first 4 times running" style flag: the same side winning n times in a row, from the end. */
export function streak(rows: readonly FinanceRow[]): { side: "internal" | "external"; length: number } | null {
  const last = rows[rows.length - 1];
  if (!last) return null;
  let n = 0;
  for (let i = rows.length - 1; i >= 0 && rows[i]!.servedSide === last.servedSide; i--) n += 1;
  return { side: last.servedSide, length: n };
}

export interface FinanceModel {
  title: string;
  banner: string;
  intro: string;
  months: { value: string; label: string; selected: boolean }[];
  tiles: { id: string; label: string; value: string; note: string }[];
  rows: { decidedOn: string; week: string; served: string; side: string; servedValue: string; pushed: string; pushedValue: string; approvedBy: string; source: string }[];
  flag: { tone: "ok" | "watch"; text: string };
  exportHref: string;
  note: string;
  allowedFigures: string[];
}

/** Same threshold as the board's close-call story: three the same way in a row is worth a second look, not a fault. */
const WATCH_STREAK = 3;

export function buildFinance(s: SyntheticScenario, history: DemoHistory, ledger: readonly LedgerRow[], month: string | undefined): FinanceModel {
  const fig = new Figures();
  const all = financeRows(s, history, ledger);
  const monthsPresent = [...new Set(all.map((r) => r.month))].sort();
  const chosen = month && monthsPresent.includes(month) ? month : "all";
  const rows = chosen === "all" ? all : all.filter((r) => r.month === chosen);

  const internalFirst = rows.filter((r) => r.servedSide === "internal");
  const sum = (rs: readonly FinanceRow[], f: (r: FinanceRow) => number) => rs.reduce((t, r) => t + f(r), 0);
  const run = streak(all);
  const flag: FinanceModel["flag"] =
    run && run.length >= WATCH_STREAK
      ? { tone: "watch", text: `The ${run.side === "internal" ? "internal" : "outside"} side was served first ${fig.n(run.length)} decisions running. That is what the rule does when ${run.side === "internal" ? "a handover is at risk" : "projects have float"}; check that the project dates behind it are current.` }
      : { tone: "ok", text: `The last ${fig.n(Math.min(all.length, WATCH_STREAK))} decisions are mixed between the internal and outside sides, so no pattern needs a second look.` };

  return {
    title: "Finance: the decision ledger",
    banner: "Synthetic demo data. Every party is fictional and every figure is illustrative. This is not Chin Hin data.",
    intro: "Every decision with the ringgit on both sides, who took it and when, month by month. The earlier rows are a seeded demo history; yours appear after you decide. Finance can audit any row: the figures are the calculator's, never a person's or a model's.",
    months: [{ value: "all", label: "All months", selected: chosen === "all" }, ...monthsPresent.map((m) => ({ value: m, label: fig.text(monthLabel(`${m}-01`)), selected: chosen === m }))],
    tiles: [
      { id: "decisions", label: "Decisions", value: fig.n(rows.length), note: chosen === "all" ? "in the seeded history and yours" : fig.text(monthLabel(`${chosen}-01`)) },
      { id: "internal-first", label: "Internal served first", value: fig.n(internalFirst.length), note: `${fig.n(rows.length - internalFirst.length)} outside served first` },
      { id: "at-stake", label: "Ringgit at stake, served first", value: fig.rm(sum(rows, (r) => r.servedRM)), note: "what waiting would have cost the side served; not a saving" },
      { id: "credit", label: "Credit to the plant", value: fig.rm(sum(internalFirst, (r) => r.servedRM)), note: "delay avoided for group projects, credited to the plant that served them" },
    ],
    rows: rows.map((r) => ({
      decidedOn: r.decidedOn,
      week: fig.week(r.week),
      served: fig.text(r.served),
      side: r.servedSide === "internal" ? "Internal" : "Outside",
      servedValue: fig.rm(r.servedRM),
      pushed: fig.text(r.pushed),
      pushedValue: fig.rm(r.pushedRM),
      approvedBy: fig.text(r.approvedBy),
      source: r.source,
    })),
    flag,
    exportHref: `/finance/export${chosen === "all" ? "" : `?month=${chosen}`}`,
    note: "Seeded rows are invented and labelled; nothing here was measured at Chin Hin. A pilot's first month would rebuild real decisions from WhatsApp and paper and put them in this same table.",
    allowedFigures: fig.all(),
  };
}

const CSV_HEADER = ["decided_on", "week", "served", "served_side", "served_ringgit", "pushed_back", "pushed_back_ringgit", "approved_by", "source"] as const;

/** A cell that a spreadsheet could read as a formula is prefixed, and quotes are doubled (CSV injection). */
export function csvCell(v: string | number): string {
  const t = typeof v === "number" ? String(Math.round(v * 100) / 100) : v;
  const safe = /^[=+\-@\t\r]/.test(t) ? `'${t}` : t;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function financeCsv(s: SyntheticScenario, history: DemoHistory, ledger: readonly LedgerRow[], month: string | undefined): string {
  const all = financeRows(s, history, ledger);
  const rows = month && month !== "all" ? all.filter((r) => r.month === month) : all;
  return [CSV_HEADER.join(","), ...rows.map((r) => [r.decidedOn, r.week, r.served, r.servedSide, r.servedRM, r.pushed, r.pushedRM, r.approvedBy, r.source].map(csvCell).join(","))].join("\n") + "\n";
}
