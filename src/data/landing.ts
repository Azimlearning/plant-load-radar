// View-model for the overview page: the deck's story in one screen (slides 1, 2, 6, 7). The public figures come from
// data/public with their sources; the worked example comes from the board's own recommendation. Copy is words only; every
// number goes through `Figures` or comes from the board model's figures.

import { buildBoard, Figures, type Line } from "./board";
import { loadJsonDataset } from "./loaders";
import { PublicFactsFileSchema, type PublicFact, type SyntheticScenario } from "./schema";

export interface PublicStat {
  id: string;
  value: string;
  label: string;
  source: string;
}

export interface PersonCard {
  id: string;
  role: string;
  where: string;
  wants: string;
  doesNotWant: string;
  href: string;
  cta: string;
}

export interface LandingModel {
  title: string;
  banner: string;
  kicker: string;
  tagline: string;
  stats: PublicStat[];
  story: { headline: string; served: Line[]; moved: Line[]; verdict: string } | null;
  people: PersonCard[];
  steps: { id: string; label: string; text: string }[];
  guardrails: string[];
  note: string;
  allowedFigures: string[];
}

const CAPACITY_FILE = "public/chinhin-capacity-statements.json";
const SEGMENTS_FILE = "public/chinhin-segments-q2fy26.json";
const MILLION = 1_000_000;
const PERCENT = 100;

const factOf = (facts: readonly PublicFact[], key: string): PublicFact => {
  const f = facts.find((x) => x.key === key);
  if (!f || typeof f.value !== "number") throw new Error(`Public fact ${key} is missing or not a number`);
  return f;
};

export function loadFacts(dir?: string): PublicFact[] {
  return [...loadJsonDataset(CAPACITY_FILE, PublicFactsFileSchema, dir).data.facts, ...loadJsonDataset(SEGMENTS_FILE, PublicFactsFileSchema, dir).data.facts];
}

export function buildLanding(s: SyntheticScenario, facts: readonly PublicFact[]): LandingModel {
  const fig = new Figures();
  const existing = factOf(facts, "chinhin.aac.capacity.existing_m3_year");
  const total = factOf(facts, "chinhin.aac.capacity.total_after_third_m3_year");
  const pipeline = factOf(facts, "chinhin.pipeline.total_rm_billion");
  const pbt = factOf(facts, "chinhin.seg.aac_precast.pbt.q2fy26");
  const revenue = factOf(facts, "chinhin.seg.aac_precast.revenue.q2fy26");

  const stats: PublicStat[] = [
    {
      id: "capacity",
      value: `+${fig.n(((total.value as number) / (existing.value as number) - 1) * PERCENT)}%`,
      label: `AAC capacity, ${fig.dec((existing.value as number) / MILLION)}m to ${fig.dec((total.value as number) / MILLION)}m cubic metres a year with the third plant`,
      source: fig.text(existing.sourceName),
    },
    { id: "pipeline", value: `RM${fig.dec(pipeline.value as number, 2)}b`, label: "Group pipeline: unbilled sales, construction orders and backlog", source: fig.text(pipeline.sourceName) },
    { id: "margin", value: `${fig.dec(((pbt.value as number) / (revenue.value as number)) * PERCENT)}%`, label: fig.text("AAC and precast profit before tax margin, second quarter of the 2026 financial year"), source: fig.text(pbt.sourceName) },
  ];

  const board = buildBoard(s);
  const rec = board.recommendations[0];
  const first = rec?.served[0];
  const second = rec?.moved.find((l) => l.side === "external");
  const moveTo = second?.to ? `, ${second.to}` : "";
  const story = rec
    ? {
        headline: rec.headline,
        served: rec.served,
        moved: rec.moved.filter((l) => l.side === "external" || l.valueMeaning.startsWith("extra")),
        verdict: first ? `Serve ${first.who}. Offer ${second?.who ?? "the outside order"} the next free week${moveTo}.` : "",
      }
    : null;

  const people: PersonCard[] = [
    { id: "scheduler", role: "Plant scheduler", where: "Starken plant", wants: "One view with orders already typed in", doesNotWant: "Retyping WhatsApp into Excel", href: "/board", cta: "Board, daily" },
    { id: "manager", role: "Plant manager", where: "Building materials", wants: "Margin protected, credit for serving group jobs", doesNotWant: "Being overruled from head office", href: "/huddle", cta: "Huddle brief, weekly" },
    { id: "sales", role: "Sales executive", where: "Outside contractors", wants: "A delivery date to promise today", doesNotWant: "Losing a customer silently", href: "/ask", cta: "Ask the board, drafted replies" },
    { id: "director", role: "Project director", where: "Construction", wants: "Blocks guaranteed when call-offs are early", doesNotWant: "Chasing the plant every week", href: "/calloffs", cta: "Call-off form, reserved slots" },
    { id: "finance", role: "Group finance", where: "Head office", wants: "Every decision priced and traceable", doesNotWant: "Numbers made up by AI", href: "/finance", cta: "Decision ledger, monthly" },
  ];

  return {
    title: "Plant Load Radar",
    banner: "Synthetic demo data. Every party is fictional and every figure is illustrative. This is not Chin Hin data.",
    kicker: fig.text("Chin Hin Group · Building Materials Division · Kabel YEI 3.0"),
    tagline: "When a Starken AAC plant runs short, serve the request with more ringgit at stake: a Chin Hin project's cost of delay, or an outside order's margin.",
    stats,
    story,
    people,
    steps: [
      { id: "sources", label: "Sources", text: "WhatsApp messages, photos of paper delivery orders, sales-order exports, project programmes, plant capacity." },
      { id: "intake", label: "Intake", text: "Reads text, photos and rows into order lines, with a confidence on every field." },
      { id: "matching", label: "Matching", text: "Links each line to a project or customer, removes duplicates, tags firm or likely." },
      { id: "planner", label: "Planner", text: "Finds short weeks and tests serve, move or build ahead, with the capacity and rule calculator." },
      { id: "writer", label: "Writer", text: "Drafts the huddle brief and replies. Words only." },
      { id: "person", label: "A person decides", text: "The scheduler approves, changes or sends it to the huddle. Nothing is sent or recorded before that." },
    ],
    guardrails: [
      "Numbers come only from the calculator, never from a model.",
      "Every field shows its source and a confidence.",
      "Low confidence goes to a person; it never guesses.",
      "Confirmed orders are never bumped; a request that loses is offered the next free week.",
    ],
    note: "A working prototype on synthetic and public data, built to pitch Chin Hin's Capacity and Demand Intelligence challenge. The public figures above are Chin Hin's own published numbers, with their sources; everything else is invented and labelled.",
    allowedFigures: [...new Set([...fig.all(), ...board.allowedFigures])].sort(),
  };
}
