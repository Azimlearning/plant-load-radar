// The orders inbox's view-model: what the intake reader found in each message, already formatted.
// Same honesty mechanism as the board (src/data/board.ts): every number on screen goes through `Figures`.
// Numbers that were read out of a message are registered with `fig.text` (data quoted, not computed).

import { Figures, type CaptureSummary } from "./board";
import { loadJsonDataset } from "./loaders";
import { InboxFileSchema, SyntheticScenarioSchema } from "./schema";
import { SCENARIO_FILE } from "./synth";
import type { KnownParty } from "@/capture/matching";
import { receivedLocalDate } from "@/capture/normalise";
import { processInbox, type InboxResult, type ProcessedLine, type ProcessedMessage } from "@/capture/pipeline";
import type { Confidence, FieldName, InboxMessage } from "@/capture/types";

export const INBOX_FILE = "synthetic/inbox-samples.json";

const STATE: Record<Confidence, { label: string; icon: string }> = {
  confirmed: { label: "Confirmed", icon: "✓" },
  inferred: { label: "Inferred", icon: "≈" },
  missing: { label: "Missing", icon: "?" },
  conflicting: { label: "Conflicting", icon: "!" },
};
const FIELD_LABEL: Record<FieldName, string> = { customer: "Customer", product: "Product", volumeM3: "Volume", neededBy: "Needed by", reference: "PO / call-off" };
const TIER_LABEL = { firm: "Firm", likely: "Likely", possible: "Possible" } as const;

export interface Chip {
  field: string;
  value: string;
  state: Confidence;
  stateLabel: string;
  icon: string;
  /** Why it is not confirmed, in plain words. Empty when confirmed. */
  reason: string;
}
export interface Segment {
  text: string;
  /** The field this stretch of the message was read as, or null for plain text. */
  field: string | null;
}
export interface LineView {
  chips: Chip[];
  tier: string;
  tierReason: string;
  party: string;
  relation: string | null;
  reasons: string[];
  needsPerson: boolean;
}
export interface MessageView {
  key: string;
  sender: string;
  channel: string;
  /** ISO date in Malaysia time. */
  received: string;
  segments: Segment[];
  flags: string[];
  lines: LineView[];
  ignored: boolean;
  needsPerson: boolean;
}
export interface InboxModel {
  title: string;
  banner: string;
  readerNote: string;
  summary: string;
  messages: MessageView[];
  capture: CaptureSummary;
  allowedFigures: string[];
}

/** Cut the message into plain and highlighted stretches. Overlapping spans keep the earlier one. */
function segmentsOf(text: string, spans: { start: number; end: number; field: string }[]): Segment[] {
  const sorted = [...spans].sort((a, b) => a.start - b.start || b.end - a.end);
  const out: Segment[] = [];
  let at = 0;
  for (const s of sorted) {
    if (s.start < at || s.end <= s.start || s.end > text.length) continue;
    if (s.start > at) out.push({ text: text.slice(at, s.start), field: null });
    out.push({ text: text.slice(s.start, s.end), field: s.field });
    at = s.end;
  }
  if (at < text.length) out.push({ text: text.slice(at), field: null });
  return out;
}

function lineView(p: ProcessedLine, fig: Figures, names: Map<string, string>): LineView {
  const l = p.line;
  const show = (name: FieldName): string => {
    const f = l[name];
    if (f.value === null) return "—";
    if (name === "volumeM3") return fig.m3(f.value as number);
    return fig.text(String(f.value));
  };
  const chips: Chip[] = (["customer", "product", "volumeM3", "neededBy", "reference"] as const).map((name) => ({
    field: FIELD_LABEL[name],
    value: show(name),
    state: l[name].confidence,
    stateLabel: STATE[l[name].confidence].label,
    icon: STATE[l[name].confidence].icon,
    reason: fig.text(l[name].reason),
  }));
  return {
    chips,
    tier: TIER_LABEL[l.tier],
    tierReason: l.tierReason,
    party: p.party.chosen ? (names.get(p.party.chosen) ?? p.party.chosen) : p.party.reason ? fig.text(p.party.reason) : "No party",
    relation: p.relatesTo ? `${p.relatesTo.kind === "duplicate" ? "Repeat of" : "Confirms"} an earlier message` : null,
    reasons: p.reasons.map((r) => fig.text(r)),
    needsPerson: p.needsPerson,
  };
}

/** Build the screen model from a processed inbox. Pure. */
export function buildInbox(result: InboxResult, known: KnownParty[]): InboxModel {
  const fig = new Figures();
  const names = new Map(known.map((k) => [k.id, k.name] as const));
  const view = (pm: ProcessedMessage): MessageView => {
    const spans = pm.lines.flatMap((p) =>
      (["customer", "product", "volumeM3", "neededBy", "reference"] as const).flatMap((name) => {
        const src = p.line[name].source;
        return src ? [{ ...src, field: FIELD_LABEL[name] }] : [];
      }),
    );
    fig.text(pm.message.text);
    return {
      key: pm.message.id,
      sender: pm.message.sender,
      channel: pm.message.channel === "whatsapp" ? "WhatsApp" : "Excel",
      received: receivedLocalDate(pm.message.receivedAt),
      segments: segmentsOf(pm.message.text, spans),
      flags: pm.flags.map(() => "Contains instructions aimed at the reader. They were ignored."),
      lines: pm.lines.map((p) => lineView(p, fig, names)),
      ignored: pm.ignored,
      needsPerson: pm.needsPerson,
    };
  };
  const all = result.messages.map(view);
  // Messages that need a person come first; reading order is kept within each group.
  const messages = [...all.filter((m) => m.needsPerson), ...all.filter((m) => !m.needsPerson)];
  const c = result.counts;
  return {
    title: "Orders inbox",
    banner: "Synthetic demo data. These messages were invented for the demo; every party is fictional. This is not Chin Hin data.",
    readerNote:
      "Read by a rules-based reader, not an AI model. It marks a value Confirmed only when the words are in the message; anything else is Inferred, Missing or Conflicting, and a person checks it. Nothing here is sent or saved.",
    summary: `${fig.n(c.messages)} messages · ${fig.n(c.lines)} order lines · ${fig.n(c.needsPerson)} need a person · ${fig.n(c.ignored)} had no order in them`,
    messages,
    capture: { needsPerson: c.needsPerson, lines: c.lines },
    allowedFigures: fig.all(),
  };
}

/** Server-side: read the committed samples and scenario through the manifest-enforcing loader and run the pipeline. */
export function loadCapture(): { result: InboxResult; known: KnownParty[] } {
  const file = loadJsonDataset(INBOX_FILE, InboxFileSchema).data;
  const scenario = loadJsonDataset(SCENARIO_FILE, SyntheticScenarioSchema).data;
  const known: KnownParty[] = [
    ...scenario.projects.map((p) => ({ id: p.projectId, name: p.name })),
    ...scenario.customers.map((c) => ({ id: c.customerId, name: c.name })),
  ];
  const messages: InboxMessage[] = file.messages.map(({ id, channel, receivedAt, sender, text }) => ({ id, channel, receivedAt, sender, text }));
  return { result: processInbox(messages, known), known };
}
