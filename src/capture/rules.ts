// The rules reader: a message in, order lines out. Deterministic, offline, no model.
// It is the demo's whole intake path today, and the baseline any future model reader must beat (ADR D-16, D-17).
// Rule of thumb: when the text does not say, the field is `missing`; when it says two things, `conflicting`.

import { findDate, findParties, findProduct, findReference, findVolume, receivedLocalDate, type Found } from "./normalise";
import type { ExtractedField, ExtractedLine, InboxMessage, Tier } from "./types";

const field = <T>(f: Found<T | null>): ExtractedField<T> => ({ value: f.value, confidence: f.confidence, source: f.source, reason: f.reason });

/** Phrases that try to give the reader orders. They are data, never instructions; the pipeline shows them as a flag. */
const INJECTION_RE = /ignore\s+(?:all\s+)?(?:the\s+)?(?:previous|prior|above)\s+instructions|approve\s+all\b|system\s+prompt/i;

export const detectFlags = (text: string): string[] => (INJECTION_RE.test(text) ? ["injection-attempt"] : []);

const ENQUIRY_RE = /\?|\bwhen can\b|\bboleh ke\b|\bavailable\b/i;

/** Split a message into one segment per distinct party, cutting at the separator just before the next party. */
function segments(text: string): { start: number; end: number; party: { name: string; span: { start: number; end: number } } | null }[] {
  const parties = findParties(text);
  const firsts: typeof parties = [];
  for (const p of parties) if (!firsts.some((q) => q.name.toLowerCase() === p.name.toLowerCase())) firsts.push(p);
  if (firsts.length <= 1) return [{ start: 0, end: text.length, party: firsts[0] ?? null }];
  return firsts.map((p, i) => {
    let start = 0;
    if (i > 0) {
      const prev = firsts[i - 1]!;
      const between = text.slice(prev.span.end, p.span.start);
      const sep = Math.max(between.lastIndexOf(","), between.lastIndexOf(";"), between.lastIndexOf("\n"), between.toLowerCase().lastIndexOf(" and "), between.lastIndexOf("&"));
      start = sep >= 0 ? prev.span.end + sep : p.span.start;
    }
    const next = firsts[i + 1];
    let end = text.length;
    if (next) {
      const between = text.slice(p.span.end, next.span.start);
      const sep = Math.max(between.lastIndexOf(","), between.lastIndexOf(";"), between.lastIndexOf("\n"), between.toLowerCase().lastIndexOf(" and "), between.lastIndexOf("&"));
      end = sep >= 0 ? p.span.end + sep : next.span.start;
    }
    return { start, end, party: p };
  });
}

export function tierFor(line: Pick<ExtractedLine, "reference" | "customer" | "product" | "volumeM3" | "neededBy">, text: string): { tier: Tier; reason: string } {
  if (line.reference.value) return { tier: "firm", reason: "PO or call-off number given" };
  const core = [line.customer, line.product, line.volumeM3, line.neededBy];
  if (core.some((f) => f.confidence === "missing" || f.confidence === "conflicting")) {
    return { tier: "possible", reason: ENQUIRY_RE.test(text) ? "reads as an enquiry, not an order" : "details incomplete" };
  }
  return { tier: "likely", reason: "no PO or call-off number yet" };
}

/** Read every order line in a message. A message with no order content returns no lines. */
export function extractWithRules(message: InboxMessage): ExtractedLine[] {
  const { text } = message;
  const received = receivedLocalDate(message.receivedAt);
  const lines: ExtractedLine[] = [];
  for (const seg of segments(text)) {
    const slice = text.slice(seg.start, seg.end);
    const product = findProduct(slice, seg.start);
    const volume = findVolume(slice, seg.start);
    const hasOrderContent = product.value !== null || volume.value !== null || volume.reason !== "no quantity stated";
    if (!hasOrderContent) continue;
    const date = findDate(slice, received, seg.start);
    const reference = findReference(slice, seg.start);
    const customer: Found<string | null> = seg.party
      ? { value: seg.party.name, confidence: "confirmed", source: seg.party.span, reason: "" }
      : { value: null, confidence: "missing", source: null, reason: "no customer named" };
    const body = {
      customer: field<string>(customer),
      product: field<string>(product),
      volumeM3: field<number>(volume),
      neededBy: field<string>(date),
      reference: field<string>(reference),
    };
    const { tier, reason } = tierFor(body, text);
    lines.push({ ...body, tier, tierReason: reason });
  }
  return lines;
}
