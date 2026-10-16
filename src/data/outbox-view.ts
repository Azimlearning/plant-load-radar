// View-model for the simulated outbox: drafts a person approved. Nothing was sent anywhere.
// The text of a message is words approved by a named person (they may have edited it); figures in the template drafts
// came from the calculator when the draft was made. The page says so, and shows who approved each message.

import type { OutboxRow } from "./schema";

export interface OutboxMessageView {
  id: string;
  when: string;
  channel: string;
  to: string;
  text: string;
  approvedBy: string;
}

export interface OutboxModel {
  title: string;
  banner: string;
  intro: string;
  empty: string;
  messages: OutboxMessageView[];
  note: string;
}

const CHANNEL = { whatsapp: "WhatsApp (simulated)", teams: "Teams (simulated)" } as const;

export function buildOutbox(rows: readonly OutboxRow[]): OutboxModel {
  return {
    title: "Outbox",
    banner: "Synthetic demo data. Every party is fictional and every figure is illustrative. This is not Chin Hin data.",
    intro: "Messages a named person approved on the decisions page. Nothing was sent: this demo has no WhatsApp or Teams connection. In production, this is where Power Automate would hand them over.",
    empty: "Nothing is in the outbox yet. Approve and send a decision to see its messages here.",
    messages: [...rows]
      .sort((a, b) => a.sentAt.localeCompare(b.sentAt) || a.id.localeCompare(b.id))
      .map((r) => ({ id: r.id, when: r.sentAt.slice(0, 16).replace("T", " ") + " UTC", channel: CHANNEL[r.channel], to: r.to, text: r.text, approvedBy: r.approvedBy })),
    note: "The words are what the approver left in the draft. The drafts start as templates whose figures come from the calculator; if a person types a number of their own, that number is theirs, and the ledger still holds the calculator's figures.",
  };
}
