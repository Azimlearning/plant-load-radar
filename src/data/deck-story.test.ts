import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Board } from "@/app/board";
import { dailyDelayRateRM } from "@/core/costs";
import { coveredByPrebuild, recommend, weekBalances } from "@/core/planner";
import { recordDecision } from "@/ledger/decide";
import { ACTIVE_SCENARIO_FILE } from "./active";
import { buildBoard } from "./board";
import { buildDecisions } from "./decisions";
import { DECK_PARAMS_FILE, DECK_SCENARIO_FILE, generateDeckStory } from "./deck-story";
import { loadJsonDataset } from "./loaders";
import { toPlannedWeekCapacities, toPricedRequests, toWeekCapacities } from "./scenario";
import { DeckStoryParamsSchema, SyntheticScenarioSchema } from "./schema";
import { SCENARIO_FILE, serializeScenario } from "./synth";

const dir = join(process.cwd(), "data");
const deck = loadJsonDataset(DECK_SCENARIO_FILE, SyntheticScenarioSchema, dir).data;
const stress = loadJsonDataset(SCENARIO_FILE, SyntheticScenarioSchema, dir).data;
const params = loadJsonDataset(DECK_PARAMS_FILE, DeckStoryParamsSchema, dir).data;
const weeks = toWeekCapacities(deck);
const planned = toPlannedWeekCapacities(deck);
const reqs = toPricedRequests(deck);

// The slides' figures, written out once here as the thing under test (a test file, not the app).
const SLIDE_9_SPARE: Record<string, number> = { "2026-W41": 1200, "2026-W42": -700, "2026-W43": -2000, "2026-W44": 4100, "2026-W45": 2500, "2026-W46": 1000 };

describe("the deck story is what the revised deck shows (slides 3, 7, 9, 10; ADR D-20)", () => {
  it("is exactly what the generator produces now (not stale), and the app shows it", () => {
    expect(readFileSync(join(dir, DECK_SCENARIO_FILE), "utf8").replace(/\r\n/g, "\n")).toBe(serializeScenario(generateDeckStory(dir)));
    expect(ACTIVE_SCENARIO_FILE).toBe(DECK_SCENARIO_FILE);
  });

  it("slide 9: six weeks, spare capacity +1,200, -700, -2,000, +4,100, +2,500, +1,000", () => {
    const spare = Object.fromEntries(weekBalances(weeks, reqs).map((b) => [b.week, b.spareM3]));
    expect(spare).toEqual(SLIDE_9_SPARE);
    expect(deck.meta.weekCount).toBe(6);
  });

  it("slide 9: two short weeks; week 42 is covered by building ahead, week 43 needs a call", () => {
    expect(weekBalances(weeks, reqs).filter((b) => b.spareM3 < 0).map((b) => b.week)).toEqual(["2026-W42", "2026-W43"]);
    const covered = coveredByPrebuild(weeks, reqs, deck.plannerSettings.stockCapM3);
    expect(covered).toEqual([{ week: "2026-W42", shortM3: 700, moves: [{ fromWeek: "2026-W41", toWeek: "2026-W42", m3: 700 }] }]);
    expect(recommend(planned, reqs).map((r) => r.week)).toEqual(["2026-W43"]);
  });

  it("slide 7: Project A costs RM145k a day, and 3 days of slip is RM435k", () => {
    const a = deck.projects.find((p) => p.projectId === "project-a")!;
    expect(dailyDelayRateRM(a)).toBeCloseTo(145205.48, 2);
    const rec = recommend(planned, reqs)[0]!;
    const served = rec.served.find((s) => s.requestId === "req-story-internal")!;
    expect(served.valueRM / dailyDelayRateRM(a)).toBeCloseTo(params.featuredProject.slipDaysPerWeekOfDelay, 6);
    expect(Math.round(served.valueRM)).toBe(435616);
  });

  it("slide 7: Contractor B's order is worth about RM18k and moves to week 44; Project A is served", () => {
    const rec = recommend(planned, reqs)[0]!;
    expect(rec.served.map((s) => s.requestId)).toEqual(["req-story-internal"]);
    const b = rec.deferred.find((d) => d.requestId === "req-story-external")!;
    expect(b.valueRM).toBeGreaterThan(18000);
    expect(b.valueRM).toBeLessThan(18100);
    expect(b.movedTo).toBe("2026-W44");
    expect(b.volumeM3).toBe(600);
  });

  it("slide 15: every outside customer earns the public 10.8% segment margin, not a private assumption", () => {
    const margin = deck.meta.calibration.aacPrecastPbtMargin!.value;
    expect(margin).toBeCloseTo(0.108, 3);
    for (const c of deck.customers) expect(1 - c.variableCostPerM3RM / c.pricePerM3RM).toBeCloseTo(margin, 5);
  });

  it("slide 10: the week-43 shortage is 2,000 m3 and 800 m3 more would make it 2,800 short", () => {
    const w43 = weekBalances(weeks, reqs).find((b) => b.week === "2026-W43")!;
    expect(w43.spareM3).toBe(-2000);
    expect(w43.spareM3 - 800).toBe(-2800);
  });
});

describe("what the screens say", () => {
  const board = buildBoard(deck);
  const text = renderToStaticMarkup(Board({ model: board }))
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:amp|lt|gt|quot|#x27|#39);/g, " "); // entities are punctuation, not figures

  it("weeks short 2, decisions waiting 1, one covered week, one decision", () => {
    const kpi = (id: string) => board.kpis.find((k) => k.id === id)!.value;
    expect(kpi("weeks-short")).toBe("2");
    expect(kpi("decisions")).toBe("1");
    expect(board.covered.map((c) => c.weekName)).toEqual(["Week 42"]);
    expect(board.recommendations.map((r) => r.weekName)).toEqual(["Week 43"]);
    expect(board.chart.bars.filter((b) => b.covered).map((b) => b.short)).toEqual(["W42"]);
    expect(board.chart.bars.filter((b) => b.contested).map((b) => b.short)).toEqual(["W43"]);
  });

  it("shows the working: RM145,205 a day x 3 days of slip = RM435,616", () => {
    expect(text).toContain("RM435,616");
    expect(text).toContain("RM145,205 a day × 3 days of slip");
  });

  it("the float what-if serves Contractor B and prices Project A at RM0 (slide 7, second example)", () => {
    const w = board.whatIf!;
    expect(w.title).toContain("20 days of float");
    expect(w.served.map((l) => l.who)).toContain("Contractor B (fictional)");
    expect(w.served.find((l) => l.who.startsWith("Contractor B"))!.value).toBe("RM18,073");
    expect(w.moved.find((l) => l.who.startsWith("Project A"))!.value).toBe("RM0");
  });

  it("the what-if changes nothing: the real decision is still to serve Project A", () => {
    expect(board.recommendations[0]!.served.map((l) => l.who)).toEqual(["Project A (fictional)"]);
  });

  it("every figure on the rendered board is in the model's allowed list", () => {
    const stripped = text.replace(/\b\d{4}-\d{2}-\d{2}\b/g, " ").replace(/\b\d{4}-W\d{2}\b/g, " ").replace(/\bW\d{2}\b/g, " ");
    const ok = new Set(board.allowedFigures);
    const stray = [...new Set((stripped.match(/\d{1,3}(?:,\d{3})+|\d+/g) ?? []).filter((f) => !ok.has(f)))];
    expect(stray).toEqual([]);
  });

  it("the reply to Contractor B promises a calendar date, as slide 10 does", () => {
    const d = buildDecisions(deck, [], null);
    const reply = d.pending[0]!.drafts.replies.find((r) => r.to.startsWith("Contractor B"))!;
    expect(reply.text).toContain("We can deliver from Mon 26 Oct (Week 44). Shall I lock that in?");
    expect(reply.text).not.toMatch(/RM\d/);
    expect(d.allowedFigures).toContain("26");
  });
});

describe("decisions on the deck story", () => {
  const store = () => {
    const rows: Parameters<typeof recordDecision>[2] extends { append: (r: infer R) => void } ? R[] : never = [];
    return { rows, read: () => [...rows], append: (r: (typeof rows)[number]) => void rows.push(r) };
  };

  it("week 43 can be approved; week 42 (covered by building ahead) has no decision to record", () => {
    const s = store();
    const bad = recordDecision(deck, { week: "2026-W42", mode: "approve", approvedBy: "Siti" }, s);
    expect(bad).toMatchObject({ ok: false, error: "unknown-week" });
    const good = recordDecision(deck, { week: "2026-W43", mode: "approve", approvedBy: "Siti" }, s);
    expect(good.ok).toBe(true);
    expect(s.rows).toHaveLength(1);
    expect(Math.round(s.rows[0]!.servedValueRM)).toBe(435616);
  });
});

describe("the stress scenario is unchanged by the planner change", () => {
  it("no week of the generated scenario is covered by building ahead, so its decision is the same as before", () => {
    const w = toWeekCapacities(stress);
    const r = toPricedRequests(stress);
    expect(coveredByPrebuild(w, r, stress.plannerSettings.stockCapM3)).toEqual([]);
    expect(toPlannedWeekCapacities(stress)).toEqual(w);
    expect(recommend(w, r).map((x) => x.week)).toEqual(["2026-W43"]);
  });
});

describe("deck-story parameters carry provenance", () => {
  const { provenance, ...config } = params;
  const leaves = (obj: unknown, prefix = ""): string[] =>
    obj !== null && typeof obj === "object" && !Array.isArray(obj)
      ? Object.entries(obj).flatMap(([k, v]) => leaves(v, prefix ? `${prefix}.${k}` : k))
      : [prefix];

  it("every parameter has a note, no note is orphaned, and each starts with a category tag", () => {
    const real = new Set(leaves(config));
    expect([...real].filter((k) => !(k in provenance))).toEqual([]);
    expect(Object.keys(provenance).filter((k) => !real.has(k))).toEqual([]);
    for (const [k, note] of Object.entries(provenance)) expect(note, k).toMatch(/^(ASSUMED|ILLUSTRATIVE|DERIVED|JUDGEMENT|FICTIONAL|MECHANICAL|NO PUBLIC SOURCE)/);
  });

  it("the file says it is synthetic, fictional and not Chin Hin data", () => {
    expect(deck.meta.kind).toBe("synthetic");
    expect(deck.meta.notes.join(" ")).toMatch(/Not Chin Hin data/);
    expect(deck.projects.every((p) => p.name.includes("fictional"))).toBe(true);
  });
});
