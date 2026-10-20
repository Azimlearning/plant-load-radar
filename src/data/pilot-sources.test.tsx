import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Pilot } from "@/app/pilot/pilot";
import { Sources } from "@/app/sources/sources";
import { recordDecision } from "@/ledger/decide";
import { loadHistory } from "./history";
import { loadJsonDataset } from "./loaders";
import { buildPilot } from "./pilot";
import { SyntheticScenarioSchema, type LedgerRow } from "./schema";
import { loadSources } from "./sources";

const dir = join(process.cwd(), "data");
const deck = loadJsonDataset("synthetic/deck-story.json", SyntheticScenarioSchema, dir).data;
const history = loadHistory(dir);

const stray = (html: string, allowed: readonly string[]) => {
  const text = html.replace(/<[^>]+>/g, " ").replace(/&(?:amp|lt|gt|quot|#x27|#39|nbsp);/g, " ").replace(/\b\d{4}-\d{2}-\d{2}\b/g, " ").replace(/\b\d{4}-W\d{2}\b/g, " ");
  return [...new Set((text.match(/\d{1,3}(?:,\d{3})+|\d+/g) ?? []).filter((f) => !allowed.includes(f)))];
};

describe("the pilot scorecard (slides 11, 12)", () => {
  const model = buildPilot(deck, history, []);
  const html = renderToStaticMarkup(<Pilot model={model} />);

  it("has a measurement plan with empty baselines: nothing has been measured, and it says so", () => {
    expect(model.measures).toHaveLength(4);
    for (const m of model.measures) expect(m.baseline).toMatch(/month 1/i);
    expect(html).toMatch(/nothing has been measured at Chin Hin/);
    expect(html).not.toMatch(/\bsaved\b|\bsavings\b/i);
  });
  it("the demo column is labelled seeded or illustrative and comes from the data", () => {
    expect(model.measures[0]!.demo).toBe("7 days in the seeded history");
    expect(model.measures[1]!.demo).toBe("0 of 5 decisions moved a confirmed order");
    expect(model.measures[3]!.demo).toBe("30 minutes planned, in 4 blocks");
  });
  it("shows how little the call depends on the margin assumption: Contractor B would need over 100% margin to go first", () => {
    const sens = model.sensitivity!;
    expect(sens.lines[0]).toContain("RM167,000 in sales");
    expect(sens.lines[0]).toContain("10.8% margin (RM18,073)");
    expect(sens.lines[1]).toContain("margin of 261% of its sales to match the project's RM435,616");
    expect(sens.lines[1]).toContain("the call holds at any margin");
    expect(html).toContain("How much does this call depend on the margin assumption?");
    expect(stray(html, model.allowedFigures)).toEqual([]);
  });
  it("shows the four policies on the story week and again with float, and the rule never costs more than the habits", () => {
    expect(model.policyCases).toHaveLength(2);
    const story = model.policyCases[0]!.rows;
    expect(story.map((r) => r.policy)).toEqual(["The ringgit-at-stake rule", "First confirmed, first served", "Group projects first", "Outside orders first"]);
    const value = (rows: typeof story, i: number) => Number(rows[i]!.waitingValue.replace(/[^\d]/g, ""));
    for (let i = 1; i < 4; i++) expect(value(story, 0)).toBeLessThanOrEqual(value(story, i));
    expect(story[0]!.waitingValue).toBe("RM18,073");
    const withFloat = model.policyCases[1]!;
    expect(withFloat.title).toContain("20 days of float");
    expect(withFloat.rows[0]!.waitingValue).toBe("RM0");
  });
  it("every figure on the page is accounted for, also after a live decision", () => {
    expect(stray(html, model.allowedFigures)).toEqual([]);
    const ledger: LedgerRow[] = [];
    const done = recordDecision(deck, { week: "2026-W43", mode: "approve", approvedBy: "Siti" }, { read: () => ledger, append: (r) => void ledger.push(r) }, () => new Date("2026-10-12T02:00:00Z"));
    expect(done.ok).toBe(true);
    const after = buildPilot(deck, history, ledger);
    expect(after.measures[1]!.demo).toBe("0 of 6 decisions moved a confirmed order");
    expect(stray(renderToStaticMarkup(<Pilot model={after} />), after.allowedFigures)).toEqual([]);
  });
  it("states the needs as access, not budget", () => {
    expect(html).toContain("access, not budget");
    expect(model.risks).toHaveLength(4);
  });
});

describe("the sources and assumptions page (slide 15)", () => {
  const model = loadSources();
  const html = renderToStaticMarkup(<Sources model={model} />);

  it("lists every file in the manifest, by kind, with its source and licence", () => {
    expect(model.files.length).toBeGreaterThan(15);
    expect(model.kinds.map((k) => k.kind)).toEqual(["public", "synthetic"]);
    expect(model.files.every((f) => f.source !== "" && f.licence !== "")).toBe(true);
    expect(model.files.some((f) => f.file === "synthetic/deck-story.json")).toBe(true);
  });
  it("has the deck's twelve references and four assumptions, and says the project did not re-read every source", () => {
    expect(model.references).toHaveLength(12);
    expect(model.assumptions.map((a) => a.title)).toEqual(["LAD per day", "Outside margin", "Demo data", "Benchmarks"]);
    expect(html).toMatch(/has not re-read each source/);
  });
  it("links each public fact to its source and shows its reliability", () => {
    const facts = model.factGroups.flatMap((g) => g.facts);
    expect(facts.length).toBeGreaterThan(100);
    expect(facts.every((f) => f.url.startsWith("https://") && ["primary", "secondary", "low-authority"].includes(f.reliability))).toBe(true);
    expect(html).toContain('rel="noreferrer noopener"');
  });
  it("every figure on the page is accounted for", () => {
    expect(stray(html, model.allowedFigures)).toEqual([]);
  });
});
