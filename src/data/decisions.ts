// View-models for the decisions page and the ledger page. Same honesty mechanism as the board: every number goes
// through `Figures`, and the drafts are built from strings the calculator's view-model already produced.

import { recommend } from "@/core/planner";
import type { Refusal } from "@/ledger/decide";
import { templateDrafter, type Drafter, type Drafts } from "@/writer/drafter";
import { Figures, lineFormatter, type Line, type RecommendationView } from "./board";
import { toPricedRequests, toWeekCapacities } from "./scenario";
import type { LedgerLine, LedgerRow, SyntheticScenario } from "./schema";

/** Fixed messages by refusal code. The page never prints text taken from the address bar. */
export const REFUSAL_TEXT: Record<Refusal | "unknown", string> = {
  "name-required": "Nothing was recorded: a named person must approve. Type your name.",
  "bad-mode": "Nothing was recorded: choose Approve or Change.",
  "unknown-week": "Nothing was recorded: that week has no decision waiting.",
  "already-decided": "Nothing was recorded: that week already has a decision in the ledger.",
  "bad-choice": "Nothing was recorded: choose one of the requests the rule pushed back.",
  "does-not-fit": "Nothing was recorded: that request does not fit in this week's free capacity.",
  unknown: "Nothing was recorded.",
};

export const refusalText = (code: string | undefined): string | null =>
  code === undefined ? null : (REFUSAL_TEXT as Record<string, string>)[code] ?? REFUSAL_TEXT.unknown;

export interface ChangeOption {
  id: string;
  label: string;
}
export interface PendingView {
  week: string;
  weekName: string;
  headline: string;
  freeText: string;
  wantedText: string;
  served: Line[];
  moved: Line[];
  changeOptions: ChangeOption[];
  drafts: Drafts;
}
export interface DecisionsModel {
  title: string;
  banner: string;
  intro: string;
  /** Shown after a refused submission, from a fixed list. */
  error: string | null;
  pending: PendingView[];
  emptyNote: string;
  draftNote: string;
  approverNote: string;
  allowedFigures: string[];
}

export function buildDecisions(s: SyntheticScenario, ledger: readonly LedgerRow[], error: string | null, drafter: Drafter = templateDrafter): DecisionsModel {
  const fig = new Figures();
  const weeks = toWeekCapacities(s);
  const reqs = toPricedRequests(s);
  const decided = new Set(ledger.map((r) => r.week));
  const fmt = lineFormatter(s, fig);

  const pending: PendingView[] = recommend(weeks, reqs)
    .filter((r) => !decided.has(r.week))
    .map((r) => {
      const view: RecommendationView = {
        week: r.week,
        weekName: fig.week(r.week),
        headline: `${fig.week(r.week)} is ${fig.m3(r.shortM3)} short`,
        freeText: `${fig.m3(r.freeM3)} free after confirmed orders`,
        wantedText: `${fig.m3(r.demandM3)} wanted`,
        served: fmt.servedLines(r),
        moved: fmt.movedLines(r),
        decided: null,
        // The build-ahead alternative is shown on the board; the decision here is between the requests.
        prebuild: { stockCap: "", covers: "", stillShort: "", moves: [], possible: false, dissolves: false, served: [], moved: [] },
      };
      return {
        week: r.week,
        weekName: view.weekName,
        headline: view.headline,
        freeText: view.freeText,
        wantedText: view.wantedText,
        served: view.served,
        moved: view.moved,
        changeOptions: r.deferred.filter((d) => d.volumeM3 <= r.freeM3).map((d) => ({ id: d.requestId, label: `${fmt.who(d.requestId)} (${fig.m3(d.volumeM3)})` })),
        drafts: drafter(s.plant.name, view),
      };
    });

  return {
    title: "Decisions",
    banner: "Synthetic demo data. Every party is fictional and every figure is illustrative. This is not Chin Hin data.",
    intro:
      "The rule recommends; a person decides. Approve records the recommendation, Change serves a different request first and the calculator recomputes both sides. Either way a named person is required, and the server works out the ringgit itself.",
    error,
    pending,
    emptyNote: "No week is waiting for a decision.",
    draftNote:
      "These drafts are written from a template, not by a language model, and nothing is sent: this demo has no WhatsApp or email connection. A person copies a reply, approves it and sends it.",
    approverNote: "A typed name is not a login. It is here so that every ledger row names a person who took the decision.",
    allowedFigures: fig.all(),
  };
}

// ---- Ledger -----------------------------------------------------------------------------------------------

export interface LedgerRowView {
  id: string;
  weekName: string;
  when: string;
  by: string;
  mode: string;
  served: Line[];
  deferred: Line[];
  servedValue: string;
  deferredValue: string;
  note: string;
}
export interface LedgerModel {
  title: string;
  banner: string;
  intro: string;
  summary: { count: string; atStake: string; note: string } | null;
  rows: LedgerRowView[];
  emptyNote: string;
  allowedFigures: string[];
}

const MODE_LABEL: Record<LedgerRow["mode"], string> = {
  "recommendation-approved": "Approved the rule's recommendation",
  "changed-by-scheduler": "Changed by the scheduler",
};

/** What the ledger shows for the board's tiles: weeks decided and the ringgit at stake on the side served first. */
export function ledgerSummary(rows: readonly LedgerRow[]): { weeks: string[]; count: number; atStakeRM: number } {
  return { weeks: rows.map((r) => r.week), count: rows.length, atStakeRM: rows.reduce((t, r) => t + r.servedValueRM, 0) };
}

export function buildLedger(s: SyntheticScenario, rows: readonly LedgerRow[]): LedgerModel {
  const fig = new Figures();
  const fmt = lineFormatter(s, fig);
  const view = (l: LedgerLine): Line => fmt.line(l, l.movedTo);
  const sum = ledgerSummary(rows);
  return {
    title: "Ledger",
    banner: "Synthetic demo data. Every party is fictional and every figure is illustrative. This is not Chin Hin data.",
    intro:
      "Every decision a person has taken, with the ringgit on each side as the calculator worked it out at the time. Rows are only ever added; none can be edited or removed here.",
    summary:
      rows.length === 0
        ? null
        : {
            count: fig.n(sum.count),
            atStake: fig.rm(sum.atStakeRM),
            note: "Ringgit at stake on the side served first: what waiting one more week would have cost. It is not a saving. Nothing has been measured yet; a pilot would measure it.",
          },
    rows: [...rows].reverse().map((r) => ({
      id: r.id,
      weekName: fig.week(r.week),
      when: r.decidedAt.slice(0, 10),
      by: r.approvedBy,
      mode: MODE_LABEL[r.mode],
      served: r.served.map(view),
      deferred: r.deferred.map(view),
      servedValue: fig.rm(r.servedValueRM),
      deferredValue: fig.rm(r.deferredValueRM),
      note: fig.text(r.note),
    })),
    emptyNote: "No decision has been recorded yet.",
    allowedFigures: fig.all(),
  };
}
