import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Finance } from "@/app/finance/finance";
import { recordDecision } from "@/ledger/decide";
import { buildFinance, csvCell, financeCsv, financeRows, streak } from "./finance";
import { loadHistory, summariseHistory } from "./history";
import { loadJsonDataset } from "./loaders";
import { SyntheticScenarioSchema, type LedgerRow } from "./schema";

const dir = join(process.cwd(), "data");
const deck = loadJsonDataset("synthetic/deck-story.json", SyntheticScenarioSchema, dir).data;
const history = loadHistory(dir);
const ledger: LedgerRow[] = [];
const done = recordDecision(deck, { week: "2026-W43", mode: "approve", approvedBy: "Siti (scheduler)" }, { read: () => ledger, append: (r) => void ledger.push(r) }, () => new Date("2026-10-12T02:00:00Z"));
if (!done.ok) throw new Error("setup");

const figures = (html: string, allowed: readonly string[]) => {
  const text = html.replace(/<[^>]+>/g, " ").replace(/&(?:amp|lt|gt|quot|#x27|#39);/g, " ").replace(/\b\d{4}-\d{2}-\d{2}\b/g, " ").replace(/\b\d{4}-W\d{2}\b/g, " ");
  return [...new Set((text.match(/\d{1,3}(?:,\d{3})+|\d+/g) ?? []).filter((f) => !allowed.includes(f)))];
};

describe("the seeded history", () => {
  it("adds up to the deck's RM246k of delay avoided, from the calculator (slide 9)", () => {
    const total = summariseHistory(history, deck).totalRM;
    expect(Math.round(total / 1000)).toBe(246);
  });
  it("includes decisions where the outside side went first, so the rule is not one-sided", () => {
    expect(history.entries.map((e) => e.servedSide)).toEqual(["internal", "internal", "external", "internal", "external"]);
  });
});

describe("finance's view", () => {
  it("prices every row with the calculator: a project-first row and an outside-first row", () => {
    const rows = financeRows(deck, history, []);
    const first = rows.find((r) => r.id === "hist-2026-W37")!;
    expect(first.servedSide).toBe("internal");
    expect(first.servedRM).toBeGreaterThan(first.pushedRM); // the rule served the larger value
    const outside = rows.find((r) => r.id === "hist-2026-W39")!;
    expect(outside.servedSide).toBe("external");
    expect(outside.pushedRM).toBe(0); // the project had float
  });

  it("serves the larger ringgit first in every seeded row (the rule, checked against the table)", () => {
    for (const r of financeRows(deck, history, [])) expect(r.servedRM, r.id).toBeGreaterThanOrEqual(r.pushedRM);
  });

  it("adds this visitor's week-43 decision to the table and the credit tile", () => {
    const m = buildFinance(deck, history, ledger, undefined);
    expect(m.rows.at(-1)).toMatchObject({ week: "Week 43", servedValue: "RM435,616", pushedValue: "RM18,073", source: "Your decision" });
    expect(m.tiles.find((t) => t.id === "decisions")!.value).toBe("6");
  });

  it("filters by month and says nothing is a saving", () => {
    const oct = buildFinance(deck, history, ledger, "2026-10");
    expect(oct.rows.map((r) => r.week)).toEqual(["Week 40", "Week 41", "Week 43"]);
    expect(oct.tiles.find((t) => t.id === "at-stake")!.note).toMatch(/not a saving/);
  });

  it("flags one side winning three times running, and not a mixed run", () => {
    expect(buildFinance(deck, history, [], undefined).flag.tone).toBe("ok"); // ends internal, external
    expect(streak(financeRows(deck, history, ledger))).toEqual({ side: "internal", length: 1 });
    const threeInternal = { ...history, entries: [history.entries[0]!, history.entries[1]!, history.entries[3]!] };
    expect(buildFinance(deck, threeInternal, [], undefined).flag.tone).toBe("watch");
  });

  it("every figure on the rendered page is accounted for", () => {
    const m = buildFinance(deck, history, ledger, undefined);
    expect(figures(renderToStaticMarkup(<Finance model={m} />), m.allowedFigures)).toEqual([]);
  });
});

describe("the CSV for finance's audit", () => {
  it("has a header and one line per decision, with plain numbers", () => {
    const lines = financeCsv(deck, history, ledger, undefined).trim().split("\n");
    expect(lines[0]).toBe("decided_on,week,served,served_side,served_ringgit,pushed_back,pushed_back_ringgit,approved_by,source");
    expect(lines).toHaveLength(1 + 6);
    expect(lines.at(-1)).toContain("435616.44");
  });
  it("neutralises spreadsheet formulas and quotes commas", () => {
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvCell("+1")).toBe("'+1");
    expect(csvCell('a, "b"')).toBe('"a, ""b"""');
    expect(csvCell(12.345)).toBe("12.35");
  });
});
