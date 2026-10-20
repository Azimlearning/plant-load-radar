import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Decisions } from "@/app/decisions/decisions";
import { Huddle } from "@/app/huddle/huddle";
import { recordDecision } from "@/ledger/decide";
import { buildBoard } from "./board";
import { buildDecisions, refusalText } from "./decisions";
import { buildHuddle } from "./huddle";
import { checkHuddleFlag, openFlags } from "./huddle-flags";
import { loadJsonDataset } from "./loaders";
import { SyntheticScenarioSchema, type HuddleFlag, type LedgerRow } from "./schema";

const deck = loadJsonDataset("synthetic/deck-story.json", SyntheticScenarioSchema, join(process.cwd(), "data")).data;
const NOW = () => new Date("2026-10-12T02:30:00Z");
const flagOf = (over: Partial<HuddleFlag> = {}): HuddleFlag => ({ id: "huddle-2026-W43", week: "2026-W43", flaggedBy: "Siti", flaggedAt: "2026-10-12T02:30:00.000Z", ...over });
const decidedRows = (): LedgerRow[] => {
  const rows: LedgerRow[] = [];
  const out = recordDecision(deck, { week: "2026-W43", mode: "approve", approvedBy: "Hakim" }, { read: () => rows, append: (r) => void rows.push(r) });
  if (!out.ok) throw new Error("setup");
  return rows;
};

describe("flagging a waiting decision for the huddle", () => {
  it("accepts a named person on a week that has a decision waiting, and stores only a marker", () => {
    const r = checkHuddleFlag(deck, [], { week: "2026-W43", flaggedBy: "  Siti " }, [], NOW);
    expect(r).toEqual({ ok: true, flag: { id: "huddle-2026-W43", week: "2026-W43", flaggedBy: "Siti", flaggedAt: "2026-10-12T02:30:00.000Z" } });
  });

  it.each([
    [{ week: "2026-W43", flaggedBy: "  " }, [], "huddle-name-required"],
    [{ week: "2026-W43", flaggedBy: undefined }, [], "huddle-name-required"],
    [{ week: "2026-W42", flaggedBy: "Siti" }, [], "huddle-unknown-week"], // covered by building ahead: no decision to flag
    [{ week: "nonsense", flaggedBy: "Siti" }, [], "huddle-unknown-week"],
    [{ week: "2026-W43", flaggedBy: "Siti" }, [flagOf()], "already-flagged"],
  ] as const)("refuses %j with %s", (input, existing, code) => {
    expect(checkHuddleFlag(deck, [], input, [...existing], NOW)).toEqual({ ok: false, error: code });
  });

  it("refuses a week that has already been decided", () => {
    expect(checkHuddleFlag(deck, decidedRows(), { week: "2026-W43", flaggedBy: "Siti" }, [], NOW)).toEqual({ ok: false, error: "huddle-unknown-week" });
  });

  it("a flag is spent once the week is decided", () => {
    expect(openFlags([flagOf()], [])).toHaveLength(1);
    expect(openFlags([flagOf()], decidedRows())).toEqual([]);
  });

  it("every refusal prints fixed text, never text from the address", () => {
    expect(refusalText("huddle-name-required")).toMatch(/type your name/);
    expect(refusalText("already-flagged")).toMatch(/already on the huddle/);
    expect(refusalText("<script>")).toBe("Nothing was recorded.");
  });
});

describe("what the flag changes, and what it must not", () => {
  const flags = [flagOf()];

  it("shows on the decisions page and the huddle, flagged first, and the decision stays open", () => {
    const d = buildDecisions(deck, [], null, undefined, flags);
    expect(d.pending.map((p) => p.week)).toEqual(["2026-W43"]);
    expect(d.pending[0]!.flagged).toEqual({ by: "Siti", when: "Mon 12 Oct" });
    const h = buildHuddle(deck, [], null, [], flags);
    expect(h.decisions[0]!.flagged).toEqual({ by: "Siti", when: "Mon 12 Oct" });
    expect(buildHuddle(deck, [], null).decisions[0]!.flagged).toBeNull();
  });

  it("changes no figure, no recommendation and no board tile", () => {
    const strip = <T extends { flagged: unknown }>(xs: T[]) => xs.map((x) => ({ ...x, flagged: null }));
    expect(strip(buildHuddle(deck, [], null, [], flags).decisions)).toEqual(strip(buildHuddle(deck, [], null).decisions));
    const w = buildDecisions(deck, [], null, undefined, flags);
    const wo = buildDecisions(deck, [], null);
    expect(strip(w.pending).map((p) => ({ ...p, drafts: undefined }))).toEqual(strip(wo.pending).map((p) => ({ ...p, drafts: undefined })));
    expect(buildBoard(deck).kpis.find((k) => k.id === "decisions")!.value).toBe("1");
  });

  it("shows the Malaysian date: a flag made at 1 a.m. in Kuala Lumpur is still that day, not the day before in UTC", () => {
    const late = [flagOf({ flaggedAt: "2026-10-11T17:30:00.000Z" })]; // 01:30 on Mon 12 Oct in Malaysia
    expect(buildDecisions(deck, [], null, undefined, late).pending[0]!.flagged!.when).toBe("Mon 12 Oct");
  });

  it("disappears from the huddle once a person records the decision", () => {
    const decided = decidedRows();
    expect(buildHuddle(deck, decided, null, [], flags).decisions).toEqual([]);
    expect(buildDecisions(deck, decided, null, undefined, flags).pending).toEqual([]);
  });
});

describe("the screens", () => {
  const flags = [flagOf()];
  const noop = async () => {};

  it("the decisions page offers a real button when flagging is wired, and a link when it is not", () => {
    const wired = renderToStaticMarkup(<Decisions model={buildDecisions(deck, [], null)} action={noop} huddleAction={noop} />);
    expect(wired).toMatch(/<button[^>]*formAction[^>]*>\s*Send to the huddle/);
    const unwired = renderToStaticMarkup(<Decisions model={buildDecisions(deck, [], null)} action={noop} />);
    expect(unwired).toContain('href="/huddle#week-2026-W43"');
  });

  it("once flagged, the decisions page says who and when, and points at the huddle instead of offering the button again", () => {
    const html = renderToStaticMarkup(<Decisions model={buildDecisions(deck, [], null, undefined, flags)} action={noop} huddleAction={noop} />);
    expect(html).toContain("Sent to the huddle by Siti on Mon 12 Oct");
    expect(html).toContain("Open it in the huddle");
    expect(html).not.toMatch(/<button[^>]*formAction/);
  });

  it("the huddle page shows who sent the week there", () => {
    const html = renderToStaticMarkup(<Huddle model={buildHuddle(deck, [], null, [], flags)} minutes={30} />);
    expect(html).toContain("Sent here by Siti on Mon 12 Oct");
  });

  it("every figure on the flagged decisions page is accounted for", () => {
    const m = buildDecisions(deck, [], null, undefined, flags);
    const text = renderToStaticMarkup(<Decisions model={m} action={noop} huddleAction={noop} />).replace(/<textarea[\s\S]*?<\/textarea>/g, "").replace(/<[^>]+>/g, " ").replace(/&(?:amp|lt|gt|quot|#x27|#39);/g, " ");
    const stripped = text.replace(/\b\d{4}-\d{2}-\d{2}\b/g, " ").replace(/\b\d{4}-W\d{2}\b/g, " ");
    const found = stripped.match(/\d{1,3}(?:,\d{3})+|\d+/g) ?? [];
    expect([...new Set(found.filter((f) => !m.allowedFigures.includes(f)))]).toEqual([]);
  });
});

describe("a name that is too long", () => {
  it("is refused with the same fixed text as a missing name, never stored", () => {
    const r = checkHuddleFlag(deck, [], { week: "2026-W43", flaggedBy: "x".repeat(81) }, [], NOW);
    expect(r).toEqual({ ok: false, error: "huddle-name-required" });
    expect(checkHuddleFlag(deck, [], { week: "2026-W43", flaggedBy: "x".repeat(80) }, [], NOW).ok).toBe(true);
  });
});
