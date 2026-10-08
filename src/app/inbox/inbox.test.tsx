import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { buildInbox, loadCapture, type InboxModel } from "@/data/inbox";
import { Inbox } from "./inbox";

const { result, known } = loadCapture();
const model = buildInbox(result, known);
const render = (m: InboxModel) => renderToStaticMarkup(<Inbox model={m} />);
const markup = render(model);

const ENTITIES: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#x27;": "'", "&#39;": "'" };
function visibleText(html: string): string {
  const attrs = [...html.matchAll(/\b(?:aria-label|title)="([^"]*)"/g)].map((m) => m[1]).join(" ");
  return `${html.replace(/<[^>]+>/g, " ")} ${attrs}`.replace(/&(?:amp|lt|gt|quot|#x27|#39);/g, (e) => ENTITIES[e]!);
}
function unexplainedFigures(html: string, allowed: readonly string[]): string[] {
  const stripped = visibleText(html).replace(/\b\d{4}-\d{2}-\d{2}\b/g, " ");
  const found = stripped.match(/\d{1,3}(?:,\d{3})+|\d+/g) ?? [];
  const ok = new Set(allowed);
  return [...new Set(found.filter((f) => !ok.has(f)))];
}

describe("every figure on the inbox comes from the model", () => {
  it("shows no number the model did not register", () => {
    expect(unexplainedFigures(markup, model.allowedFigures)).toEqual([]);
  });
  it("the check can fail: a planted number is caught, in text and in a tooltip", () => {
    expect(unexplainedFigures(markup.replace("Orders inbox</h1>", "Orders inbox 98,765</h1>"), model.allowedFigures)).toEqual(["98,765"]);
    expect(unexplainedFigures(markup.replace('<mark title="', '<mark title="31,337 '), model.allowedFigures)).toContain("31,337");
  });
  it("the component does no arithmetic or formatting of its own", () => {
    const src = readFileSync(join(process.cwd(), "src/app/inbox/inbox.tsx"), "utf8");
    expect(src).not.toMatch(/toFixed|toLocaleString|Intl\.NumberFormat|Math\.round|["']use client["']|useState|useEffect|onClick|fetch\(/);
  });
});

describe("the inbox is honest about what it is", () => {
  it("opens with the synthetic notice and says the reader is rules, not a model", () => {
    expect(markup.indexOf('role="note"')).toBeLessThan(markup.search(/\d/));
    expect(visibleText(markup)).toMatch(/not Chin Hin data/);
    expect(visibleText(markup)).toMatch(/rules-based reader, not an AI model/);
  });
  it("has no form, input or button: nothing can be sent or saved from here", () => {
    expect(markup).not.toMatch(/<form|<input|<textarea|<button/);
  });
  it("every message is shown in full, including the slide-8 message, with its source words highlighted", () => {
    const quotes = [...markup.matchAll(/<blockquote[^>]*>(.*?)<\/blockquote>/g)].map((m) => m[1]!.replace(/<[^>]+>/g, ""));
    expect(quotes).toContain("Boss, Project A site need 1,500 m3 AAC 100mm by Tue 20 Oct. Can confirm ya");
    expect(markup).toContain('<mark title="Read as: Volume">1,500 m3</mark>');
    expect(model.messages).toHaveLength(22);
  });
  it("shows a state as text and an icon, never colour alone, and says why a value is not confirmed", () => {
    for (const label of ["Confirmed", "Inferred", "Missing", "Conflicting"]) expect(markup).toContain(label);
    expect(markup).toContain('class="icon" aria-hidden="true"');
    expect(visibleText(markup)).toMatch(/two quantities in one message/);
    expect(visibleText(markup)).toMatch(/no PO or call-off number yet/);
  });
  it("puts messages that need a person first, and shows the injection as a flagged note", () => {
    const firstOk = model.messages.findIndex((m) => !m.needsPerson);
    expect(model.messages.slice(0, firstOk).every((m) => m.needsPerson)).toBe(true);
    expect(markup).toContain("Contains instructions aimed at the reader. They were ignored.");
  });
  it("names every sender as fictional", () => {
    for (const m of model.messages) expect(m.sender).toContain("fictional");
  });
  it("its count of lines to check is the count the board shows", () => {
    expect(model.capture).toEqual({ needsPerson: result.counts.needsPerson, lines: result.counts.lines });
  });
});
