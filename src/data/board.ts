// The board's view-model: everything the screen shows, already computed and formatted.
//
// Honesty mechanism (CLAUDE.md hard constraint #1): the React component only lays out strings from this
// model. Every number in those strings is produced through `Figures`, which also records it, so a test
// can render the page and fail if any figure on screen is missing from `allowedFigures`.

import { prebuildAlternative, recommend, weekBalances, type Recommendation, type WeekBalance } from "@/core/planner";
import type { Week } from "@/core/types";
import { toPricedRequests, toWeekCapacities } from "./scenario";
import type { SyntheticScenario } from "./schema";

const MINUS = "−"; // a real minus sign, so "-" is never read as a hyphen
const TICK_TARGET = 4; // roughly how many gridlines per side

/** Formats numbers and remembers every one it formats. */
export class Figures {
  private readonly seen = new Set<string>();

  /** A whole number with thousands separators. Signs are not part of the recorded figure. */
  n(x: number): string {
    const s = String(Math.round(Math.abs(x))).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    this.seen.add(s);
    return s;
  }
  m3(x: number): string {
    return `${this.n(x)} m³`;
  }
  rm(x: number): string {
    return `RM${this.n(x)}`;
  }
  signed(x: number): string {
    return `${x < 0 ? MINUS : ""}${this.n(x)}`;
  }
  /** "Week 43" from "2026-W43". */
  week(w: Week): string {
    return `Week ${this.n(Number(w.slice(-2)))}`;
  }
  all(): string[] {
    return [...this.seen].sort();
  }
}

/** The "W43" form used on chart axes (pattern-stripped by the honesty test as a week label). */
export const shortWeek = (w: Week): string => `W${w.slice(-2)}`;

export interface Kpi {
  id: string;
  label: string;
  value: string;
  note: string;
}

export interface Bar {
  week: Week;
  short: string;
  spareM3: number;
  kind: "spare" | "short";
  contested: boolean;
  /** Direct label: only on short weeks and the largest spare week (never on every bar). */
  label: string | null;
  /** Plain-language description for screen readers and the table twin. */
  aria: string;
}

export interface Chart {
  /** The axis runs from -extent to +extent, in m3. */
  extentM3: number;
  ticks: { m3: number; label: string }[];
  bars: Bar[];
  summary: string;
}

export interface Line {
  who: string;
  side: "internal" | "external";
  volume: string;
  value: string;
  /** What the ringgit figure means for this party. */
  valueMeaning: string;
  /** Where a moved request ends up. */
  to?: string;
}

export interface PrebuildView {
  stockCap: string;
  covers: string;
  stillShort: string;
  moves: string[];
  /** False when no earlier week has spare capacity to build ahead. */
  possible: boolean;
  dissolves: boolean;
  served: Line[];
  moved: Line[];
}

export interface RecommendationView {
  week: Week;
  weekName: string;
  headline: string;
  freeText: string;
  wantedText: string;
  served: Line[];
  moved: Line[];
  prebuild: PrebuildView;
}

export interface TableRow {
  who: string;
  side: string;
  volume: string;
  detail: string;
}

export interface BoardModel {
  title: string;
  plant: string;
  product: string;
  range: string;
  banner: string;
  kpis: Kpi[];
  chart: Chart;
  recommendations: RecommendationView[];
  /** The requests competing in the first contested week, plus the committed volume beneath them. */
  focus: { weekName: string; committed: string; rows: TableRow[] } | null;
  weekTable: { week: string; capacity: string; committed: string; free: string; wanted: string; spare: string }[];
  /** Shown beside the Approve and Change buttons. */
  actionsNote: string;
  notBuilt: string;
  /** Every figure that may appear on screen, as formatted ("2,000"). */
  allowedFigures: string[];
}

/** A tick step of 1, 2 or 5 x 10^k that gives about `target` ticks across `max`. */
export function niceStep(max: number, target: number = TICK_TARGET): number {
  if (max <= 0) return 1;
  const raw = max / target;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const f = raw / pow;
  return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * pow; // standard 1-2-5 rounding
}

export function buildBoard(s: SyntheticScenario): BoardModel {
  const fig = new Figures();
  const weeks = toWeekCapacities(s);
  const reqs = toPricedRequests(s);
  const balances = weekBalances(weeks, reqs);
  const recs = recommend(weeks, reqs);

  const names = new Map<string, string>([...s.projects.map((p) => [p.projectId, p.name] as const), ...s.customers.map((c) => [c.customerId, c.name] as const)]);
  const requestById = new Map(s.requests.map((r) => [r.id, r]));
  const who = (requestId: string): string => names.get(requestById.get(requestId)!.partyId) ?? requestId;
  const lossRisk = new Map(s.customers.map((c) => [c.customerId, c.lossRiskRM] as const));

  /** What the ringgit figure means for this particular request (it differs for zero-cost and key-account cases). */
  const meaning = (e: { requestId: string; side: "internal" | "external"; valueRM: number }): string => {
    if (e.side === "internal") {
      return e.valueRM === 0 ? "no extra cost: the project has float to absorb a week" : "extra late-handover cost of one more week's wait";
    }
    return (lossRisk.get(requestById.get(e.requestId)!.partyId) ?? 0) > 0 ? "margin plus the risk of losing a key account" : "margin at risk";
  };

  // Chart ---------------------------------------------------------------------------------------------
  const maxAbs = Math.max(1, ...balances.map((b) => Math.abs(b.spareM3)));
  const step = niceStep(maxAbs);
  const extent = Math.ceil(maxAbs / step) * step;
  const ticks: Chart["ticks"] = [];
  for (let m3 = -extent; m3 <= extent; m3 += step) ticks.push({ m3, label: fig.signed(m3) });

  const contestedWeeks = new Set(recs.map((r) => r.week));
  const biggestSpare = balances.filter((b) => b.spareM3 > 0).sort((a, b) => b.spareM3 - a.spareM3)[0];
  const bars: Bar[] = balances.map((b: WeekBalance) => {
    const isShort = b.spareM3 < 0;
    return {
      week: b.week,
      short: shortWeek(b.week),
      spareM3: b.spareM3,
      kind: isShort ? "short" : "spare",
      contested: contestedWeeks.has(b.week),
      label: isShort || b.week === biggestSpare?.week ? fig.signed(b.spareM3) : null,
      aria: `${fig.week(b.week)}: ${fig.m3(b.spareM3)} ${isShort ? "short" : "spare"}`,
    };
  });
  const shortWeeks = balances.filter((b) => b.spareM3 < 0);
  const chart: Chart = {
    extentM3: extent,
    ticks,
    bars,
    summary:
      shortWeeks.length === 0
        ? "Spare capacity by week. No week is short."
        : `Spare or short capacity by week. ${shortWeeks.map((b) => `${fig.week(b.week)} is ${fig.m3(b.spareM3)} short`).join("; ")}.`,
  };

  // Recommendations -------------------------------------------------------------------------------------
  const line = (e: { requestId: string; side: "internal" | "external"; volumeM3: number; valueRM: number }, to?: Week | null): Line => ({
    who: who(e.requestId),
    side: e.side,
    volume: fig.m3(e.volumeM3),
    value: fig.rm(e.valueRM),
    valueMeaning: meaning(e),
    ...(to === undefined ? {} : { to: to === null ? "no free week in this horizon" : fig.week(to) }),
  });
  const servedLines = (r: Recommendation): Line[] => r.served.map((e) => line(e));
  const movedLines = (r: Recommendation): Line[] => r.deferred.map((e) => line(e, e.movedTo));

  const recommendations: RecommendationView[] = recs.map((r) => {
    const alt = prebuildAlternative(weeks, reqs, r.week, s.plannerSettings.stockCapM3);
    const prebuild: PrebuildView = {
      stockCap: fig.m3(alt.stockCapM3),
      covers: fig.m3(alt.coveredM3),
      stillShort: fig.m3(alt.residualShortM3),
      moves: alt.moves.map((m) => `Build ${fig.m3(m.m3)} in ${fig.week(m.fromWeek)} to hold for ${fig.week(m.toWeek)}`),
      possible: alt.moves.length > 0,
      dissolves: alt.outcome === null,
      served: alt.outcome ? servedLines(alt.outcome) : [],
      moved: alt.outcome ? movedLines(alt.outcome) : [],
    };
    return {
      week: r.week,
      weekName: fig.week(r.week),
      headline: `${fig.week(r.week)} is ${fig.m3(r.shortM3)} short`,
      freeText: `${fig.m3(r.freeM3)} free after confirmed orders`,
      wantedText: `${fig.m3(r.demandM3)} wanted`,
      served: servedLines(r),
      moved: movedLines(r),
      prebuild,
    };
  });

  // The week in focus ---------------------------------------------------------------------------------
  const firstRec = recs[0];
  let focus: BoardModel["focus"] = null;
  if (firstRec) {
    const committed = weeks.find((w) => w.week === firstRec.week)!.committedM3;
    focus = {
      weekName: fig.week(firstRec.week),
      committed: `${fig.m3(committed)} already committed to confirmed orders`,
      rows: s.requests
        .filter((r) => r.week === firstRec.week)
        .map((r) => ({
          who: names.get(r.partyId) ?? r.partyId,
          side: r.side === "internal" ? "Internal" : "Outside",
          volume: fig.m3(r.volumeM3),
          detail: `confirmed ${r.confirmedOn}`,
        })),
    };
  }

  // KPIs: only figures that have a real source today ------------------------------------------------
  const worst = [...balances].sort((a, b) => a.spareM3 - b.spareM3)[0];
  const kpis: Kpi[] = [
    { id: "weeks-short", label: "Weeks short", value: fig.n(shortWeeks.length), note: "weeks where demand exceeds free capacity" },
    { id: "decisions", label: "Decisions waiting", value: fig.n(recs.length), note: "weeks the rule has to settle" },
    {
      id: "largest",
      label: "Largest shortage",
      value: worst && worst.spareM3 < 0 ? fig.m3(worst.spareM3) : fig.m3(0),
      note: worst && worst.spareM3 < 0 ? fig.week(worst.week) : "no week is short",
    },
  ];

  // Table twin of the chart ---------------------------------------------------------------------------
  const weekTable = balances.map((b) => ({
    week: b.week,
    capacity: fig.m3(b.capacityM3),
    committed: fig.m3(b.committedM3),
    free: fig.m3(b.freeM3),
    wanted: fig.m3(b.requestedM3),
    spare: `${b.spareM3 < 0 ? MINUS : ""}${fig.m3(b.spareM3)}`,
  }));

  const first = balances[0]!.week;
  const last = balances[balances.length - 1]!.week;
  return {
    title: "Plant Load Radar",
    plant: s.plant.name,
    product: s.plant.product,
    range: `${first} to ${last}`,
    banner: "Synthetic demo data. Every party is fictional and every figure is illustrative. This is not Chin Hin data.",
    kpis,
    chart,
    recommendations,
    focus,
    weekTable,
    actionsNote: "Switched off in this build. Approving will write to the ledger in a later phase, and only a person can approve.",
    notBuilt: "Not built yet: the orders inbox, approval and ledger, and ask-the-board arrive in later phases. Approve and Change are switched off in this build.",
    allowedFigures: fig.all(),
  };
}
