import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { dailyDelayRateRM } from "@/core/costs";
import { prebuildAlternative } from "@/core/planner";
import { decide } from "@/core/rule";
import { loadJsonDataset, loadManifest } from "./loaders";
import { toPricedRequests, toWeekCapacities } from "./scenario";
import { SynthParamsSchema, SyntheticScenarioSchema } from "./schema";
import { PARAMS_FILE, SCENARIO_FILE, calibrate, demandMultiplier, generateScenario, seasonalIndex, serializeScenario } from "./synth";

const dir = join(process.cwd(), "data");
const params = loadJsonDataset(PARAMS_FILE, SynthParamsSchema, dir).data;
const committed = loadJsonDataset(SCENARIO_FILE, SyntheticScenarioSchema, dir).data;

describe("determinism and freshness", () => {
  it("the same seed gives byte-identical output", () => {
    expect(serializeScenario(generateScenario(dir))).toBe(serializeScenario(generateScenario(dir)));
  });

  it("a different seed gives a different scenario", () => {
    expect(serializeScenario(generateScenario(dir, params.seed + 1))).not.toBe(serializeScenario(generateScenario(dir)));
  });

  it("data/synthetic/scenario.json is exactly what the generator produces now (not stale)", () => {
    const onDisk = readFileSync(join(dir, SCENARIO_FILE), "utf8").replace(/\r\n/g, "\n");
    expect(onDisk).toBe(serializeScenario(generateScenario(dir)));
  });
});

describe("invariants that must hold for ANY seed", () => {
  const seeds = Array.from({ length: 25 }, (_, i) => 20261001 + i);

  it.each(seeds)("seed %i: valid, and the story week works as designed", (seed) => {
    const s = generateScenario(dir, seed); // generateScenario validates against the schema before returning
    const week = params.story.week;
    const cap = s.capacity.find((c) => c.week === week)!.capacityM3;
    const firm = s.firmOrders.filter((o) => o.week === week).reduce((sum, o) => sum + o.volumeM3, 0);
    const free = cap - firm;
    const reqs = s.requests.filter((r) => r.week === week);
    const demand = reqs.reduce((sum, r) => sum + r.volumeM3, 0);

    expect(demand - free, "story week is short by exactly the configured amount").toBe(params.story.shortfallM3);
    expect(free, "Project A fits on its own").toBeGreaterThanOrEqual(params.story.internalRequestM3);
    expect(free, "Project A plus Contractor B do not both fit").toBeLessThan(params.story.internalRequestM3 + params.story.externalRequestM3);
    expect(reqs.some((r) => r.id === "req-story-internal" && r.partyId === "project-a")).toBe(true);
    expect(reqs.some((r) => r.id === "req-story-external")).toBe(true);
  });

  it.each(seeds.slice(0, 5))("seed %i: every volume is positive and every party exists", (seed) => {
    const s = generateScenario(dir, seed);
    expect(s.firmOrders.every((o) => o.volumeM3 > 0)).toBe(true);
    expect(s.requests.every((r) => r.volumeM3 > 0)).toBe(true);
    expect(s.customers.length).toBe(params.customers.count);
    expect(s.projects.length).toBe(params.projects.count);
  });
});

describe("the committed scenario tells the deck's story end to end", () => {
  const result = decide(toWeekCapacities(committed), toPricedRequests(committed));
  const placement = (id: string) => result.placements.find((p) => p.requestId === id)!;

  it("week 43 is the only contested week", () => {
    expect(result.weeks.filter((w) => w.contested).map((w) => w.week)).toEqual([params.story.week]);
  });

  it("Project A is served in week 43 and Contractor B is moved to week 44, not refused", () => {
    expect(placement("req-story-internal")).toMatchObject({ servedWeek: "2026-W43", status: "served" });
    expect(placement("req-story-external")).toMatchObject({ servedWeek: "2026-W44", status: "moved", weeksDeferred: 1 });
  });

  it("the ringgit on each side is recorded: A is worth a week of damages, B its margin", () => {
    const w43 = result.weeks.find((w) => w.week === params.story.week)!;
    const a = w43.served.find((s) => s.requestId === "req-story-internal")!;
    const b = w43.deferred.find((d) => d.requestId === "req-story-external")!;
    const card = committed.projects.find((p) => p.projectId === "project-a")!;
    expect(a.valueRM).toBeCloseTo(7 * dailyDelayRateRM(card), 2);
    expect(a.valueRM).toBeGreaterThan(10 * b.valueRM);
  });

  it("nothing is left unplaced and committed volume never exceeds capacity", () => {
    expect(result.placements.filter((p) => p.status === "unplaced")).toEqual([]);
    for (const w of result.weeks) expect(w.committedM3).toBeLessThanOrEqual(w.capacityM3);
  });

  it("the story keeps its teaching point: the outside order was confirmed first, yet the project wins on ringgit", () => {
    const a = committed.requests.find((r) => r.id === "req-story-internal")!;
    const b = committed.requests.find((r) => r.id === "req-story-external")!;
    expect(b.confirmedOn < a.confirmedOn, "B confirmed before A").toBe(true);
    const w43 = result.weeks.find((w) => w.week === params.story.week)!;
    const aValue = w43.served.find((s) => s.requestId === a.id)!.valueRM;
    const bValue = w43.deferred.find((d) => d.requestId === b.id)!.valueRM;
    expect(Math.abs(aValue - bValue) > 0.1 * Math.max(aValue, bValue), "not a close call, so it is decided on ringgit").toBe(true);
    expect(w43.served.find((s) => s.requestId === a.id)!.byCloseCall).toBe(false);
  });

  it("pre-build is a real lever but, at the scenario's stock cap, the week-43 contest remains", () => {
    const weeks = toWeekCapacities(committed);
    const reqs = toPricedRequests(committed);
    const cap = committed.plannerSettings.stockCapM3;
    const withCap = prebuildAlternative(weeks, reqs, params.story.week, cap);
    expect(withCap.coveredM3).toBeGreaterThan(0);
    expect(withCap.residualShortM3, "still short at this cap").toBeGreaterThan(0);
    expect(withCap.outcome, "so the rule still has to choose").not.toBeNull();
    // A much larger cap would make the contest disappear: the cap is what keeps the demo's decision alive, and it is labelled.
    const unlimited = prebuildAlternative(weeks, reqs, params.story.week, params.story.shortfallM3 * 2);
    expect(unlimited.outcome).toBeNull();
  });

  it("the planned maintenance week runs at reduced capacity", () => {
    const nominal = calibrate(params, dir).weeklyNominalCapacityM3;
    for (const m of params.capacity.maintenance) {
      const cap = committed.capacity.find((c) => c.week === m.week)!.capacityM3;
      expect(cap).toBe(Math.round(nominal * m.capacityFactor));
      expect(cap).toBeLessThan(nominal);
    }
    expect(committed.capacity.filter((c) => c.capacityM3 === nominal).length).toBe(committed.capacity.length - params.capacity.maintenance.length);
  });

  it("includes at least one week with real slack, so the board has both a short and a quiet week", () => {
    expect(result.weeks.some((w) => w.freeAfterM3 > 0.1 * w.capacityM3)).toBe(true);
  });

  it("the featured project reproduces the deck's per-day figure: RM300m x 10% / 365", () => {
    const card = committed.projects.find((p) => p.projectId === "project-a")!;
    expect(dailyDelayRateRM(card)).toBeCloseTo(82_191.78, 2);
  });
});

describe("calibration comes from the public data", () => {
  const cal = calibrate(params, dir);

  it("weekly capacity = the third plant's stated addition / 52 x availability", () => {
    expect(cal.weeklyNominalCapacityM3).toBe(Math.round((1_000_000 / 52) * params.capacity.availabilityFactor));
  });

  it("the contribution margin ratio is the public AAC + precast PBT margin plus the assumed fixed-cost share", () => {
    expect(cal.aacPrecastPbtMargin).toBeCloseTo(19_585 / 180_972, 5);
    expect(cal.contributionMarginRatio).toBeCloseTo(cal.aacPrecastPbtMargin + params.margin.fixedCostShareOfRevenue, 5);
  });

  it("recorded calibration in the scenario file matches a fresh calibration", () => {
    expect(committed.meta.calibration.weeklyNominalCapacityM3!.value).toBe(cal.weeklyNominalCapacityM3);
    expect(committed.meta.calibration.contributionMarginRatio!.value).toBe(cal.contributionMarginRatio);
    expect(committed.meta.calibration.demandGrowthYoy!.value).toBe(cal.demandGrowthYoy);
  });

  it("seasonality is modest, positive and averages to about one across the quarters", () => {
    const q = Object.values(cal.seasonalIndex);
    expect(q.every((v) => v > 0.9 && v < 1.1)).toBe(true);
    expect(q.reduce((a, b) => a + b, 0) / 4).toBeCloseTo(1, 1);
  });

  it("demand growth is the latest published real construction growth", () => {
    expect(cal.demandGrowthYoy).toBeCloseTo(0.065, 3);
  });
});

describe("demandMultiplier (unit)", () => {
  const cal = { seasonalIndex: { 1: 0.9, 2: 1, 3: 1.1, 4: 1 }, demandGrowthYoy: 0.1 };

  it("is the seasonal index at the start", () => {
    expect(demandMultiplier(cal, 3, 0)).toBeCloseTo(1.1, 10);
  });

  it("compounds the public growth rate over a year (52 weeks)", () => {
    expect(demandMultiplier(cal, 2, 52)).toBeCloseTo(1.1, 10);
    expect(demandMultiplier(cal, 1, 52)).toBeCloseTo(0.9 * 1.1, 10);
  });

  it("grows smoothly between", () => {
    expect(demandMultiplier(cal, 2, 26)).toBeCloseTo(Math.sqrt(1.1), 10);
    expect(demandMultiplier(cal, 2, 10)).toBeGreaterThan(demandMultiplier(cal, 2, 5));
  });
});

describe("seasonalIndex (unit)", () => {
  const year = (y: number, v: number[]) => v.map((value, i) => ({ date: `${y}-${String(i * 3 + 1).padStart(2, "0")}-01`, value }));

  it("computes each quarter's mean ratio to its year's mean", () => {
    const series = [...year(2018, [90, 100, 110, 100]), ...year(2019, [180, 200, 220, 200])];
    expect(seasonalIndex(series, [])).toEqual({ 1: 0.9, 2: 1, 3: 1.1, 4: 1 });
  });

  it("skips excluded years and incomplete years", () => {
    const series = [...year(2018, [90, 100, 110, 100]), ...year(2020, [10, 400, 10, 10]), { date: "2021-01-01", value: 500 }];
    expect(seasonalIndex(series, [2020])).toEqual({ 1: 0.9, 2: 1, 3: 1.1, 4: 1 });
  });

  it("refuses to guess when no complete year remains", () => {
    expect(() => seasonalIndex(year(2018, [1, 2, 3, 4]), [2018])).toThrow(/No complete years/);
  });
});

describe("provenance and honesty", () => {
  // A parameter is a scalar, an array, or a {min, max} range; anything else is a group of parameters.
  const isRange = (o: object) => Object.keys(o).sort().join() === "max,min";
  const leaves = (obj: unknown, prefix = ""): string[] =>
    obj !== null && typeof obj === "object" && !Array.isArray(obj) && !isRange(obj)
      ? Object.entries(obj).flatMap(([k, v]) => leaves(v, prefix ? `${prefix}.${k}` : k))
      : [prefix];
  const { provenance, ...config } = params;

  it("every parameter has a provenance note", () => {
    const missing = leaves(config).filter((path) => !(path in provenance));
    expect(missing).toEqual([]);
  });

  it("no provenance note refers to a parameter that no longer exists", () => {
    const real = new Set(leaves(config));
    expect(Object.keys(provenance).filter((k) => !real.has(k))).toEqual([]);
  });

  it("every parameter note starts with a category tag (rule 7: label what is assumed, illustrative or derived)", () => {
    for (const [path, note] of Object.entries(provenance)) {
      expect(note, path).toMatch(/^(ASSUMED|ILLUSTRATIVE|DERIVED|JUDGEMENT|FICTIONAL|MECHANICAL|NO PUBLIC SOURCE)/i);
    }
  });

  it("both synthetic files are in the manifest as kind 'synthetic' (never 'real')", () => {
    const rows = loadManifest(dir).filter((e) => e.file.startsWith("synthetic/"));
    expect(rows.map((r) => r.file).sort()).toEqual([PARAMS_FILE, SCENARIO_FILE]);
    expect(rows.every((r) => r.kind === "synthetic")).toBe(true);
  });

  it("every party is labelled fictional, and the file says it is not Chin Hin data", () => {
    expect(committed.projects.every((p) => p.name.includes("fictional"))).toBe(true);
    expect(committed.customers.every((c) => c.name.includes("fictional"))).toBe(true);
    expect(committed.meta.notes.join(" ")).toMatch(/Not Chin Hin data/);
  });
});
