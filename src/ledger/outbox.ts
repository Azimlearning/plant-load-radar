// The simulated outbox (slides 8 and 10): drafts a person approved. Nothing leaves the app; there is no WhatsApp or Teams
// connection (hard constraint 2: nothing is sent without a person, and this demo sends nothing at all).
// Pure: recipients come from the server's own drafts, never from the form; the form can only change the words.

import type { OutboxRow } from "@/data/schema";
import type { Drafts } from "@/writer/drafter";

export const MAX_DRAFT_CHARS = 1200;
export const BRIEF_RECIPIENT = "Plant manager (weekly huddle)";

/** Words typed by a person: control characters out, length capped, empty falls back to the template. */
export function cleanText(v: unknown, fallback: string): string {
  const t = typeof v === "string" ? v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").replace(/\r\n/g, "\n").trim() : "";
  return (t === "" ? fallback : t).slice(0, MAX_DRAFT_CHARS);
}

export function buildOutboxRows(input: { week: string; approvedBy: string; now: Date; drafts: Drafts; edited: { brief?: unknown; replies?: unknown[] } }): OutboxRow[] {
  const at = input.now.toISOString();
  const rows: OutboxRow[] = [
    { id: `out-${input.week}-brief`, sentAt: at, week: input.week, channel: "teams", to: BRIEF_RECIPIENT, text: cleanText(input.edited.brief, input.drafts.brief), approvedBy: input.approvedBy },
  ];
  input.drafts.replies.forEach((r, i) =>
    rows.push({ id: `out-${input.week}-reply-${i + 1}`, sentAt: at, week: input.week, channel: "whatsapp", to: r.to, text: cleanText(input.edited.replies?.[i], r.text), approvedBy: input.approvedBy }),
  );
  return rows;
}
