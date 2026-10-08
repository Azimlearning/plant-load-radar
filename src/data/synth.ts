// Server-side only (reads files). Seeded generator for the demo scenario (P0 Task 5, ADR D-14).
//
// Everything here is `synthetic`: invented, but calibrated where public data allows:
//   - weekly capacity   <- Chin Hin's stated capacity added by the third AAC plant (public)
//   - seasonality       <- DOSM quarterly real construction GDP, excluding pandemic years (public, CC BY 4.0)
//   - demand growth     <- DOSM construction GDP growth, latest quarter (public)
//   - project sizes     <- Chin Hin's unbilled property sales (public)
//   - contribution margin <- Chin Hin's AAC + precast PBT margin plus an assumed fixed-cost share
// Everything else is a parameter in data/synthetic/params.json with a provenance note.
// Same seed + same inputs => byte-identical output (see synth.test.ts).

import { addDays } from "@/core/dates";
import { weekSequence, weekStart } from "@/core/weeks";
import { dataDir, loadJsonDataset } from "./loaders";
import {
  PublicFactsFileSchema,
  SeriesFileSchema,
  SynthParamsSchema,
  SyntheticScenarioSchema,
  type FirmOrder,
  type ScenarioRequest,
  type SynthParams,
  type SyntheticScenario,
} from "./schema";

export const PARAMS_FILE = "synthetic/params.json";
export const SCENARIO_FILE = "synthetic/scenario.json";
export const GENERATOR = "src/data/synth.ts";

const WEEKS_PER_YEAR = 52;
const BILLION = 1_000_000_000;
const PROJECT_SIZE_STEP_RM = 100_000;
const FIRM_ORDER_STEP_M3 = 10;
const QUARTERS = [1, 2, 3, 4] as const;
const DAYS_TO_THURSDAY = 3; // an ISO week belongs to the month/quarter of its Thursday
const DECIMALS = 1_000_000; // derived floats are rounded to 6 places so output is stable across machines
const STORY_EXTRA_REQUESTS_MAX = 3;
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// ---- deterministic randomness -----------------------------------------------------------------

/** mulberry32: small, fast, seedable. Not cryptographic, and does not need to be. */
class Rng {
  private state: number;
  constructor(seed: number) {
    this.state = seed | 0;
  }
  next(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  }
  float(min: number, max: number): number {
    return min + (max - min) * this.next();
  }
  int(min: number, max: number): number {
    return Math.floor(this.float(min, max + 1));
  }
  chance(p: number): boolean {
    return this.next() < p;
  }
  pick<T>(items: readonly T[]): T {
    return items[this.int(0, items.length - 1)]!;
  }
}

const round6 = (x: number): number => Math.round(x * DECIMALS) / DECIMALS;
const roundTo = (x: number, step: number): number => Math.round(x / step) * step;

// ---- calibration from public data -------------------------------------------------------------

export interface Calibration {
  weeklyNominalCapacityM3: number;
  unbilledSalesRM: number;
  aacPrecastPbtMargin: number;
  contributionMarginRatio: number;
  demandGrowthYoy: number;
  seasonalIndex: Record<1 | 2 | 3 | 4, number>;
}

function factValue(file: string, key: string, dir: string): number {
  const f = loadJsonDataset(file, PublicFactsFileSchema, dir).data.facts.find((x) => x.key === key);
  if (!f || typeof f.value !== "number") throw new Error(`Public fact ${key} not found in ${file}`);
  return f.value;
}

/** Quarter-of-year demand index from real construction GDP: each quarter's mean ratio to its year's mean. */
export function seasonalIndex(
  quarterly: readonly { date: string; value: number }[],
  excludedYears: readonly number[],
): Record<1 | 2 | 3 | 4, number> {
  const byYear = new Map<number, number[]>();
  for (const { date, value } of quarterly) {
    const year = Number(date.slice(0, 4));
    const q = Math.floor((Number(date.slice(5, 7)) - 1) / 3);
    const arr = byYear.get(year) ?? [];
    arr[q] = value;
    byYear.set(year, arr);
  }
  const sums: Record<number, { total: number; n: number }> = { 1: { total: 0, n: 0 }, 2: { total: 0, n: 0 }, 3: { total: 0, n: 0 }, 4: { total: 0, n: 0 } };
  for (const [year, arr] of byYear) {
    if (excludedYears.includes(year) || arr.length !== 4 || arr.some((v) => v === undefined)) continue; // complete years only
    const mean = arr.reduce((s, v) => s + v, 0) / 4;
    QUARTERS.forEach((q) => {
      sums[q]!.total += arr[q - 1]! / mean;
      sums[q]!.n += 1;
    });
  }
  const out = {} as Record<1 | 2 | 3 | 4, number>;
  for (const q of QUARTERS) {
    if (sums[q]!.n === 0) throw new Error("No complete years left to estimate seasonality");
    out[q] = round6(sums[q]!.total / sums[q]!.n);
  }
  return out;
}

export function calibrate(params: SynthParams, dir: string = dataDir()): Calibration {
  const CAP = "public/chinhin-capacity-statements.json";
  const SEG = "public/chinhin-segments-q2fy26.json";
  const thirdPlant = factValue(CAP, "chinhin.aac.capacity.third_plant_addition_m3_year", dir);
  const unbilled = factValue(CAP, "chinhin.pipeline.unbilled_property_rm_billion", dir) * BILLION;
  const pbtMargin =
    factValue(SEG, "chinhin.seg.aac_precast.pbt.q2fy26", dir) / factValue(SEG, "chinhin.seg.aac_precast.revenue.q2fy26", dir);

  const gdp = loadJsonDataset("public/dosm-gdp-construction-quarterly.json", SeriesFileSchema, dir).data.rows;
  const abs = gdp.filter((r) => r.code === "p4" && r.series === "abs");
  const yoy = gdp.filter((r) => r.code === "p4" && r.series === "growth_yoy").sort((a, b) => a.date.localeCompare(b.date));
  const latestYoy = yoy[yoy.length - 1];
  if (!latestYoy) throw new Error("No construction growth data");

  return {
    weeklyNominalCapacityM3: Math.round((thirdPlant / WEEKS_PER_YEAR) * params.capacity.availabilityFactor),
    unbilledSalesRM: unbilled,
    aacPrecastPbtMargin: round6(pbtMargin),
    contributionMarginRatio: round6(pbtMargin + params.margin.fixedCostShareOfRevenue),
    demandGrowthYoy: round6(latestYoy.value / 100),
    seasonalIndex: seasonalIndex(abs, params.demand.calibrationExcludedYears),
  };
}

// ---- generation -------------------------------------------------------------------------------

/** Seasonal level for the quarter, tilted by public growth: index^(position / 52 weeks) compounding. */
export function demandMultiplier(cal: Pick<Calibration, "seasonalIndex" | "demandGrowthYoy">, quarter: 1 | 2 | 3 | 4, weekIndex: number): number {
  return cal.seasonalIndex[quarter] * (1 + cal.demandGrowthYoy) ** (weekIndex / WEEKS_PER_YEAR);
}

function quarterOfWeek(week: string): 1 | 2 | 3 | 4 {
  const thursday = addDays(weekStart(week), DAYS_TO_THURSDAY);
  return (Math.floor((Number(thursday.slice(5, 7)) - 1) / 3) + 1) as 1 | 2 | 3 | 4;
}

/** Split `total` into 1..maxParts positive parts on a fixed step, summing exactly to `total`. */
function splitVolume(rng: Rng, total: number, parts: number, step: number): number[] {
  if (total <= 0) return [];
  const weights = Array.from({ length: parts }, () => 0.5 + rng.next());
  const sum = weights.reduce((s, w) => s + w, 0);
  const sizes = weights.map((w) => Math.floor((total * w) / sum / step) * step);
  sizes[0] = sizes[0]! + (total - sizes.reduce((s, v) => s + v, 0));
  return sizes.filter((v) => v > 0);
}

export function generateScenario(dir: string = dataDir(), seedOverride?: number): SyntheticScenario {
  const loaded = loadJsonDataset(PARAMS_FILE, SynthParamsSchema, dir).data;
  const params = seedOverride === undefined ? loaded : { ...loaded, seed: seedOverride };
  const cal = calibrate(params, dir);
  const rng = new Rng(params.seed);
  const weeks = weekSequence(params.startWeek, params.weekCount);
  const first = weekStart(params.startWeek);

  if (!weeks.includes(params.story.week)) throw new Error(`Story week ${params.story.week} is outside the scenario`);

  // Capacity ------------------------------------------------------------------------------------
  const capacity = weeks.map((week) => {
    const factor = params.capacity.maintenance.find((m) => m.week === week)?.capacityFactor ?? 1;
    return {
      plant: params.plant.id,
      product: params.plant.product,
      week,
      capacityM3: Math.round(cal.weeklyNominalCapacityM3 * factor),
    };
  });

  // Internal projects (delay-cost cards) ---------------------------------------------------------
  const storyMonday = weekStart(params.story.week);
  const fp = params.story.featuredProject;
  const featuredDeadline = addDays(storyMonday, -fp.deadlineDaysBeforeWeek);
  const projects = [
    {
      name: fp.name,
      projectId: "project-a",
      purchasePriceRM: fp.purchasePriceRM,
      projectedHandover: addDays(featuredDeadline, fp.projectedDaysAfterDeadline),
      handoverDeadline: featuredDeadline,
      bufferDays: fp.bufferDays,
      idleSiteCostPerDayRM: params.projects.idleSiteCostPerDayRM,
      scheduleSensitivity: fp.scheduleSensitivity,
    },
  ];
  for (let i = 2; i <= params.projects.count; i++) {
    const deadline = addDays(first, rng.int(params.projects.deadlineOffsetDays.min, params.projects.deadlineOffsetDays.max));
    projects.push({
      name: `Project ${LETTERS[i - 1] ?? i} (fictional)`,
      projectId: `project-${LETTERS[i - 1]!.toLowerCase()}`,
      purchasePriceRM: roundTo(
        cal.unbilledSalesRM * rng.float(params.projects.shareOfUnbilledSales.min, params.projects.shareOfUnbilledSales.max),
        PROJECT_SIZE_STEP_RM,
      ),
      projectedHandover: addDays(deadline, -rng.int(params.projects.projectedFloatDays.min, params.projects.projectedFloatDays.max)),
      handoverDeadline: deadline,
      bufferDays: rng.int(params.projects.bufferDays.min, params.projects.bufferDays.max),
      idleSiteCostPerDayRM: params.projects.idleSiteCostPerDayRM,
      scheduleSensitivity: round6(rng.float(params.projects.scheduleSensitivity.min, params.projects.scheduleSensitivity.max)),
    });
  }

  // Outside customers (margin cards) --------------------------------------------------------------
  const customers = Array.from({ length: params.customers.count }, (_, i) => {
    const price = round6(params.customers.pricePerM3RM * (1 + params.customers.priceSpread * rng.float(-1, 1)));
    const ratio = cal.contributionMarginRatio + params.margin.customerNoise * rng.float(-1, 1);
    const keyAccount = i >= params.customers.count - params.customers.keyAccountCount;
    return {
      name: `Contractor ${LETTERS[i] ?? i} (fictional)`,
      customerId: `contractor-${(LETTERS[i] ?? String(i)).toLowerCase()}`,
      pricePerM3RM: price,
      variableCostPerM3RM: round6(price * (1 - ratio)),
      keyAccount,
      lossRiskRM: keyAccount ? params.customers.lossRiskRMKeyAccount : 0,
    };
  });
  const internalIds = projects.map((p) => p.projectId);
  const externalIds = customers.map((c) => c.customerId);
  const contractorB = customers[1]!.customerId; // the deck's "Contractor B"

  // The story week is built so the deck's example works by construction: free capacity fits Project A on its
  // own but not Project A plus Contractor B, and total demand exceeds free capacity by exactly the shortfall.
  const storyFreeM3 = params.story.internalRequestM3 + roundTo(params.story.externalRequestM3 / 2, params.requests.volumeStepM3);
  const storyOtherDemandM3 = params.story.shortfallM3 + storyFreeM3 - params.story.internalRequestM3 - params.story.externalRequestM3;
  const storyCap = capacity.find((c) => c.week === params.story.week)!.capacityM3;
  if (storyOtherDemandM3 < 0) throw new Error("story.shortfallM3 is too small for the story requests");
  if (storyFreeM3 > storyCap) throw new Error("story requests do not fit in the story week's capacity");

  // New requests ------------------------------------------------------------------------------------------
  const requests: ScenarioRequest[] = [];
  weeks.forEach((week) => {
    const monday = weekStart(week);
    if (week === params.story.week) {
      requests.push({
        id: "req-story-internal",
        week,
        side: "internal",
        partyId: "project-a",
        volumeM3: params.story.internalRequestM3,
        confirmedOn: addDays(monday, -3), // confirmed later than the outside order...
      });
      requests.push({
        id: "req-story-external",
        week,
        side: "external",
        partyId: contractorB,
        volumeM3: params.story.externalRequestM3,
        confirmedOn: addDays(monday, -12), // ...which was confirmed first, so a close call would favour it
      });
    }
    if (week === params.story.week) {
      // Other demand makes up the rest of the shortfall (the deck's "2,000 m3 short" is total demand against
      // free capacity, not Project A and Contractor B alone).
      const extras = splitVolume(rng, storyOtherDemandM3, rng.int(1, STORY_EXTRA_REQUESTS_MAX), params.requests.volumeStepM3);
      extras.forEach((volumeM3, k) => {
        const internal = rng.chance(params.demand.internalShare);
        requests.push({
          id: `req-${week}-${String(k + 1).padStart(2, "0")}`,
          week,
          side: internal ? "internal" : "external",
          partyId: rng.pick(internal ? internalIds.filter((id) => id !== "project-a") : externalIds.filter((id) => id !== contractorB)),
          volumeM3,
          confirmedOn: addDays(monday, -rng.int(params.requests.confirmLeadDays.min, params.requests.confirmLeadDays.max)),
        });
      });
      return;
    }
    const n = rng.int(params.requests.perWeek.min, params.requests.perWeek.max);
    for (let k = 1; k <= n; k++) {
      const internal = rng.chance(params.demand.internalShare);
      requests.push({
        id: `req-${week}-${String(k).padStart(2, "0")}`,
        week,
        side: internal ? "internal" : "external",
        partyId: rng.pick(internal ? internalIds : externalIds),
        volumeM3: Math.max(
          params.requests.volumeStepM3,
          roundTo(rng.float(params.requests.volumeM3.min, params.requests.volumeM3.max), params.requests.volumeStepM3),
        ),
        confirmedOn: addDays(monday, -rng.int(params.requests.confirmLeadDays.min, params.requests.confirmLeadDays.max)),
      });
    }
  });

  // Firm (committed) orders ---------------------------------------------------------------------------
  const firmOrders: FirmOrder[] = [];
  weeks.forEach((week, i) => {
    const cap = capacity[i]!.capacityM3;
    let committed: number;
    if (week === params.story.week) {
      committed = cap - storyFreeM3;
    } else {
      const noise = 1 + params.demand.weeklyNoise * rng.float(-1, 1);
      const target =
        cal.weeklyNominalCapacityM3 * params.demand.baselineUtilisation * demandMultiplier(cal, quarterOfWeek(week), i) * noise;
      committed = Math.min(target, params.capacity.maxCommittedShareOfCapacity * cap);
    }
    committed = Math.max(0, Math.min(cap, Math.round(committed)));

    const internalTotal = Math.round(committed * params.demand.internalShare);
    const sides = [
      { side: "internal" as const, total: internalTotal, ids: internalIds },
      { side: "external" as const, total: committed - internalTotal, ids: externalIds },
    ];
    let k = 0;
    for (const { side, total, ids } of sides) {
      const parts = rng.int(params.demand.firmOrdersPerSidePerWeek.min, params.demand.firmOrdersPerSidePerWeek.max);
      for (const volume of splitVolume(rng, total, parts, FIRM_ORDER_STEP_M3)) {
        k += 1;
        firmOrders.push({ id: `firm-${week}-${String(k).padStart(2, "0")}`, week, side, partyId: rng.pick(ids), volumeM3: volume });
      }
    }
  });

  const scenario = {
    meta: {
      kind: "synthetic" as const,
      seed: params.seed,
      startWeek: params.startWeek,
      weekCount: params.weekCount,
      paramsFile: `data/${PARAMS_FILE}`,
      generator: GENERATOR,
      calibration: {
        weeklyNominalCapacityM3: { value: cal.weeklyNominalCapacityM3, from: "chinhin.aac.capacity.third_plant_addition_m3_year / 52 x availabilityFactor" },
        unbilledSalesRM: { value: cal.unbilledSalesRM, from: "chinhin.pipeline.unbilled_property_rm_billion" },
        aacPrecastPbtMargin: { value: cal.aacPrecastPbtMargin, from: "chinhin.seg.aac_precast.pbt.q2fy26 / chinhin.seg.aac_precast.revenue.q2fy26" },
        contributionMarginRatio: { value: cal.contributionMarginRatio, from: "aacPrecastPbtMargin + margin.fixedCostShareOfRevenue (assumed)" },
        demandGrowthYoy: { value: cal.demandGrowthYoy, from: "dosm-gdp-construction-quarterly p4 growth_yoy, latest quarter" },
        seasonalIndexQ1: { value: cal.seasonalIndex[1], from: "dosm-gdp-construction-quarterly p4 abs, years excluding calibrationExcludedYears" },
        seasonalIndexQ2: { value: cal.seasonalIndex[2], from: "dosm-gdp-construction-quarterly p4 abs, years excluding calibrationExcludedYears" },
        seasonalIndexQ3: { value: cal.seasonalIndex[3], from: "dosm-gdp-construction-quarterly p4 abs, years excluding calibrationExcludedYears" },
        seasonalIndexQ4: { value: cal.seasonalIndex[4], from: "dosm-gdp-construction-quarterly p4 abs, years excluding calibrationExcludedYears" },
      },
      notes: [
        "Synthetic. Not Chin Hin data. Every party is fictional.",
        "Order sizes, prices and project dates are assumptions (see provenance in params.json); only the items under calibration are anchored to public data.",
        "There is no public AAC price per m3, so the price is a placeholder; test the demo at several prices.",
        "Demand tiers (firm / likely / possible) arrive with the intake agent in P2; this scenario holds firm orders and new requests only.",
      ],
    },
    plant: params.plant,
    capacity,
    projects,
    customers,
    firmOrders,
    requests,
  };
  return SyntheticScenarioSchema.parse(scenario); // never emit data that fails its own schema
}

/** Stable text form: fixed key order (by construction), two-space indent, trailing newline. */
export function serializeScenario(s: SyntheticScenario): string {
  return JSON.stringify(s, null, 2) + "\n";
}
