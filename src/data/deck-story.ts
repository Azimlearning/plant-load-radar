// Server-side only (reads files). The deck-story scenario (ADR D-20): the revised deck's numbers, built by construction.
//
// It is derived from the generated scenario (src/data/synth.ts) plus data/synthetic/deck-story-params.json, so the party
// cards, names and week-43 requests stay the same as the stress scenario while the other weeks, Project A's price and slip,
// Contractor B's order and every outside margin follow slides 3, 7, 9 and 10. Pure function of its two inputs, so the
// committed file can be checked for staleness exactly as scenario.json is.

import { addDays } from "@/core/dates";
import { activeReservedM3 } from "@/core/fairness";
import { weekSequence, weekStart } from "@/core/weeks";
import { dataDir, loadJsonDataset } from "./loaders";
import { DeckStoryParamsSchema, SyntheticScenarioSchema, type DeckStoryParams, type FirmOrder, type ScenarioRequest, type SyntheticScenario } from "./schema";
import { SCENARIO_FILE } from "./synth";

export const DECK_PARAMS_FILE = "synthetic/deck-story-params.json";
export const DECK_SCENARIO_FILE = "synthetic/deck-story.json";
export const DECK_GENERATOR = "src/data/deck-story.ts";

const DAYS_PER_WEEK = 7;
const FIRM_ORDER_STEP_M3 = 10;
const DECIMALS = 1_000_000; // derived floats are rounded to 6 places so output is stable across machines
const round6 = (x: number): number => Math.round(x * DECIMALS) / DECIMALS;

const pad = (n: number): string => String(n).padStart(2, "0");

/** Split `total` across `shares` on a fixed step, summing exactly to `total` (the last part takes the remainder). */
function split(total: number, shares: readonly number[], step: number): number[] {
  const weight = shares.reduce((s, x) => s + x, 0);
  const sizes = shares.map((x) => Math.floor((total * x) / weight / step) * step);
  sizes[sizes.length - 1] = sizes[sizes.length - 1]! + (total - sizes.reduce((s, v) => s + v, 0));
  return sizes.filter((v) => v > 0);
}

export function buildDeckStory(base: SyntheticScenario, p: DeckStoryParams): SyntheticScenario {
  const weeks = weekSequence(p.startWeek, p.weekCount);
  const scripted = new Map(p.scriptedWeeks.map((w) => [w.week, w] as const));
  const keep = new Set(p.keepWeeks);
  for (const w of weeks) {
    if (scripted.has(w) === keep.has(w)) throw new Error(`Week ${w} must be either kept or scripted, not both or neither`);
  }
  if ([...scripted.keys(), ...keep].some((w) => !weeks.includes(w))) throw new Error("A scripted or kept week is outside the scenario");

  const capacity = weeks.map((w) => {
    const c = base.capacity.find((x) => x.week === w);
    if (!c) throw new Error(`Base scenario has no capacity for ${w}`);
    return c;
  });

  // The outside margin is the public segment PBT margin carried in the base scenario's calibration (ADR D-20).
  const margin = base.meta.calibration.aacPrecastPbtMargin?.value;
  if (margin === undefined) throw new Error("Base scenario has no aacPrecastPbtMargin calibration");

  // Party cards ---------------------------------------------------------------------------------------------
  const projects = base.projects.map((c) =>
    c.projectId === p.featuredProject.projectId
      ? { ...c, purchasePriceRM: p.featuredProject.purchasePriceRM, scheduleSensitivity: p.featuredProject.slipDaysPerWeekOfDelay / DAYS_PER_WEEK }
      : c,
  );
  if (!projects.some((c) => c.projectId === p.featuredProject.projectId)) throw new Error(`Unknown project ${p.featuredProject.projectId}`);

  const featuredRequest = base.requests.find((r) => r.partyId === p.featuredCustomer.customerId && keep.has(r.week));
  if (!featuredRequest) throw new Error(`${p.featuredCustomer.customerId} has no request in a kept week to price`);
  const customers = base.customers.map((c) => {
    const price = c.customerId === p.featuredCustomer.customerId ? round6(p.featuredCustomer.orderValueRM / featuredRequest.volumeM3) : c.pricePerM3RM;
    return { ...c, pricePerM3RM: price, variableCostPerM3RM: round6(price * (1 - margin)) };
  });

  // Requests: kept weeks as they were, scripted weeks from the params -----------------------------------------
  const requests: ScenarioRequest[] = [];
  for (const w of weeks) {
    if (keep.has(w)) {
      requests.push(...base.requests.filter((r) => r.week === w));
    } else {
      scripted.get(w)!.requests.forEach((r, i) =>
        requests.push({
          id: `req-${w}-${pad(i + 1)}`,
          week: w,
          side: r.side,
          partyId: r.partyId,
          volumeM3: r.volumeM3,
          confirmedOn: addDays(weekStart(w), -r.confirmedDaysBefore),
        }),
      );
    }
  }

  // Firm orders: kept weeks as they were; scripted weeks fill capacity down to the free volume ----------------------
  const firmOrders: FirmOrder[] = [];
  for (const c of capacity) {
    if (keep.has(c.week)) {
      firmOrders.push(...base.firmOrders.filter((o) => o.week === c.week));
      continue;
    }
    // Committed volume = firm orders + reservations still active on the as-of date; free capacity is what slide 9 shows.
    const reserved = p.reservations.filter((r) => r.week === c.week).reduce((t, r) => t + activeReservedM3(r, p.asOf), 0);
    const committed = c.capacityM3 - scripted.get(c.week)!.freeM3 - reserved;
    if (committed < 0) throw new Error(`${c.week}: free volume plus reservations exceed capacity`);
    const internal = Math.round((committed * p.firm.internalShare) / FIRM_ORDER_STEP_M3) * FIRM_ORDER_STEP_M3;
    let k = 0;
    for (const [side, total, parties] of [
      ["internal", internal, p.firm.internalParties],
      ["external", committed - internal, p.firm.externalParties],
    ] as const) {
      split(total, p.firm.splitShares, FIRM_ORDER_STEP_M3).forEach((volumeM3, i) => {
        k += 1;
        firmOrders.push({ id: `firm-${c.week}-${pad(k)}`, week: c.week, side, partyId: parties[i % parties.length]!, volumeM3 });
      });
    }
  }

  return SyntheticScenarioSchema.parse({
    meta: {
      ...base.meta,
      weekCount: p.weekCount,
      startWeek: p.startWeek,
      paramsFile: `data/${DECK_PARAMS_FILE}`,
      generator: DECK_GENERATOR,
      notes: [
        ...base.meta.notes,
        "Deck story (ADR D-20): derived from data/synthetic/scenario.json and deck-story-params.json so the board shows the revised deck's weeks 41 to 46 and its headline figures. Illustrative, not Chin Hin data.",
        "Project A is priced from RM530m, an upper bound (Avantro's GDV); every outside customer earns the public 10.8% AAC and precast PBT margin, as slide 15 states.",
      ],
    },
    plant: base.plant,
    plannerSettings: base.plannerSettings,
    capacity,
    projects,
    customers,
    firmOrders,
    requests,
    displayWeeks: p.displayWeeks,
    whatIf: p.whatIf,
    asOf: p.asOf,
    reservations: p.reservations,
    reservationPolicy: p.reservationPolicy,
    huddle: p.huddle,
  });
}

export function generateDeckStory(dir: string = dataDir()): SyntheticScenario {
  const base = loadJsonDataset(SCENARIO_FILE, SyntheticScenarioSchema, dir).data;
  const params = loadJsonDataset(DECK_PARAMS_FILE, DeckStoryParamsSchema, dir).data;
  return buildDeckStory(base, params);
}
