// View-model for "Ask the board". The question has one fixed shape (can we take N m3 in week W?), answered by the
// calculator. It claims no understanding of free text. Every number goes through `Figures`.

import { AskError, canTake } from "@/core/ask";
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
  note: string;
  allowedFigures: string[];
}

const MAX_VOLUME_M3 = 1_000_000; // a sanity bound on typed input, not a business figure

export function buildAsk(s: SyntheticScenario, params: { week?: string; volume?: string }): AskModel {
  const fig = new Figures();
  const weeks = toWeekCapacities(s);
  const reqs = toPricedRequests(s);
  const weekOptions = [...weeks].sort((a, b) => a.week.localeCompare(b.week)).map((w) => ({ value: w.week, label: fig.week(w.week) }));

  const base = {
    title: "Ask the board",
    banner: "Synthetic demo data. Every party is fictional and every figure is illustrative. This is not Chin Hin data.",
    intro: "Ask one kind of question: can we take a volume in a given week? The answer is worked out by the calculator from the board's own numbers. It is not a chatbot and it does not guess.",
    weekOptions,
    note: "A yes here is about capacity only. It does not price the request or decide between requests; where the answer depends on the rule, it says so.",
  };
  const asked = params.week !== undefined || params.volume !== undefined;
  if (!asked) return { ...base, form: { week: "", volume: "" }, error: null, answer: null, allowedFigures: fig.all() };

  const form = { week: params.week ?? "", volume: params.volume ?? "" };
  const volume = Number(form.volume);
  if (form.week === "" || form.volume.trim() === "" || !Number.isInteger(volume) || volume <= 0 || volume > MAX_VOLUME_M3) {
    return { ...base, form, error: "Choose a week and type a whole number of cubic metres, more than zero.", answer: null, allowedFigures: fig.all() };
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
    return { ...base, form, error: null, answer, allowedFigures: fig.all() };
  } catch (e) {
    if (e instanceof AskError) return { ...base, form, error: "That week is outside the board's horizon. Choose one from the list.", answer: null, allowedFigures: fig.all() };
    throw e;
  }
}
