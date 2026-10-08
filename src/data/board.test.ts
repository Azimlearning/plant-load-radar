import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { contributionMarginRM, dailyDelayRateRM } from "@/core/costs";
import { Figures, buildBoard, niceStep, shortWeek } from "./board";
import { loadJsonDataset } from "./loaders";
import { SCENARIO_FILE } from "./synth";
import { SyntheticScenarioSchema } from "./schema";

const dir = join(process.cwd(), "data");
const scenario = loadJsonDataset(SCENARIO_FILE, SyntheticScenarioSchema, dir).data;
const model = buildBoard(scenario);
const group = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

describe("Figures", () => {
  it("groups thousands, rounds, and drops the sign from the recorded figure", () => {
    const f = new Figures();
    expect(f.n(1234567)).toBe("1,234,567");
    expect(f.n(-2000)).toBe("2,000");
    expect(f.n(0.4)).toBe("0");
    expect(f.n(999.6)).toBe("1,000");
    expect(f.all()).toEqual(["0", "1,000", "1,234,567", "2,000"]);
  });

  it("formats volumes, ringgit and weeks, and records them", () => {
    const f = new Figures();
    expect(f.m3(1500)).toBe("1,500 m³");
    expect(f.rm(575342.47)).toBe("RM575,342");
    expect(f.week("2026-W43")).toBe("Week 43");
    expect(f.signed(-300)).toBe("−300");
    expect(f.all()).toEqual(["1,500", "300", "43", "575,342"]);
  });

  it("shortens week labels", () => {
    expect(shortWeek("2026-W43")).toBe("W43");
  });
});

describe("niceStep", () => {
  it("picks 1, 2 or 5 times a power of ten", () => {
    expect(niceStep(2000)).toBe(500);
    expect(niceStep(3200)).toBe(1000);
    expect(niceStep(10)).toBe(2);
    expect(niceStep(0)).toBe(1);
  });
});

describe("the board model for the committed scenario", () => {
  const rec = model.recommendations[0]!;
  const projectA = scenario.projects.find((p) => p.projectId === "project-a")!;
  const contractorB = scenario.customers.find((c) => c.customerId === "contractor-b")!;

  it("KPIs come from the planner: one week short, one decision, largest shortage 2,000 m³ in week 43", () => {
    const by = Object.fromEntries(model.kpis.map((k) => [k.id, k]));
    expect(by["weeks-short"]!.value).toBe("1");
    expect(by["decisions"]!.value).toBe("1");
    expect(by["largest"]!.value).toBe("2,000 m³");
    expect(by["largest"]!.note).toBe("Week 43");
  });

  it("shows only KPIs that have a real source today (no 'protected this month', no 'orders to check')", () => {
    expect(model.kpis.map((k) => k.id).sort()).toEqual(["decisions", "largest", "weeks-short"]);
  });

  it("the headline is week 43, 2,000 m³ short", () => {
    expect(rec.week).toBe("2026-W43");
    expect(rec.headline).toBe("Week 43 is 2,000 m³ short");
  });

  it("serves Project A at a week of late-handover cost: 7 x the daily rate", () => {
    const a = rec.served.find((l) => l.who === projectA.name)!;
    expect(a.value).toBe(`RM${group(7 * dailyDelayRateRM(projectA))}`);
    expect(a.volume).toBe("1,500 m³");
    expect(a.side).toBe("internal");
  });

  it("moves Contractor B to week 44 and shows its margin at risk, computed independently", () => {
    const b = rec.moved.find((l) => l.who === contractorB.name)!;
    expect(b.value).toBe(`RM${group(contributionMarginRM(600, contractorB) + contractorB.lossRiskRM)}`);
    expect(b.to).toBe("Week 44");
    expect(b.side).toBe("external");
  });

  it("says what each ringgit figure means: zero-cost deferrals mention float, ordinary customers say 'margin at risk'", () => {
    const zero = [...rec.moved, ...rec.served].filter((l) => l.value === "RM0");
    expect(zero.length).toBeGreaterThan(0);
    expect(zero.every((l) => l.valueMeaning.includes("float"))).toBe(true);
    expect(rec.moved.find((l) => l.who === contractorB.name)!.valueMeaning).toBe("margin at risk");
    expect(rec.served.find((l) => l.who === projectA.name)!.valueMeaning).toMatch(/late-handover cost/);
  });

  it("the ringgit on the served side is far larger than on the moved side, and nothing is silently dropped", () => {
    const toNum = (s: string) => Number(s.replace(/\D/g, ""));
    expect(toNum(rec.served.find((l) => l.who === projectA.name)!.value)).toBeGreaterThan(10 * toNum(rec.moved.find((l) => l.who === contractorB.name)!.value));
    expect(rec.moved.every((m) => m.to !== "no free week in this horizon")).toBe(true);
  });

  it("pre-build is shown as an alternative: the cap, what it covers, and what is still short", () => {
    expect(rec.prebuild.stockCap).toBe("1,000 m³");
    expect(rec.prebuild.covers).toBe("1,000 m³");
    expect(rec.prebuild.stillShort).toBe("1,000 m³");
    expect(rec.prebuild.possible).toBe(true);
    expect(rec.prebuild.dissolves).toBe(false);
    expect(rec.prebuild.moves.length).toBeGreaterThan(0);
    expect(rec.prebuild.moves.every((m) => /^Build [\d,]+ m³ in Week \d+ to hold for Week 43$/.test(m))).toBe(true);
  });

  it("with pre-build, the outside order is served and other requests absorb the shortage (the lever changes who loses)", () => {
    expect(rec.prebuild.served.some((l) => l.who === contractorB.name)).toBe(true);
    expect(rec.prebuild.moved.length).toBeGreaterThan(0);
  });

  it("the focus table lists exactly the requests competing in that week, with their confirmation dates", () => {
    const f = model.focus!;
    expect(f.rows.length).toBe(scenario.requests.filter((r) => r.week === "2026-W43").length);
    expect(f.rows.every((r) => /^confirmed \d{4}-\d{2}-\d{2}$/.test(r.detail))).toBe(true);
    expect(f.committed).toMatch(/already committed to confirmed orders/);
  });
});

describe("the chart model", () => {
  it("has one bar per week, with the short week below the line and spare weeks above", () => {
    expect(model.chart.bars.length).toBe(scenario.capacity.length);
    const w43 = model.chart.bars.find((b) => b.week === "2026-W43")!;
    expect(w43).toMatchObject({ spareM3: -2000, kind: "short", contested: true });
    expect(model.chart.bars.filter((b) => b.kind === "spare").every((b) => b.spareM3 >= 0)).toBe(true);
  });

  it("labels only the short weeks and the largest spare week, never every bar", () => {
    const labelled = model.chart.bars.filter((b) => b.label !== null);
    expect(labelled.length).toBeLessThanOrEqual(model.chart.bars.filter((b) => b.kind === "short").length + 1);
    expect(labelled.length).toBeLessThan(model.chart.bars.length / 2);
  });

  it("the axis is symmetric, covers every bar, and its ticks are evenly spaced", () => {
    const { extentM3, ticks, bars } = model.chart;
    expect(Math.max(...bars.map((b) => Math.abs(b.spareM3)))).toBeLessThanOrEqual(extentM3);
    expect(ticks[0]!.m3).toBe(-extentM3);
    expect(ticks[ticks.length - 1]!.m3).toBe(extentM3);
    const gaps = ticks.slice(1).map((t, i) => t.m3 - ticks[i]!.m3);
    expect(new Set(gaps).size).toBe(1);
    expect(ticks.some((t) => t.m3 === 0)).toBe(true);
  });

  it("the screen-reader summary names the short week", () => {
    expect(model.chart.summary).toMatch(/Week 43 is 2,000 m³ short/);
  });

  it("the table twin has a row per week and agrees with the bars", () => {
    expect(model.weekTable.length).toBe(model.chart.bars.length);
    const row = model.weekTable.find((r) => r.week === "2026-W43")!;
    expect(row.spare).toBe("−2,000 m³");
    expect(row.free).toBe("1,800 m³");
    expect(row.wanted).toBe("3,800 m³");
  });
});

describe("hygiene", () => {
  const text = JSON.stringify(model);

  it("never shows negative zero", () => {
    expect(text).not.toMatch(/−0(?![\d,])/);
    expect(text).not.toMatch(/-0(?![\d.,])/);
  });

  it("the banner says the data is synthetic and not Chin Hin's", () => {
    expect(model.banner).toMatch(/Synthetic/);
    expect(model.banner).toMatch(/not Chin Hin data/);
  });

  it("every party is labelled fictional wherever a name appears", () => {
    const names = [...model.recommendations.flatMap((r) => [...r.served, ...r.moved]), ...(model.focus?.rows ?? [])].map((l) => l.who);
    expect(names.length).toBeGreaterThan(0);
    expect(names.every((n) => n.includes("fictional"))).toBe(true);
  });

  it("allowedFigures contains the headline numbers", () => {
    expect(model.allowedFigures).toEqual(expect.arrayContaining(["2,000", "1,500", "600", "575,342", "1,000", "43", "44"]));
  });
});
