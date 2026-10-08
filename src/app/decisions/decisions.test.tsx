import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { buildAsk } from "@/data/ask";
import { buildDecisions, buildLedger, refusalText } from "@/data/decisions";
import { loadJsonDataset } from "@/data/loaders";
import { SyntheticScenarioSchema, type LedgerRow } from "@/data/schema";
import { SCENARIO_FILE } from "@/data/synth";
import { recordDecision } from "@/ledger/decide";
import type { Drafter } from "@/writer/drafter";
import { Ask } from "../ask/ask";
import { Ledger } from "../ledger/ledger";
import { Decisions } from "./decisions";

const scenario = loadJsonDataset(SCENARIO_FILE, SyntheticScenarioSchema, join(process.cwd(), "data")).data;
const noop = async () => {};

const ENTITIES: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#x27;": "'", "&#39;": "'" };
function visibleText(html: string): string {
  const attrs = [...html.matchAll(/\b(?:aria-label|title)="([^"]*)"/g)].map((m) => m[1]).join(" ");
  return `${html.replace(/<[^>]+>/g, " ")} ${attrs}`.replace(/&(?:amp|lt|gt|quot|#x27|#39);/g, (e) => ENTITIES[e]!);
}
function unexplainedFigures(html: string, allowed: readonly string[]): string[] {
  const stripped = visibleText(html).replace(/\b\d{4}-\d{2}-\d{2}\b/g, " ").replace(/\b\d{4}-W\d{2}\b/g, " ");
  const found = stripped.match(/\d{1,3}(?:,\d{3})+|\d+/g) ?? [];
  const ok = new Set(allowed);
  return [...new Set(found.filter((f) => !ok.has(f)))];
}

// A ledger row produced by the real write path, so the ledger page is tested on what the app really writes.
const rows: LedgerRow[] = [];
const out = recordDecision(scenario, { week: "2026-W43", mode: "approve", approvedBy: "Siti (scheduler)", note: "Handover at risk" }, { read: () => rows, append: (r) => void rows.push(r) }, () => new Date("2026-10-12T02:00:00Z"));
if (!out.ok) throw new Error("setup failed");

describe("the decisions page", () => {
  const model = buildDecisions(scenario, [], null);
  const html = renderToStaticMarkup(<Decisions model={model} action={noop} />);
  const text = visibleText(html);

  it("every figure on it, including the drafts, is one the calculator produced", () => {
    expect(unexplainedFigures(html, model.allowedFigures)).toEqual([]);
    expect(model.pending).toHaveLength(1);
  });

  it("the check can fail: a planted number is caught", () => {
    expect(unexplainedFigures(html.replace("The rule recommends", "The rule recommends 98,765"), model.allowedFigures)).toEqual(["98,765"]);
  });

  it("a drafter that invents a number is caught by the same check", () => {
    const lying: Drafter = (_plant, rec) => ({ brief: `${rec.headline}. We will save RM424,242 this week.`, replies: [] });
    const bad = buildDecisions(scenario, [], null, lying);
    expect(unexplainedFigures(renderToStaticMarkup(<Decisions model={bad} action={noop} />), bad.allowedFigures)).toContain("424,242");
  });

  it("the form sends text only: the week, the choice, a name and a note, never a figure", () => {
    const names = [...html.matchAll(/<(?:input|select|textarea)[^>]*\bname="([^"]+)"/g)].map((m) => m[1]);
    expect([...new Set(names)].sort()).toEqual(["approvedBy", "chosenRequestId", "mode", "note", "week"]);
    expect(html).not.toMatch(/type="number"/);
  });

  it("requires a name, and the page says a typed name is not a login", () => {
    expect(html).toMatch(/name="approvedBy"[^>]*required|required[^>]*name="approvedBy"/);
    expect(text).toMatch(/not a login/);
  });

  it("the drafts say nothing was sent, and the customer reply carries no ringgit and offers the next week", () => {
    const reply = model.pending[0]!.drafts.replies[0]!;
    expect(reply.to).toContain("Contractor B");
    expect(reply.text).not.toMatch(/RM\d/);
    expect(reply.text).toMatch(/We can offer Week \d+ instead/);
    expect(text).toMatch(/Nothing has been sent/);
    expect(text).toMatch(/not by a language model/);
    expect(text).not.toMatch(/\bsent to\b|\bmessage sent\b/i);
  });

  it("explains a refusal from a fixed list, never from text in the address", () => {
    expect(refusalText("name-required")).toMatch(/named person/);
    expect(refusalText("<script>alert(1)</script>")).toBe("Nothing was recorded.");
    expect(refusalText(undefined)).toBeNull();
    const withError = renderToStaticMarkup(<Decisions model={buildDecisions(scenario, [], refusalText("name-required"))} action={noop} />);
    expect(withError).toContain('role="alert"');
  });

  it("shows nothing to decide once the week is in the ledger", () => {
    const done = buildDecisions(scenario, rows, null);
    expect(done.pending).toEqual([]);
    expect(visibleText(renderToStaticMarkup(<Decisions model={done} action={noop} />))).toMatch(/No week is waiting/);
  });

  it("opens with the synthetic notice before any figure", () => {
    expect(html.indexOf('role="note"')).toBeLessThan(html.search(/\d/));
  });
});

describe("the ledger page", () => {
  const model = buildLedger(scenario, rows);
  const html = renderToStaticMarkup(<Ledger model={model} />);
  const text = visibleText(html);

  it("every figure on it is one the calculator produced", () => {
    expect(unexplainedFigures(html, model.allowedFigures)).toEqual([]);
  });

  it("shows who decided, how, the ringgit on each side, and labels the total as value at stake, not a saving", () => {
    expect(text).toContain("Siti (scheduler)");
    expect(text).toContain("Approved the rule's recommendation");
    expect(text).toMatch(/RM575,342/);
    expect(text).toMatch(/It is not a saving/);
    expect(text).not.toMatch(/\bsaved\b|protected this month/i);
  });

  it("is read-only: no form, button or input, and no client code", () => {
    expect(html).not.toMatch(/<form|<button|<input|<textarea/);
    const src = readFileSync(join(process.cwd(), "src/app/ledger/ledger.tsx"), "utf8");
    expect(src).not.toMatch(/use client|useState|onClick|fetch\(|writeFile|appendRow/);
  });

  it("an empty ledger says so", () => {
    expect(visibleText(renderToStaticMarkup(<Ledger model={buildLedger(scenario, [])} />))).toMatch(/No decision has been recorded yet/);
  });
});

describe("ask the board", () => {
  const ask = (week?: string, volume?: string) => {
    const model = buildAsk(scenario, { week, volume });
    const html = renderToStaticMarkup(<Ask model={model} />);
    return { model, html, text: visibleText(html) };
  };

  it("answers 'yes' for a small volume in a quiet week, with figures from the calculator", () => {
    const a = ask("2026-W44", "500");
    expect(a.model.answer?.tone).toBe("yes");
    expect(unexplainedFigures(a.html, a.model.allowedFigures)).toEqual([]);
  });

  it("says a request that only fits by contesting others depends on the rule, and names the next week", () => {
    const a = ask("2026-W43", "1800");
    expect(a.model.answer?.tone).toBe("maybe");
    expect(a.text).toMatch(/rule would decide by the ringgit at stake/);
    expect(unexplainedFigures(a.html, a.model.allowedFigures)).toEqual([]);
  });

  it("says no when it exceeds free capacity, and that confirmed orders are never bumped", () => {
    const a = ask("2026-W43", "5000");
    expect(a.model.answer?.tone).toBe("no");
    expect(a.text).toMatch(/confirmed orders are never bumped/);
  });

  it("explains bad input in plain words and shows no answer", () => {
    for (const [w, v] of [["2026-W43", "0"], ["2026-W43", "abc"], ["2026-W43", "-4"], ["2026-W43", "1.5"], ["", "100"], ["2026-W99", "100"]] as const) {
      const a = ask(w, v);
      expect(a.model.answer, `${w} ${v}`).toBeNull();
      expect(a.model.error, `${w} ${v}`).toMatch(/Choose a week|outside the board's horizon/);
    }
  });

  it("is a plain GET form with no client code, and is clear that it is not a chatbot", () => {
    const a = ask();
    expect(a.html).toMatch(/<form[^>]*method="get"/);
    expect(a.text).toMatch(/not a chatbot/);
    const src = readFileSync(join(process.cwd(), "src/app/ask/ask.tsx"), "utf8");
    expect(src).not.toMatch(/use client|useState|onClick|fetch\(/);
  });
});
