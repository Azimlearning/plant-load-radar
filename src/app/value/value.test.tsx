import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { findMissingFiles, findUnmanifested, loadJsonDataset, loadManifest } from "@/data/loaders";
import { ValueInputsSchema } from "@/data/schema";
import { loadValue, VALUE_INPUTS_FILE } from "@/data/value";
import { Value } from "./value";

const model = loadValue();
const markup = renderToStaticMarkup(<Value model={model} />);
const dir = join(process.cwd(), "data");

const ENTITIES: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#x27;": "'", "&#39;": "'" };
function visibleText(html: string): string {
  const attrs = [...html.matchAll(/\b(?:aria-label|title)="([^"]*)"/g)].map((m) => m[1]).join(" ");
  return `${html.replace(/<[^>]+>/g, " ")} ${attrs}`.replace(/&(?:amp|lt|gt|quot|#x27|#39);/g, (e) => ENTITIES[e]!);
}
function unexplainedFigures(html: string, allowed: readonly string[]): string[] {
  const found = visibleText(html).match(/\d{1,3}(?:,\d{3})+|\d+/g) ?? [];
  const ok = new Set(allowed);
  return [...new Set(found.filter((f) => !ok.has(f)))];
}

describe("every figure on the business-case page comes from the model", () => {
  it("shows no number the model did not register", () => {
    expect(unexplainedFigures(markup, model.allowedFigures)).toEqual([]);
  });
  it("the check can fail: a planted number is caught", () => {
    expect(unexplainedFigures(markup.replace("How to read this", "How to read this 98,765"), model.allowedFigures)).toEqual(["98,765"]);
  });
  it("the component does no arithmetic or formatting of its own and has no client code", () => {
    const src = readFileSync(join(process.cwd(), "src/app/value/value.tsx"), "utf8");
    expect(src).not.toMatch(/toFixed|toLocaleString|Intl\.NumberFormat|Math\.round|use client|useState|useEffect|onClick|fetch\(/);
    expect(markup).not.toMatch(/<form|<input|<button|<textarea/);
  });
});

describe("the page is honest about what it is", () => {
  const text = visibleText(markup);
  it("opens with the illustrative notice, before any figure", () => {
    expect(markup.indexOf('role="note"')).toBeLessThan(markup.search(/\d/));
    expect(text).toMatch(/not a finding about Chin Hin/);
  });
  it("tags every step with where it comes from, and every assumed input says what real data replaces it", () => {
    for (const l of model.lines) for (const s of l.steps) expect(s.source.length).toBeGreaterThan(0);
    expect(text).toContain("Assumed");
    expect(text).toContain("Public, low authority");
    expect(text).toContain("Assumed placeholder (no public AAC price)");
    expect(model.assumptions).toHaveLength(4);
    for (const a of model.assumptions) expect(a.replaceWith.length).toBeGreaterThan(20);
  });
  it("makes no claim of benefit or return, and says the late-handover cost is an upper bound", () => {
    expect(text).toMatch(/makes no claim of benefit/);
    expect(text).toMatch(/upper bound/);
    expect(text).not.toMatch(/\bROI\b|payback|we will save|saves RM/i);
  });
  it("shows a result row for each of the three costs", () => {
    expect(model.lines.map((l) => l.id)).toEqual(["stock", "margin", "delay"]);
    expect((markup.match(/class="result-row"/g) ?? []).length).toBe(3);
  });
  it("shows unit costs and says the carrying rate probably overstates the stock line", () => {
    expect(model.units).toHaveLength(3);
    expect(text).toMatch(/probably overstated/);
    expect(text).toMatch(/one-off, not a yearly cost/);
  });
  it("success is measured as cash, margin and delay days only", () => {
    expect(model.pilot).toEqual(["Cash released from excess stock", "Outside margin no longer lost", "Project delay days avoided"]);
  });
});

describe("the inputs file", () => {
  it("is in the manifest as synthetic, valid, and the manifest audits stay clean", () => {
    expect(loadManifest(dir).find((e) => e.file === VALUE_INPUTS_FILE)?.kind).toBe("synthetic");
    expect(loadJsonDataset(VALUE_INPUTS_FILE, ValueInputsSchema, dir).data.meta.kind).toBe("synthetic");
    expect(findUnmanifested(dir)).toEqual([]);
    expect(findMissingFiles(dir)).toEqual([]);
  });
});
