import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { applyCallOffs, checkCallOff } from "@/data/calloffs";
import { buildCallOffs } from "@/data/calloffs-view";
import { buildHuddle } from "@/data/huddle";
import { buildLanding, loadFacts } from "@/data/landing";
import { loadJsonDataset } from "@/data/loaders";
import { buildOutbox } from "@/data/outbox-view";
import { SyntheticScenarioSchema, type LedgerRow } from "@/data/schema";
import { buildOutboxRows } from "@/ledger/outbox";
import { recordDecision } from "@/ledger/decide";
import { templateDrafter } from "@/writer/drafter";
import { buildDecisions } from "@/data/decisions";
import { CallOffs } from "./calloffs/calloffs";
import { Huddle } from "./huddle/huddle";
import { Landing } from "./landing";
import { Outbox } from "./outbox/outbox";

const dir = join(process.cwd(), "data");
const deck = loadJsonDataset("synthetic/deck-story.json", SyntheticScenarioSchema, dir).data;

/** Figures a reader can see that no model accounts for. Week labels and ISO dates are identifiers. */
function stray(html: string, allowed: readonly string[]): string[] {
  const text = html
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:amp|lt|gt|quot|#x27|#39);/g, " ")
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, " ")
    .replace(/\b\d{4}-W\d{2}\b/g, " ");
  return [...new Set((text.match(/\d{1,3}(?:,\d{3})+|\d+/g) ?? []).filter((f) => !allowed.includes(f)))];
}
const first = (html: string) => html.indexOf("Synthetic demo data");

describe("the overview page (slides 1, 2, 6, 7)", () => {
  const model = buildLanding(deck, loadFacts(dir));
  const html = renderToStaticMarkup(<Landing model={model} />);

  it("every figure is from a public source with its name, or from the calculator", () => {
    expect(stray(html, model.allowedFigures)).toEqual([]);
    expect(model.stats.map((s) => s.value)).toEqual(["+83%", "RM5.29b", "10.8%"]);
    for (const s of model.stats) expect(s.source.length).toBeGreaterThan(10);
  });
  it("shows the worked example from the board's own recommendation", () => {
    const text = html.replace(/<[^>]+>/g, " ");
    expect(text).toContain("RM435,616");
    expect(text).toContain("RM18,073");
    expect(model.story!.verdict).toBe("Serve Project A (fictional). Offer Contractor B (fictional) the next free week, Week 44.");
  });
  it("the synthetic notice comes first, and there are five people with a route each", () => {
    expect(first(html)).toBeGreaterThan(-1);
    expect(first(html)).toBeLessThan(html.indexOf("Plant Load"));
    expect(model.people.map((p) => p.href)).toEqual(["/board", "/huddle", "/ask", "/calloffs", "/finance"]);
    expect((html.match(/<h1/g) ?? []).length).toBe(1);
  });
});

describe("the weekly huddle (slide 6, slide 11)", () => {
  const decided: LedgerRow[] = [];
  const open = buildHuddle(deck, [], { needsPerson: 18, lines: 21 });

  it("builds the agenda from what is open: one decision, one covered week, two slots, 30 minutes in four blocks", () => {
    expect(open.decisions.map((d) => d.headline)).toEqual(["Week 43 is 2,000 m³ short"]);
    expect(open.covered).toHaveLength(1);
    expect(open.slots).toHaveLength(2);
    expect(open.frame.minutes).toBe("30");
    expect(open.frame.blocks.map((b) => b.minutes)).toEqual(["15", "5", "5", "5"]);
  });
  it("the blocks add up to no more than the frame", () => {
    expect(deck.huddle!.blocks.reduce((t, b) => t + b.minutes, 0)).toBeLessThanOrEqual(deck.huddle!.minutes);
  });
  it("every figure is accounted for, before and after a decision, and the slots that lapse soon are flagged", () => {
    expect(stray(renderToStaticMarkup(<Huddle model={open} minutes={30} />), open.allowedFigures)).toEqual([]);
    const done = recordDecision(deck, { week: "2026-W43", mode: "approve", approvedBy: "Siti (scheduler)" }, { read: () => decided, append: (r) => void decided.push(r) }, () => new Date("2026-10-12T02:00:00Z"));
    expect(done.ok).toBe(true);
    const after = buildHuddle(deck, decided, { needsPerson: 18, lines: 21 });
    expect(after.decisions).toHaveLength(0);
    expect(after.credits[0]!.line).toContain("RM435,616");
    expect(stray(renderToStaticMarkup(<Huddle model={after} minutes={30} />), after.allowedFigures)).toEqual([]);
    expect(open.slots.map((s) => s.lapsesSoon)).toEqual([true, false]); // 26 Oct is within two weeks of 12 Oct; 2 Nov is not
  });
});

describe("call-offs and reserved slots (slide 6, slide 7)", () => {
  it("the form page shows the policy, the weeks that earn a slot, and the seeded slots; every figure is accounted for", () => {
    const m = buildCallOffs(deck, [], {});
    const html = renderToStaticMarkup(<CallOffs model={m} action={async () => {}} />);
    expect(stray(html, m.allowedFigures)).toEqual([]);
    expect(m.weekOptions.map((o) => o.label.split(" (")[0])).toEqual(["Week 46", "Week 47", "Week 48", "Week 49", "Week 50", "Week 51", "Week 52"]);
    expect(m.weekOptions[0]!.label).toBe("Week 46 (1,000 m³ spare)");
    expect(m.slots.map((s) => s.status)).toEqual(["Held until the call-off is confirmed", "Held until the call-off is confirmed"]);
    expect(m.policy).toContain("4 or more weeks ahead");
  });
  it("after a call-off, the new slot is listed as the visitor's own and the week has less spare", () => {
    const ok = checkCallOff(deck, { projectId: "project-d", week: "2026-W46", volumeM3: "200", requestedBy: "Hakim" }, [], () => new Date("2026-10-12T02:00:00Z"));
    if (!ok.ok) throw new Error("setup");
    const merged = applyCallOffs(deck, [ok.callOff]);
    const m = buildCallOffs(merged, [ok.callOff], { ok: true });
    expect(m.slots.map((s) => s.source)).toContain("Your call-off");
    expect(m.weekOptions[0]!.label).toBe("Week 46 (800 m³ spare)");
    expect(m.confirmed).toBe(true);
  });
  it("a refusal prints fixed text, never text from the address", () => {
    expect(buildCallOffs(deck, [], { error: "too-soon" }).error).toMatch(/far enough ahead/);
    expect(buildCallOffs(deck, [], { error: "<script>alert(1)</script>" }).error).toBe("Nothing was reserved.");
  });
});

describe("the simulated outbox (slide 8, slide 10)", () => {
  const pending = buildDecisions(deck, [], null).pending[0]!;
  it("holds what a person approved, to whom, and by whom; it says nothing was sent", () => {
    const rows = buildOutboxRows({ week: pending.week, approvedBy: "Siti (scheduler)", now: new Date("2026-10-12T02:00:00Z"), drafts: pending.drafts, edited: {} });
    const m = buildOutbox(rows);
    const html = renderToStaticMarkup(<Outbox model={m} />);
    expect(m.messages.map((x) => x.to)).toEqual(["Plant manager (weekly huddle)", "Contractor B (fictional)"]);
    expect(html).toContain("Nothing was sent");
    expect(html).toContain("Mon 26 Oct");
    expect(html).toContain("approved by Siti (scheduler)");
  });
  it("an empty outbox says so", () => {
    expect(renderToStaticMarkup(<Outbox model={buildOutbox([])} />)).toContain("Nothing is in the outbox yet");
  });
  it("text in a message is rendered as text, not markup", () => {
    const rows = buildOutboxRows({ week: "2026-W43", approvedBy: "S", now: new Date("2026-10-12T02:00:00Z"), drafts: templateDrafter("P", { week: "2026-W43", weekName: "Week 43", decided: null, headline: "h", freeText: "f", wantedText: "w", served: [], moved: [], prebuild: { stockCap: "", covers: "", stillShort: "", moves: [], possible: false, dissolves: false, served: [], moved: [] } }), edited: { brief: "<img src=x onerror=alert(1)>" } });
    const html = renderToStaticMarkup(<Outbox model={buildOutbox(rows)} />);
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });
});
