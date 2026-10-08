// Intake -> ground -> match -> decide who must look. Four plain steps, deterministic, no writes (ADR D-16).
// The extractor is a parameter: the rules reader today, a model reader later. Grounding runs after either.

import { ground, type GroundingChange } from "./grounding";
import { DUPLICATE_WINDOW_DAYS, matchParty, orderKey, receivedMs, type KnownParty, type PartyMatch, type Relation } from "./matching";
import { detectFlags, extractWithRules } from "./rules";
import { FIELD_NAMES, type ExtractedLine, type FieldName, type InboxMessage } from "./types";

export type Extractor = (message: InboxMessage) => ExtractedLine[];

export interface ProcessedLine {
  line: ExtractedLine;
  grounding: GroundingChange[];
  party: PartyMatch;
  relatesTo: Relation | null;
  /** Reasons a person must look, in plain words. Empty means nothing stands in the way of the board's confirmed list. */
  reasons: string[];
  needsPerson: boolean;
}

export interface ProcessedMessage {
  message: InboxMessage;
  flags: string[];
  lines: ProcessedLine[];
  /** True when the message held no order (chatter). */
  ignored: boolean;
  needsPerson: boolean;
}

export interface InboxResult {
  messages: ProcessedMessage[];
  counts: { messages: number; lines: number; needsPerson: number; duplicates: number; ignored: number };
}

const DAY_MS = 86_400_000;
const LABEL: Record<FieldName, string> = { customer: "customer", product: "product", volumeM3: "volume", neededBy: "needed-by date", reference: "reference" };

export function processInbox(messages: InboxMessage[], known: KnownParty[], extract: Extractor = extractWithRules): InboxResult {
  const ordered = [...messages].sort((a, b) => receivedMs(a) - receivedMs(b) || a.id.localeCompare(b.id));
  const seen: { key: string; messageId: string; at: number; reference: string | null }[] = [];
  const processed = new Map<string, ProcessedMessage>();

  for (const message of ordered) {
    const flags = detectFlags(message.text);
    const lines: ProcessedLine[] = extract(message).map((raw) => {
      const { line, changes } = ground(message, raw);
      const party = matchParty(line.customer.value, known);
      const key = orderKey(line, party.chosen);
      const at = receivedMs(message);
      const earlier = key ? seen.find((s) => s.key === key && s.messageId !== message.id && at - s.at <= DUPLICATE_WINDOW_DAYS * DAY_MS) : undefined;
      let relatesTo: Relation | null = null;
      if (earlier) relatesTo = { id: earlier.messageId, kind: earlier.reference === null && line.reference.value !== null ? "confirms" : "duplicate" };
      if (key) seen.push({ key, messageId: message.id, at, reference: line.reference.value });

      const reasons: string[] = [];
      for (const name of FIELD_NAMES) {
        if (name === "reference") continue; // a missing reference is a tier cue, not a defect
        const f = line[name];
        if (f.confidence !== "confirmed") reasons.push(`${LABEL[name]}: ${f.confidence}${f.reason ? ` (${f.reason})` : ""}`);
      }
      if (party.confidence !== "confirmed") reasons.push(`party: ${party.reason}`);
      if (line.tier !== "firm") reasons.push(`${line.tier}: ${line.tierReason}`);
      if (relatesTo) reasons.push(relatesTo.kind === "duplicate" ? "repeat of an earlier message" : "confirms an earlier message");
      if (flags.length > 0) reasons.push("message contains instructions aimed at the reader; ignored");
      return { line, grounding: changes, party, relatesTo, reasons, needsPerson: reasons.length > 0 };
    });
    processed.set(message.id, { message, flags, lines, ignored: lines.length === 0, needsPerson: lines.some((l) => l.needsPerson) });
  }

  const result = messages.map((m) => processed.get(m.id)!);
  const all = result.flatMap((m) => m.lines);
  return {
    messages: result,
    counts: {
      messages: result.length,
      lines: all.length,
      needsPerson: all.filter((l) => l.needsPerson).length,
      duplicates: all.filter((l) => l.relatesTo?.kind === "duplicate").length,
      ignored: result.filter((m) => m.ignored).length,
    },
  };
}
