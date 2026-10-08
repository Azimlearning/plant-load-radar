import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { buildBoard, type BoardModel } from "@/data/board";
import { loadJsonDataset } from "@/data/loaders";
import { SyntheticScenarioSchema } from "@/data/schema";
import { SCENARIO_FILE } from "@/data/synth";
import { Board } from "./board";

const scenario = loadJsonDataset(SCENARIO_FILE, SyntheticScenarioSchema, join(process.cwd(), "data")).data;
const model = buildBoard(scenario);
const render = (m: BoardModel) => renderToStaticMarkup(<Board model={m} />);
const markup = render(model);

// ---- the honesty check ------------------------------------------------------------------------------

const ENTITIES: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#x27;": "'", "&#39;": "'" };

/** Everything a reader can see or hear: text nodes plus the text of aria-label and title attributes. */
function visibleText(html: string): string {
  const attrs = [...html.matchAll(/\b(?:aria-label|title)="([^"]*)"/g)].map((m) => m[1]).join(" ");
  const text = html.replace(/<[^>]+>/g, " ");
  return `${text} ${attrs}`.replace(/&(?:amp|lt|gt|quot|#x27|#39);/g, (e) => ENTITIES[e]!);
}

/** Numbers on screen that are not in the allowed list. Week labels and ISO dates are identifiers, not figures. */
function unexplainedFigures(html: string, allowed: readonly string[]): string[] {
  const stripped = visibleText(html)
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, " ") // ISO dates
    .replace(/\b\d{4}-W\d{2}\b/g, " ") // 2026-W43
    .replace(/\bW\d{2}\b/g, " "); // W43 on the axis
  const found = stripped.match(/\d{1,3}(?:,\d{3})+|\d+/g) ?? [];
  const ok = new Set(allowed);
  return [...new Set(found.filter((f) => !ok.has(f)))];
}

describe("every figure on screen comes from the model (hard constraint: numbers come from the calculator)", () => {
  it("the rendered board shows no number that is not in the model's allowed list", () => {
    expect(unexplainedFigures(markup, model.allowedFigures)).toEqual([]);
  });

  it("the check can fail: a planted stray number is caught", () => {
    const tampered = markup.replace("Spare or short capacity, by week", "Spare or short capacity, by week 98,765");
    expect(unexplainedFigures(tampered, model.allowedFigures)).toEqual(["98,765"]);
  });

  it("the check sees tooltips and screen-reader labels, not only visible text", () => {
    const tampered = markup.replace('role="img"', 'role="img" title="we promise 31,337 m³"');
    expect(unexplainedFigures(tampered, model.allowedFigures)).toContain("31,337");
  });

  it("the check is not vacuous: the board really does show the headline figures", () => {
    const text = visibleText(markup);
    for (const shown of ["2,000", "1,500", "600", "575,342", "1,000"]) expect(text).toContain(shown);
    expect(model.allowedFigures.length).toBeGreaterThan(20);
  });

  it("the components print model strings and do no arithmetic or formatting of their own", () => {
    const src = readFileSync(join(process.cwd(), "src/app/board.tsx"), "utf8");
    expect(src).not.toMatch(/toFixed|toLocaleString|Intl\.NumberFormat|Math\.round/);
    // Chart geometry uses model numbers only for position; no figure is computed for display.
    expect(src).not.toMatch(/\.spareM3\s*[*+/-]|\{[^}]*\*\s*\d+[^}]*\}\s*<\/(span|td|div)>/);
  });
});

describe("the synthetic-data notice", () => {
  it("is always on the page, as a labelled note, and says it is not Chin Hin data", () => {
    expect(markup).toContain('role="note"');
    expect(visibleText(markup)).toMatch(/Synthetic demo data/);
    expect(visibleText(markup)).toMatch(/not Chin Hin data/);
  });

  it("is the first thing in the page, before any figure", () => {
    expect(markup.indexOf('role="note"')).toBeLessThan(markup.search(/\d/));
  });
});

describe("Approve and Change are inert (writing a ledger entry is a later phase and must be human-gated)", () => {
  it("both buttons are disabled and explain why", () => {
    const buttons = [...markup.matchAll(/<button[^>]*>([^<]*)<\/button>/g)];
    expect(buttons.map((b) => b[1])).toEqual(["Approve", "Change"]);
    for (const b of buttons) expect(b[0]).toContain("disabled");
    expect(markup).toContain('aria-describedby="not-built"');
    expect(markup).toContain('id="not-built"');
    expect(visibleText(markup)).toMatch(/switched off in this build/i);
    expect(markup).toContain('class="actions-note"'); // the reason sits right beside the buttons, not only in the footer
  });

  it("the page has no form, no client directive and no write path", () => {
    expect(markup).not.toMatch(/<form|<input|<textarea/);
    for (const file of ["src/app/board.tsx", "src/app/page.tsx"]) {
      const src = readFileSync(join(process.cwd(), file), "utf8");
      expect(src, file).not.toMatch(/["']use client["']|useState|useEffect|onClick|onSubmit|fetch\(|writeFile|appendFile|localStorage/);
    }
  });
});

describe("structure and accessibility", () => {
  it("the chart is one labelled image whose label is the model's summary", () => {
    expect(markup).toContain('role="img"');
    expect(markup).toContain(`aria-label="${model.chart.summary}"`);
  });

  it("draws one titled bar per week, and labels only a few of them", () => {
    const bars = [...markup.matchAll(/<path[^>]*class="bar-(?:spare|short)"[^>]*>(.*?)<\/path>/g)];
    expect(bars.length).toBe(model.chart.bars.filter((b) => b.spareM3 !== 0).length);
    for (const b of bars) expect(b[1]).toMatch(/<title>.+<\/title>/);
    const labels = [...markup.matchAll(/class="value-label"/g)].length;
    expect(labels).toBe(model.chart.bars.filter((b) => b.label).length);
    expect(labels).toBeLessThan(model.chart.bars.length / 2);
  });

  it("every value is also in a table twin, with column headers and row headers", () => {
    expect(markup).toContain("<details");
    expect(markup).toContain("Show as a table");
    expect((markup.match(/<th scope="col"/g) ?? []).length).toBeGreaterThanOrEqual(6);
    for (const row of model.weekTable) expect(markup).toContain(`<th scope="row">${row.week}</th>`);
  });

  it("short and spare are distinguishable without colour: below versus above the line, with labels and a legend", () => {
    expect(markup).toContain("Spare capacity (above the line)");
    expect(markup).toContain("Short (below the line)");
    expect(markup).toContain("Decision needed");
  });

  it("tells a narrow-screen reader that the chart scrolls sideways and where the table alternative is", () => {
    expect(markup).toContain('class="scroll-hint"');
    expect(visibleText(markup)).toMatch(/scroll the chart sideways/);
  });

  it("uses a single h1, with section headings beneath it", () => {
    expect((markup.match(/<h1/g) ?? []).length).toBe(1);
    expect((markup.match(/<h2/g) ?? []).length).toBeGreaterThanOrEqual(3);
  });

  it("names every party as fictional", () => {
    const names = [...markup.matchAll(/class="line-who">([^<]+)</g)].map((m) => m[1]!);
    expect(names.length).toBeGreaterThan(0);
    expect(names.every((n) => n.includes("fictional"))).toBe(true);
  });
});

describe("states", () => {
  it("renders a plain message when no week needs a decision", () => {
    const quiet = render({ ...model, recommendations: [], focus: null });
    expect(quiet).toContain("No week needs a decision");
    expect(quiet).not.toContain("Decision needed</p>");
    expect(unexplainedFigures(quiet, model.allowedFigures)).toEqual([]);
  });

  it("says plainly when there is nothing to build ahead from", () => {
    const rec = model.recommendations[0]!;
    const none = render({
      ...model,
      recommendations: [{ ...rec, prebuild: { ...rec.prebuild, possible: false, moves: [], served: [], moved: [] } }],
    });
    expect(none).toContain("No earlier week has spare capacity to build ahead.");
  });

  it("when build-ahead would remove the shortage, it says so and does not show a second decision", () => {
    const rec = model.recommendations[0]!;
    const solved = render({ ...model, recommendations: [{ ...rec, prebuild: { ...rec.prebuild, dissolves: true, served: [], moved: [] } }] });
    expect(solved).toContain("that removes the shortage.");
    expect(solved).not.toContain("Then served");
  });
});
