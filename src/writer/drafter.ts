// The writer: drafts the weekly huddle brief and the reply to a customer whose order moves. Words only.
// It receives strings that were already formatted (and recorded) by the calculator's view-model, so it cannot
// introduce a figure of its own (hard constraint 1). Today it is a template; a language model can replace it
// behind the same `Drafter` type once a key exists (ADR D-17, D-18). Nothing here sends anything.

import type { Line, RecommendationView } from "@/data/board";

export interface ReplyDraft {
  /** Who the reply is for, as named in the scenario. */
  to: string;
  text: string;
}

export interface Drafts {
  brief: string;
  replies: ReplyDraft[];
}

export type Drafter = (plant: string, rec: RecommendationView) => Drafts;

const NOT_SENT = "Draft only. Nothing has been sent; a person approves and sends it.";

const describe = (l: Line): string => `${l.who} (${l.volume})`;

/** The weekly huddle brief for the plant manager: what is short, what is recommended and why, what needs a call. */
function brief(plant: string, rec: RecommendationView): string {
  const served = rec.served.map((l) => `${describe(l)}: ${l.value}, ${l.valueMeaning}`).join("; ");
  const moved = rec.moved.map((l) => `${describe(l)} to ${l.to ?? "no free week"}: ${l.value}, ${l.valueMeaning}`).join("; ");
  return [
    `${plant}: huddle brief for ${rec.weekName}`,
    `${rec.headline}. ${rec.freeText}; ${rec.wantedText}.`,
    `Recommended: serve ${served}.`,
    moved ? `Move: ${moved}.` : "Nothing needs to move.",
    "Needs your call: approve the recommendation, or change which request is served first. The ringgit shown is the value at stake if a request waits one more week.",
    NOT_SENT,
  ].join("\n");
}

/** A reply to each outside customer whose order moves, offering the next free week rather than a flat no. */
function replies(rec: RecommendationView): ReplyDraft[] {
  return rec.moved
    .filter((l) => l.side === "external")
    .map((l) => ({
      to: l.who,
      text: l.to && l.to !== "no free week in this horizon"
        ? `Hi ${l.who}, thanks for your request for ${l.volume} in ${rec.weekName}. We cannot supply it that week. We can offer ${l.to} instead. Please let us know if that works for you.\n${NOT_SENT}`
        : `Hi ${l.who}, thanks for your request for ${l.volume} in ${rec.weekName}. We cannot supply it that week and have no confirmed alternative yet. We will come back to you with the next available week.\n${NOT_SENT}`,
    }));
}

export const templateDrafter: Drafter = (plant, rec) => ({ brief: brief(plant, rec), replies: replies(rec) });
