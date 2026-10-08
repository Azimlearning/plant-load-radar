// The business-case page's view-model: what today's arrangement costs, as a worked example, already formatted.
// Same honesty mechanism as the board: every number on screen goes through `Figures`, and a test fails on any
// number that is not registered. The arithmetic lives in src/core/value.ts; this file resolves inputs and formats.

import { dailyDelayRateRM } from "@/core/costs";
import { totalOf, unitCosts, valueCase, type Band, type Source, type Unit, type ValueInputs as CoreInputs } from "@/core/value";
import { Figures } from "./board";
import { loadJsonDataset } from "./loaders";
import { PublicFactsFileSchema, SyntheticScenarioSchema, ValueInputsSchema, type SyntheticScenario, type ValueInputs } from "./schema";
import { SCENARIO_FILE } from "./synth";

export const VALUE_INPUTS_FILE = "synthetic/value-inputs.json";
export const CARRYING_FILE = "public/carrying-cost-range.json";

const SOURCE_LABEL: Record<Source, string> = {
  public: "Public, low authority",
  scenario: "Synthetic scenario",
  placeholder: "Assumed placeholder (no public AAC price)",
  assumed: "Assumed",
  derived: "Worked out",
};

export interface StepView {
  label: string;
  low: string;
  base: string;
  high: string;
  source: string;
  /** True for the last step of a line: the result. */
  result: boolean;
}
export interface LineView {
  id: string;
  title: string;
  formula: string;
  steps: StepView[];
}
export interface AssumptionView {
  what: string;
  range: string;
  why: string;
  replaceWith: string;
}
export interface ValueModel {
  title: string;
  banner: string;
  intro: string;
  scrollHint: string;
  total: { low: string; base: string; high: string; note: string };
  lines: LineView[];
  units: { label: string; low: string; base: string; high: string; source: string }[];
  reading: string[];
  carryingSource: string;
  assumptions: AssumptionView[];
  pilot: string[];
  doNotSay: string;
  footnote: string;
  allowedFigures: string[];
}

const mean = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length;

/** Resolve the calculator's inputs from the scenario, the public carrying-cost range and the assumed bands. */
export function resolveInputs(s: SyntheticScenario, assumed: ValueInputs, carrying: { low: number; high: number }): CoreInputs {
  const largest = [...s.projects].sort((a, b) => dailyDelayRateRM(b) - dailyDelayRateRM(a))[0]!;
  const band = (b: { low: number; base: number; high: number }): Band => ({ low: b.low, base: b.base, high: b.high });
  return {
    weeklyCapacityM3: mean(s.capacity.map((c) => c.capacityM3)),
    variableCostPerM3RM: mean(s.customers.map((c) => c.variableCostPerM3RM)),
    marginPerM3RM: mean(s.customers.map((c) => c.pricePerM3RM - c.variableCostPerM3RM)),
    delayRatePerDayRM: dailyDelayRateRM(largest),
    carryingRate: { low: carrying.low, base: (carrying.low + carrying.high) / 2, high: carrying.high },
    excessStockWeeks: band(assumed.excessStockWeeksOfOutput),
    shortWeeksPerYear: band(assumed.shortWeeksPerYear),
    outsideM3LostPerShortWeek: band(assumed.outsideM3LostPerShortWeek),
    delayDaysPerYear: band(assumed.delayDaysPerYear),
  };
}

export function buildValue(s: SyntheticScenario, assumed: ValueInputs, carrying: { low: number; high: number; source: string }): ValueModel {
  const fig = new Figures();
  const show = (x: number, unit: Unit): string => {
    switch (unit) {
      case "m3": return fig.m3(x);
      case "RM": return fig.rm(x);
      case "RM/m3": return `${fig.rm(x)} per m³`;
      case "RM/day": return `${fig.rm(x)} per day`;
      case "weeks": return fig.dec(x, 1);
      case "days":
      case "count": return fig.n(x);
      case "rate": return `${fig.n(x * 100)}%`;
    }
  };
  const cells = (b: Band, unit: Unit) => ({ low: show(b.low, unit), base: show(b.base, unit), high: show(b.high, unit) });

  const lines = valueCase(resolveInputs(s, assumed, carrying));
  const total = totalOf(lines);

  const range = (b: { low: number; high: number }, unit: Unit): string => `${show(b.low, unit)} to ${show(b.high, unit)}`;
  const assumptions: AssumptionView[] = [
    { what: "Weeks of output held as excess stock", range: range(assumed.excessStockWeeksOfOutput, "weeks"), ...pick(assumed.excessStockWeeksOfOutput) },
    { what: "Short weeks a year", range: range(assumed.shortWeeksPerYear, "count"), ...pick(assumed.shortWeeksPerYear) },
    { what: "Outside volume lost in a short week", range: range(assumed.outsideM3LostPerShortWeek, "m3"), ...pick(assumed.outsideM3LostPerShortWeek) },
    { what: "Delay days a year", range: range(assumed.delayDaysPerYear, "days"), ...pick(assumed.delayDaysPerYear) },
  ].map((a) => ({ ...a, why: fig.text(a.why), replaceWith: fig.text(a.replaceWith) }));

  return {
    title: "What today's arrangement costs",
    banner: "Synthetic demo data. This is a worked example with invented inputs, not a finding about Chin Hin. Every figure is illustrative.",
    intro:
      "The brief asks for the cost of today's setup, with the working shown. Each cost below is one formula. Every step says where its number came from, and the assumed ones say what real Chin Hin data would replace them.",
    scrollHint: "Narrow screen: scroll the tables sideways to see the Low, Base and High columns.",
    total: { ...cells(total, "RM"), note: "Added together for the worked example only. The three costs are different in kind, so read them one at a time." },
    units: unitCosts(resolveInputs(s, assumed, carrying)).map((u) => ({ label: u.label, ...cells(u.band, u.unit), source: SOURCE_LABEL[u.source] })),
    lines: lines.map((l) => ({
      id: l.id,
      title: l.title,
      formula: l.formula,
      steps: l.steps.map((st, i) => ({ label: st.label, ...cells(st.band, st.unit), source: SOURCE_LABEL[st.source], result: i === l.steps.length - 1 })),
    })),
    reading: [
      "Low, base and high combine all the low, all the base and all the high inputs. It is a spread to show sensitivity, not a probability range.",
      "The late-handover cost is an upper bound. It is charged only after the handover deadline passes, it uses the largest project's purchase price, and whether a materials shortage extends the deadline is not known.",
      "The carrying rate is a generic range that includes the cost of stock going out of date, which AAC largely avoids, and Chin Hin's own cost of money is not known. The excess-stock line is therefore probably overstated; read its low end as the more likely one.",
      "None of these costs is what the rule saves. How much of each it recovers is unknown until a pilot measures it, so this page makes no claim of benefit.",
    ],
    carryingSource: `The carrying rate is a generic range quoted by ${carrying.source}. AAC is durable and slow to go out of date, so the true rate is probably at the low end.`,
    assumptions,
    pilot: [
      "Cash released from excess stock",
      "Outside margin no longer lost",
      "Project delay days avoided",
    ],
    doNotSay: "Not measured: adoption, logins or satisfaction. The brief rules them out.",
    footnote: "Figures are rounded for display; the arithmetic uses the unrounded values, so a hand calculation from the rounded steps can differ slightly.",
    allowedFigures: fig.all(),
  };
}

const pick = (b: { why: string; replaceWith: string }): { why: string; replaceWith: string } => ({ why: b.why, replaceWith: b.replaceWith });

/** Server-side: read the scenario, the assumed bands and the public carrying-cost range through the manifest-enforcing loader. */
export function loadValue(): ValueModel {
  const s = loadJsonDataset(SCENARIO_FILE, SyntheticScenarioSchema).data;
  const assumed = loadJsonDataset(VALUE_INPUTS_FILE, ValueInputsSchema).data;
  const facts = loadJsonDataset(CARRYING_FILE, PublicFactsFileSchema).data.facts;
  const get = (key: string): { value: number; sourceName: string } => {
    const f = facts.find((x) => x.key === key);
    if (!f || typeof f.value !== "number") throw new Error(`Public fact ${key} is missing or not a number`);
    return { value: f.value, sourceName: f.sourceName };
  };
  const low = get("carrying.total.low");
  const high = get("carrying.total.high");
  return buildValue(s, assumed, { low: low.value, high: high.value, source: low.sourceName });
}
