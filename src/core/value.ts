// The business case's arithmetic: what today's arrangement costs, as a worked example with low/base/high bands.
// Pure: no LLM, no I/O. Inputs arrive already resolved (scenario figures, a public carrying-cost range, assumed
// bands); every step records where its number came from, so the page can show the working.
// A band combines all-low, all-base and all-high. It is not a probability range.

import { workingCapitalCostPerYearRM } from "./costs";

export interface Band {
  low: number;
  base: number;
  high: number;
}
export type Source = "public" | "scenario" | "placeholder" | "assumed" | "derived";
export type Unit = "m3" | "RM" | "RM/m3" | "RM/day" | "weeks" | "days" | "rate" | "count";

export interface Step {
  label: string;
  band: Band;
  unit: Unit;
  source: Source;
}
export interface ValueLine {
  id: "stock" | "margin" | "delay";
  title: string;
  formula: string;
  /** The last step is the result. */
  steps: Step[];
  result: Band;
}

export interface ValueInputs {
  weeklyCapacityM3: number;
  variableCostPerM3RM: number;
  /** Selling price minus variable cost, per m3, for an outside order. */
  marginPerM3RM: number;
  /** LAD plus idle site cost per day for the featured project, before any schedule sensitivity. */
  delayRatePerDayRM: number;
  carryingRate: Band;
  excessStockWeeks: Band;
  shortWeeksPerYear: Band;
  outsideM3LostPerShortWeek: Band;
  delayDaysPerYear: Band;
}

const fixed = (x: number): Band => ({ low: x, base: x, high: x });
const map2 = (a: Band, b: Band, f: (x: number, y: number) => number): Band => ({ low: f(a.low, b.low), base: f(a.base, b.base), high: f(a.high, b.high) });
const times = (a: Band, b: Band): Band => map2(a, b, (x, y) => x * y);

function checkBand(b: Band, name: string): void {
  for (const v of [b.low, b.base, b.high]) if (!Number.isFinite(v) || v < 0) throw new Error(`${name} must be finite and >= 0`);
  if (!(b.low <= b.base && b.base <= b.high)) throw new Error(`${name} must satisfy low <= base <= high`);
}

export function valueCase(i: ValueInputs): ValueLine[] {
  const bands = { carryingRate: i.carryingRate, excessStockWeeks: i.excessStockWeeks, shortWeeksPerYear: i.shortWeeksPerYear, outsideM3LostPerShortWeek: i.outsideM3LostPerShortWeek, delayDaysPerYear: i.delayDaysPerYear };
  for (const [name, b] of Object.entries(bands)) checkBand(b, name);
  const scalars = { weeklyCapacityM3: i.weeklyCapacityM3, variableCostPerM3RM: i.variableCostPerM3RM, marginPerM3RM: i.marginPerM3RM, delayRatePerDayRM: i.delayRatePerDayRM };
  for (const [name, v] of Object.entries(scalars)) if (!Number.isFinite(v) || v < 0) throw new Error(`${name} must be finite and >= 0`);

  // 1. Cash tied up in excess stock: value held beyond need x the yearly carrying rate.
  const stockM3 = times(fixed(i.weeklyCapacityM3), i.excessStockWeeks);
  const stockValue = times(stockM3, fixed(i.variableCostPerM3RM));
  const stockCost = map2(stockValue, i.carryingRate, workingCapitalCostPerYearRM);

  // 2. Margin lost on outside orders turned away in short weeks.
  const lostM3 = times(i.shortWeeksPerYear, i.outsideM3LostPerShortWeek);
  const marginLost = times(lostM3, fixed(i.marginPerM3RM));

  // 3. Late-handover cost: days past the deadline x the daily rate.
  const delayCost = times(i.delayDaysPerYear, fixed(i.delayRatePerDayRM));

  return [
    {
      id: "stock",
      title: "Cash tied up in excess stock",
      formula: "weekly output × weeks held × cost per m³ × yearly carrying rate",
      steps: [
        { label: "Average weekly output", band: fixed(i.weeklyCapacityM3), unit: "m3", source: "scenario" },
        { label: "Weeks of output held as excess stock", band: i.excessStockWeeks, unit: "weeks", source: "assumed" },
        { label: "Excess stock", band: stockM3, unit: "m3", source: "derived" },
        { label: "Variable cost per m³", band: fixed(i.variableCostPerM3RM), unit: "RM/m3", source: "placeholder" },
        { label: "Cash tied up in that stock (one-off, not a yearly cost)", band: stockValue, unit: "RM", source: "derived" },
        { label: "Yearly carrying rate", band: i.carryingRate, unit: "rate", source: "public" },
        { label: "Carrying cost per year", band: stockCost, unit: "RM", source: "derived" },
      ],
      result: stockCost,
    },
    {
      id: "margin",
      title: "Margin lost on outside orders",
      formula: "short weeks a year × outside m³ lost per short week × margin per m³",
      steps: [
        { label: "Short weeks a year", band: i.shortWeeksPerYear, unit: "count", source: "assumed" },
        { label: "Outside volume lost in a short week", band: i.outsideM3LostPerShortWeek, unit: "m3", source: "assumed" },
        { label: "Outside volume lost per year", band: lostM3, unit: "m3", source: "derived" },
        { label: "Margin per m³ (price minus variable cost)", band: fixed(i.marginPerM3RM), unit: "RM/m3", source: "placeholder" },
        { label: "Margin lost per year", band: marginLost, unit: "RM", source: "derived" },
      ],
      result: marginLost,
    },
    {
      id: "delay",
      title: "Late-handover cost of project delay",
      formula: "delay days a year × late-handover cost per day (purchase price × the legal yearly rate ÷ days in the year)",
      steps: [
        { label: "Days a year a project passes its deadline because materials were late", band: i.delayDaysPerYear, unit: "days", source: "assumed" },
        { label: "Late-handover cost per day (upper bound, largest project)", band: fixed(i.delayRatePerDayRM), unit: "RM/day", source: "scenario" },
        { label: "Delay cost per year", band: delayCost, unit: "RM", source: "derived" },
      ],
      result: delayCost,
    },
  ];
}

/** Unit costs: the same inputs without the invented counts, so Chin Hin can multiply by its own. */
export interface UnitCost {
  label: string;
  band: Band;
  unit: Unit;
  source: Source;
}
export function unitCosts(i: ValueInputs): UnitCost[] {
  const perWeekHeld = map2(fixed(i.weeklyCapacityM3 * i.variableCostPerM3RM), i.carryingRate, workingCapitalCostPerYearRM);
  return [
    { label: "Carrying cost per year of holding one week of average output as excess stock", band: perWeekHeld, unit: "RM", source: "derived" },
    { label: "Margin lost per m³ of outside orders turned away", band: fixed(i.marginPerM3RM), unit: "RM/m3", source: "placeholder" },
    { label: "Late-handover cost per day past the deadline (largest project, upper bound)", band: fixed(i.delayRatePerDayRM), unit: "RM/day", source: "scenario" },
  ];
}

/** The lines added together, band by band. */
export const totalOf = (lines: ValueLine[]): Band => lines.reduce<Band>((t, l) => map2(t, l.result, (a, b) => a + b), fixed(0));
