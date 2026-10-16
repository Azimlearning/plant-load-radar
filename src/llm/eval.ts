// The evaluation of a reader against the hand-written gold readings of the 22 sample messages (data/synthetic/inbox-samples.json).
// Pure: it takes a reader (any function from a message to lines) and returns numbers, so it can be tested with a fake.
// Honest limits: the gold was written by the same author as the rules reader and the samples are invented, so the result
// shows behaviour on these cases, not accuracy on real messages (ADR D-16).

import { processInbox } from "@/capture/pipeline";
import type { KnownParty } from "@/capture/matching";
import type { ExtractedLine, FieldName, InboxMessage } from "@/capture/types";
import type { InboxMessageRecord } from "@/data/schema";

const FIELDS = ["customer", "product", "volumeM3", "neededBy", "reference"] as const satisfies readonly FieldName[];

export interface FieldScore {
  field: FieldName;
  /** Gold has a value (confirmed or inferred) and the reader got the same value. */
  right: number;
  /** Gold has a value and the reader got another one or none. */
  wrong: number;
  /** Gold says missing or conflicting and the reader returned a value as confirmed after grounding: an invention that got through. */
  inventedConfirmed: number;
  /** Gold says missing or conflicting and the reader left it empty or unsure: correct restraint. */
  restrained: number;
}

export interface EvalReport {
  reader: string;
  messages: number;
  /** Messages where the number of lines matches the gold. */
  lineCountAgrees: number;
  fields: FieldScore[];
  /** Lines the reader left needing a person that gold also says need a person, and the reverse. */
  needsPersonAgrees: number;
  needsPersonTotal: number;
  /** Model values the grounding step had to demote (the reader said confirmed, the text did not support it). */
  groundingDemotions: number;
}

export type Reader = (message: InboxMessage) => Promise<ExtractedLine[]> | ExtractedLine[];

export async function evaluate(name: string, reader: Reader, samples: readonly InboxMessageRecord[], known: KnownParty[]): Promise<EvalReport> {
  const messages: InboxMessage[] = samples.map(({ id, channel, receivedAt, sender, text }) => ({ id, channel, receivedAt, sender, text }));
  const lines = new Map<string, ExtractedLine[]>();
  for (const m of messages) lines.set(m.id, await reader(m));
  const result = processInbox(messages, known, (m) => lines.get(m.id) ?? []);

  const fields: FieldScore[] = FIELDS.map((field) => ({ field, right: 0, wrong: 0, inventedConfirmed: 0, restrained: 0 }));
  let lineCountAgrees = 0;
  let needsPersonAgrees = 0;
  let needsPersonTotal = 0;
  let groundingDemotions = 0;

  samples.forEach((sample, i) => {
    const got = result.messages[i]!;
    const gold = sample.gold.lines;
    if (got.lines.length === gold.length) lineCountAgrees += 1;
    groundingDemotions += got.lines.reduce((t, l) => t + l.grounding.length, 0);
    needsPersonTotal += 1;
    if (got.needsPerson === sample.gold.needsPerson) needsPersonAgrees += 1;
    gold.forEach((g, k) => {
      const l = got.lines[k]?.line;
      FIELDS.forEach((name, fi) => {
        const [goldValue, goldConf] = g[name] as [unknown, string];
        const score = fields[fi]!;
        const f = l?.[name];
        if (goldValue !== null && goldConf !== "missing" && goldConf !== "conflicting") {
          if (f && f.value === goldValue) score.right += 1;
          else score.wrong += 1;
        } else if (f && f.value !== null && f.confidence === "confirmed") score.inventedConfirmed += 1;
        else score.restrained += 1;
      });
    });
  });

  return { reader: name, messages: samples.length, lineCountAgrees, fields, needsPersonAgrees, needsPersonTotal, groundingDemotions };
}

export function reportMarkdown(r: EvalReport, extra: string[] = []): string {
  const pct = (a: number, b: number): string => (b === 0 ? "n/a" : `${Math.round((a / b) * 100)}%`);
  const rows = r.fields.map((f) => `| ${f.field} | ${f.right} | ${f.wrong} | ${pct(f.right, f.right + f.wrong)} | ${f.inventedConfirmed} | ${f.restrained} |`);
  return [
    `# Reader evaluation: ${r.reader}`,
    "",
    `On the ${r.messages} invented sample messages with hand-written gold readings. The gold shares an author with the rules reader and the messages are invented, so this shows behaviour on these cases, not accuracy on real ones.`,
    "",
    `- Messages whose number of order lines matches the gold: ${r.lineCountAgrees} of ${r.messages} (${pct(r.lineCountAgrees, r.messages)})`,
    `- Messages where "needs a person" matches the gold: ${r.needsPersonAgrees} of ${r.needsPersonTotal} (${pct(r.needsPersonAgrees, r.needsPersonTotal)})`,
    `- Values the grounding step had to demote (the reader said confirmed, the words did not support it): ${r.groundingDemotions}`,
    "",
    "| Field | Right | Wrong | Value accuracy | Invented and confirmed | Correctly left unsure |",
    "|---|---|---|---|---|---|",
    ...rows,
    "",
    "**Invented and confirmed** is the number to watch: a value the gold says is missing or conflicting that the reader still marked Confirmed after grounding. It should be zero.",
    ...extra,
    "",
  ].join("\n");
}
