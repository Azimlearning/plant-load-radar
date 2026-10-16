// View-model for "Ask the board". The question has one fixed shape (can we take N m3 in week W?), answered by the
// calculator. It claims no understanding of free text. Every number goes through `Figures`.

import { AskError, canTake } from "@/core/ask";
import { formatDayShort } from "@/core/dates";
import { weekBalances } from "@/core/planner";
import { weekStart } from "@/core/weeks";
import { MAX_QUESTION_CHARS, parseQuestion } from "@/capture/question";
import { Figures } from "./board";
import { toPricedRequests, toWeekCapacities } from "./scenario";
import type { SyntheticScenario } from "./schema";

export interface AskModel {
  title: string;
  banner: string;
  intro: string;
  weekOptions: { value: string; label: string }[];
  /** What the form shows again after a question, so it can be changed and re-asked. */
  form: { week: string; volume: string };
  /** A plain message when the question could not be answered (bad input). */
  error: string | null;
  answer: { tone: "yes" | "maybe" | "no"; headline: string; detail: string[] } | null;
  /** What was typed in plain words, so the box shows it again. */
  question: string;
  /** An example question for the box, and how long a question may be. */
  example: { text: string; maxChars: number };
  /** A draft reply for the sales executive, from the calculator's answer. Words only: a person sends it. */
  reply: string | null;
  note: string;
  allowedFigures: string[];
}

const MAX_VOLUME_M3 = 1_000_000; // a sanity bound on typed input, not a business figure

export function buildAsk(s: SyntheticScenario, params: { week?: string; volume?: string; q?: string }): AskModel {
  const fig = new Figures();
  const weeks = toWeekCapacities(s);
  const reqs = toPricedRequests(s);
  const weekOptions = [...weeks].sort((a, b) => a.week.localeCompare(b.week)).map((w) => ({ value: w.week, label: fig.week(w.week) }));

  const base = {
    title: "Ask the board",
    banner: "Synthetic demo data. Every party is fictional and every figure is illustrative. This is not Chin Hin data.",
    intro: "Ask one kind of question: can we take a volume in a given week? Type it in your own words or use the form. A rules reader finds the volume and the week; the calculator works out the answer from the board's own numbers. It is not a chatbot and it does not guess.",
    weekOptions,
    note: "A yes here is about capacity only. It does not price the request or decide between requests; where the answer depends on the rule, it says so.",
  };
  const none = { question: "", reply: null, example: { text: fig.text("Can we take 800 m3 for Johor next week?"), maxChars: MAX_QUESTION_CHARS } };

  // Plain words first: a rules reader turns them into a volume and a week, or says what it could not read.
  const q = (params.q ?? "").trim();
  if (q !== "") {
    if (!s.asOf) return { ...base, ...none, question: q, form: { week: "", volume: "" }, error: "This scenario has no as-of date, so \"next week\" cannot be read. Use the form.", answer: null, allowedFigures: fig.all() };
    const parsed = parseQuestion(q, s.asOf);
    if (parsed.problems.length > 0 || parsed.volumeM3 === null || parsed.week === null) {
      return { ...base, ...none, question: q, form: { week: "", volume: "" }, error: parsed.problems.join(" "), answer: null, allowedFigures: fig.all() };
    }
    if (!weeks.some((w) => w.week === parsed.week)) {
      return { ...base, ...none, question: q, form: { week: "", volume: "" }, error: "That week is outside the board's horizon. Choose one from the list.", answer: null, allowedFigures: fig.all() };
    }
    const a = canTake(weeks, reqs, parsed.week, parsed.volumeM3);
    const balances = weekBalances(weeks, reqs);
    const next = a.nextWeek ? balances.find((b) => b.week === a.nextWeek) ?? null : null;
    const shortBy = Math.max(0, a.volumeM3 - a.spareM3);
    const what = `${fig.m3(a.volumeM3)} in ${fig.week(a.week)}`;
    const place = parsed.place ? ` for ${fig.text(parsed.place)}` : "";
    const read = `Read as: ${what}${place} (${parsed.weekHow}).`;
    const facts = [`${fig.m3(a.freeM3)} free after confirmed orders`, `${fig.m3(a.requestedM3)} already requested for that week`];
    let answer: NonNullable<AskModel["answer"]>;
    let reply: string;
    if (a.verdict === "fits") {
      answer = { tone: "yes", headline: `Yes in ${fig.week(a.week)} (${fig.m3(a.spareM3)} free).`, detail: [read, ...facts] };
      reply = `Hi, yes: we can supply ${what}${place}. Shall I lock that in?`;
    } else if (next) {
      const monday = fig.text(formatDayShort(weekStart(next.week)));
      answer = {
        tone: a.verdict === "contests" ? "maybe" : "no",
        headline: `Yes in ${fig.week(next.week)} (${fig.m3(next.spareM3)} free). ${fig.week(a.week)} would go ${fig.m3(shortBy)} short.`,
        detail: [read, ...facts, a.verdict === "contests" ? "In the asked week it fits only if requests already asking for it lose, and the rule decides that by the ringgit at stake." : "In the asked week it is more than is free after confirmed orders, and confirmed orders are never bumped."],
      };
      reply = `Hi, ${fig.week(a.week)} is fully booked. We can supply ${fig.m3(a.volumeM3)}${place} from ${monday} (${fig.week(next.week)}). Shall I lock that in?`;
    } else {
      answer = { tone: "no", headline: `No week in this horizon has room for ${fig.m3(a.volumeM3)} outright. ${fig.week(a.week)} would go ${fig.m3(shortBy)} short.`, detail: [read, ...facts] };
      reply = `Hi, we cannot confirm ${what}${place} yet. We will come back to you with the next available week.`;
    }
    return { ...base, example: none.example, question: q, reply, form: { week: parsed.week, volume: String(parsed.volumeM3) }, error: null, answer, allowedFigures: fig.all() };
  }

  const asked = params.week !== undefined || params.volume !== undefined;
  if (!asked) return { ...base, ...none, form: { week: "", volume: "" }, error: null, answer: null, allowedFigures: fig.all() };

  const form = { week: params.week ?? "", volume: params.volume ?? "" };
  const volume = Number(form.volume);
  if (form.week === "" || form.volume.trim() === "" || !Number.isInteger(volume) || volume <= 0 || volume > MAX_VOLUME_M3) {
    return { ...base, ...none, form, error: "Choose a week and type a whole number of cubic metres, more than zero.", answer: null, allowedFigures: fig.all() };
  }
  try {
    const a = canTake(weeks, reqs, form.week, volume);
    const head = `${fig.m3(a.volumeM3)} in ${fig.week(a.week)}`;
    const facts = [`${fig.m3(a.freeM3)} free after confirmed orders`, `${fig.m3(a.requestedM3)} already requested for that week`];
    const next = a.nextWeek ? `The next week with room for it outright is ${fig.week(a.nextWeek)}.` : "No later week in this horizon has room for it outright.";
    let answer: NonNullable<AskModel["answer"]>;
    if (a.verdict === "fits") {
      answer = { tone: "yes", headline: `Yes: ${head} fits.`, detail: [...facts, `${fig.m3(a.spareM3)} would be spare before this request`] };
    } else if (a.verdict === "contests") {
      answer = { tone: "maybe", headline: `Only by contesting other requests: ${head}.`, detail: [...facts, "It fits only if requests already asking for that week lose, so the rule would decide by the ringgit at stake.", next] };
    } else {
      answer = { tone: "no", headline: `No: ${head} does not fit.`, detail: [...facts, "That is more than the week has free after confirmed orders, and confirmed orders are never bumped.", next] };
    }
    // Read the registry only after every figure above has been formatted.
    return { ...base, ...none, form, error: null, answer, allowedFigures: fig.all() };
  } catch (e) {
    if (e instanceof AskError) return { ...base, ...none, form, error: "That week is outside the board's horizon. Choose one from the list.", answer: null, allowedFigures: fig.all() };
    throw e;
  }
}
