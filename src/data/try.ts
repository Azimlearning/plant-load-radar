// View-model for "try it": paste a message or an export and watch it become order lines, with a trace of the four steps
// (slide 8: Intake, Matching, Planner, Writer) and the checkpoint. Nothing is saved or sent. Every figure goes through
// `Figures`; the planner step's capacity sentences come from the calculator (src/core/ask.ts), never from the reader.

import { csvToMessages } from "@/capture/csv";
import { processInbox, type Extractor, type ProcessedLine, type ProcessedMessage } from "@/capture/pipeline";
import { extractWithRules } from "@/capture/rules";
import type { InboxMessage } from "@/capture/types";
import { AskError, canTake } from "@/core/ask";
import { formatDayShort } from "@/core/dates";
import { weekOfDate, weekStart } from "@/core/weeks";
import { Figures } from "./board";
import { messageView, type MessageView } from "./inbox";
import { toPricedRequests, toWeekCapacities } from "./scenario";
import type { SyntheticScenario } from "./schema";
import type { KnownParty } from "@/capture/matching";

export const TRY_MAX_CHARS = 1500;

/** The instant the demo's messages arrive: slide 9's "Updated 9:42 AM" on the scenario's as-of date. */
export const demoReceivedAt = (s: SyntheticScenario): string => `${s.asOf ?? "2026-10-12"}${DEMO_RECEIVED_UTC_TIME}`;
/** When the demo's messages arrive: slide 9's "Updated 9:42 AM", in UTC (Malaysia is UTC+8). */
const DEMO_RECEIVED_UTC_TIME = "T01:42:00Z";

export interface TraceStep {
  id: "intake" | "matching" | "planner" | "writer" | "checkpoint";
  agent: string;
  /** What did the work: a rules reader, the calculator, a template, a person. */
  tool: string;
  lines: string[];
}

export interface TryResult {
  message: MessageView;
  trace: TraceStep[];
}

export interface PhotoOption {
  id: string;
  label: string;
  src: string;
}

export interface TryModel {
  title: string;
  banner: string;
  intro: string;
  form: { text: string; channel: "whatsapp" | "excel"; sample: string };
  /** An example for the box and how long a message may be. */
  example: { text: string; maxChars: number };
  samples: { id: string; label: string }[];
  csvSample: boolean;
  /** Which reader the user asked for, and one line saying whether the model reader is available (no secret in it). */
  readerChoice: "rules" | "model";
  modelNote: string;
  photos: PhotoOption[];
  /** Why a photo was or was not read, in words. */
  photoNote: string | null;
  error: string | null;
  notes: string[];
  results: TryResult[];
  readerName: string;
  note: string;
  allowedFigures: string[];
}

export interface TryParams {
  text?: string;
  channel?: string;
  sample?: string;
  csv?: string;
  reader?: string;
  photo?: string;
}

/** What the page works out before building the model: which reader ran, and any photo that was read. */
export interface TryContext {
  extract?: Extractor;
  readerName?: string;
  modelNote?: string;
  photos?: PhotoOption[];
  photoNote?: string | null;
  /** Messages made from a photo (the model's transcription), already read. */
  extraMessages?: InboxMessage[];
}

const CONF_LABEL = { customer: "customer", product: "product", volumeM3: "volume", neededBy: "needed-by date", reference: "reference" } as const;

function intakeStep(p: ProcessedLine[], reader: string, fig: Figures): TraceStep {
  if (p.length === 0) return { id: "intake", agent: "1 Intake", tool: reader, lines: ["No order in this message, so nothing is added to the board."] };
  const lines = p.map((l, i) => {
    const bad = (Object.keys(CONF_LABEL) as (keyof typeof CONF_LABEL)[]).filter((k) => k !== "reference" && l.line[k].confidence !== "confirmed");
    const detail = bad.length === 0 ? "every field confirmed from the words" : bad.map((k) => `${CONF_LABEL[k]} ${l.line[k].confidence}`).join(", ");
    return `Line ${fig.n(i + 1)}: ${detail}.`;
  });
  return { id: "intake", agent: "1 Intake", tool: reader, lines: [`Read ${fig.n(p.length)} order line${p.length === 1 ? "" : "s"}.`, ...lines] };
}

function matchingStep(p: ProcessedLine[], names: Map<string, string>, fig: Figures): TraceStep {
  const lines = p.map((l) => {
    const who = l.party.chosen ? `matched to ${names.get(l.party.chosen) ?? l.party.chosen}` : `not matched (${fig.text(l.party.reason || "no party named")})`;
    const tier = `${l.line.tier}: ${fig.text(l.line.tierReason)}`;
    const rel = l.relatesTo ? `; ${l.relatesTo.kind === "duplicate" ? "a repeat of an earlier message" : "confirms an earlier message"}` : "";
    return `${who}; ${tier}${rel}.`;
  });
  return { id: "matching", agent: "2 Matching", tool: "Project and customer list", lines: lines.length ? lines : ["Nothing to match."] };
}

function plannerStep(p: ProcessedLine[], s: SyntheticScenario, fig: Figures): TraceStep {
  const weeks = toWeekCapacities(s);
  const reqs = toPricedRequests(s);
  const lines = p.map((l) => {
    const vol = l.line.volumeM3.value;
    const by = l.line.neededBy.value;
    if (vol === null || by === null) return "Not tested: a volume and a date are both needed before capacity can be checked.";
    const week = weekOfDate(by);
    try {
      const a = canTake(weeks, reqs, week, vol);
      const monday = fig.text(formatDayShort(weekStart(week)));
      const head = `${fig.m3(vol)} for ${fig.week(week)} (from ${monday}): ${fig.m3(a.freeM3)} free after confirmed orders, ${fig.m3(a.requestedM3)} already requested.`;
      if (a.verdict === "fits") return `${head} It fits.`;
      const tail = a.nextWeek ? ` The next week with room is ${fig.week(a.nextWeek)}.` : " No later week has room outright.";
      return a.verdict === "contests" ? `${head} It fits only if requests already asking lose; the rule would decide by ringgit.${tail}` : `${head} It does not fit.${tail}`;
    } catch (e) {
      if (e instanceof AskError) return "Not tested: that date is outside the board's horizon.";
      throw e;
    }
  });
  return { id: "planner", agent: "3 Planner", tool: "Capacity and rule calculator", lines: lines.length ? lines : ["Nothing to test."] };
}

/** Words only: a question for the project planner, built from what the reader could not settle. */
export function clarificationDraft(pm: ProcessedMessage, view: MessageView, names: Map<string, string>): string | null {
  const open = pm.lines.map((l, i) => ({ l, v: view.lines[i]! })).filter((x) => x.l.needsPerson);
  if (open.length === 0) return null;
  const items = open.flatMap(({ v }) => v.chips.filter((c) => c.state !== "confirmed" && c.field !== "PO / call-off").map((c) => `${c.field.toLowerCase()} (${c.stateLabel.toLowerCase()}${c.reason ? `: ${c.reason}` : ""})`));
  const who = open.map(({ l }) => (l.party.chosen ? (names.get(l.party.chosen) ?? l.party.chosen) : (l.line.customer.value ?? "an unnamed customer")));
  const list = items.length > 0 ? items.join("; ") : "whether it is firm or still likely";
  return `Hi project planner, a message from ${pm.message.sender} about ${[...new Set(who)].join(" and ")} needs your check before it reaches the board: ${list}. Could you confirm, please? Nothing has been added until you do.`;
}

/** The messages a request asks for: a typed one, a sample, or the rows of the sample export. Pure. */
export function resolveMessages(s: SyntheticScenario, samples: InboxMessage[], params: TryParams, csvText: string): { messages: InboxMessage[]; notes: string[]; text: string; sampleId: string } {
  const receivedAt = demoReceivedAt(s);
  const channel: "whatsapp" | "excel" = params.channel === "excel" ? "excel" : "whatsapp";
  const text = (params.text ?? "").slice(0, TRY_MAX_CHARS);
  const sample = samples.find((m) => m.id === params.sample);
  if (params.csv === "sample") {
    const out = csvToMessages(csvText, receivedAt, "Kingdee export (fictional)");
    return { messages: out.messages, notes: [...out.problems, ...(out.ignoredColumns.length ? [`Columns ignored: ${out.ignoredColumns.join(", ")}.`] : [])], text, sampleId: "" };
  }
  if (sample) return { messages: [sample], notes: [], text: sample.text, sampleId: sample.id };
  if (text.trim() !== "") return { messages: [{ id: "try-1", channel, receivedAt, sender: "You (typed in)", text }], notes: [], text, sampleId: "" };
  return { messages: [], notes: [], text, sampleId: "" };
}

export function buildTry(s: SyntheticScenario, known: KnownParty[], samples: InboxMessage[], params: TryParams, csvText: string, ctx: TryContext = {}): TryModel {
  const extract = ctx.extract ?? extractWithRules;
  const readerName = ctx.readerName ?? "Rules reader";
  const fig = new Figures();
  const names = new Map(known.map((k) => [k.id, k.name] as const));
  const sampleOptions = samples.map((m) => ({ id: m.id, label: `${m.sender}: ${fig.text(m.text.length > 70 ? `${m.text.slice(0, 67)}...` : m.text)}` }));
  const base = {
    title: "Try it: one message becomes a priced decision",
    banner: "Synthetic demo data. Every party is fictional and every figure is illustrative. This is not Chin Hin data.",
    intro: "Paste a WhatsApp message, pick a sample, read the sample sales-order export, or read a photo of a paper delivery order. The reader turns it into order lines with a confidence on every field; the calculator checks capacity; a draft question goes to the project planner when anything is unsure. Nothing is saved, added to the board or sent.",
    samples: sampleOptions,
    readerName,
    readerChoice: (params.reader === "model" ? "model" : "rules") as "rules" | "model",
    modelNote: ctx.modelNote ?? "",
    photos: ctx.photos ?? [],
    photoNote: ctx.photoNote ?? null,
    example: { text: fig.text("Boss, Project A site need 1,500 m3 AAC 100mm by Tue 20 Oct. Can confirm ya"), maxChars: TRY_MAX_CHARS },
    note: "Whichever reader is used, a value is Confirmed only when its words are really in the message, the calculator does the maths, and a person decides everything that matters. A photo can never be better than Inferred.",
  };
  const resolved = resolveMessages(s, samples, params, csvText);
  const messages = [...resolved.messages, ...(ctx.extraMessages ?? [])];
  const notes = resolved.notes.map((n) => fig.text(n));
  const form = { text: resolved.text, channel: (params.channel === "excel" ? "excel" : "whatsapp") as "whatsapp" | "excel", sample: resolved.sampleId };
  if (messages.length === 0) {
    const asked = params.text !== undefined || params.csv !== undefined || params.sample !== undefined || params.photo !== undefined;
    return { ...base, form, csvSample: params.csv === "sample", error: asked ? "Nothing to read. Type or paste a message, choose a sample, read the sample export, or read a photo." : null, notes, results: [], allowedFigures: fig.all() };
  }

  const result = processInbox(messages, known, extract);
  const results: TryResult[] = result.messages.map((pm) => {
    const view = messageView(pm, fig, names);
    const draft = clarificationDraft(pm, view, names);
    const trace: TraceStep[] = ([
      intakeStep(pm.lines, readerName, fig),
      matchingStep(pm.lines, names, fig),
      plannerStep(pm.lines, s, fig),
      { id: "writer", agent: "4 Writer", tool: "Template (words only)", lines: draft ? [fig.text(draft)] : ["Nothing is unsure, so there is nothing to ask the project planner."] },
      { id: "checkpoint", agent: "Checkpoint", tool: "A person", lines: ["Nothing is added to the board, sent or recorded until a named person approves it."] },
    ] as TraceStep[]).map((t) => ({ ...t, agent: fig.text(t.agent) })); // the agents are numbered in the deck; the numbers are labels, not figures
    return { message: view, trace };
  });
  return { ...base, form, csvSample: params.csv === "sample", error: null, notes, results, allowedFigures: fig.all() };
}
