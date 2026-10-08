// The anti-hallucination check. After ANY extractor (rules today, a model later), a field may stay `confirmed`
// only if its value can be found in the message. Otherwise it is downgraded. It never raises confidence.

import { tierFor } from "./rules";
import { FIELD_NAMES, type ExtractedField, type ExtractedLine, type FieldName, type InboxMessage } from "./types";

export interface GroundingChange {
  field: FieldName;
  from: "confirmed";
  to: "inferred" | "missing";
}

const MONTH_NAMES = ["jan", "feb", "mar", "apr", "may|mei", "jun", "jul", "aug|ogos", "sep", "oct|okt", "nov", "dec|dis"];
const squash = (s: string): string => s.toLowerCase().replace(/\s+/g, "");
const escape = (s: string): string => s.replace(/[.*+?^${}()|[\]\\,]/g, "\\$&");

function foundInText(name: FieldName, value: unknown, text: string): boolean {
  switch (name) {
    case "customer":
    case "reference":
      return typeof value === "string" && value.length > 0 && squash(text).includes(squash(value));
    case "volumeM3": {
      if (typeof value !== "number") return false;
      return [String(value), value.toLocaleString("en-US")].some((f) => new RegExp(`(?<![\\d,.])${escape(f)}(?!\\d|,\\d)`).test(text));
    }
    case "neededBy": {
      if (typeof value !== "string") return false;
      if (text.includes(value)) return true;
      const [, mo, d] = value.split("-").map(Number) as [number, number, number];
      const month = MONTH_NAMES[mo - 1];
      return month ? new RegExp(`\\b0?${d}\\s*(?:${month})[a-z]*\\b|\\b0?${d}\\s?hb\\b`, "i").test(text) : false;
    }
    case "product": {
      if (typeof value !== "string") return false;
      const thickness = /(\d{2,3}) mm/.exec(value)?.[1];
      return /\baac\b/i.test(text) && (thickness ? new RegExp(`\\b${thickness}\\s?mm\\b`, "i").test(text) : true);
    }
  }
}

/** Downgrade every `confirmed` field whose value is not in the message. Returns a new line and what changed. */
export function ground(message: InboxMessage, line: ExtractedLine): { line: ExtractedLine; changes: GroundingChange[] } {
  const changes: GroundingChange[] = [];
  const next: Record<string, unknown> = { ...line };
  for (const name of FIELD_NAMES) {
    const f = line[name] as ExtractedField<unknown>;
    if (f.confidence !== "confirmed" || foundInText(name, f.value, message.text)) continue;
    const reason = "not found in the message";
    if (f.source) {
      next[name] = { ...f, confidence: "inferred", reason };
      changes.push({ field: name, from: "confirmed", to: "inferred" });
    } else {
      next[name] = { value: null, confidence: "missing", source: null, reason };
      changes.push({ field: name, from: "confirmed", to: "missing" });
    }
  }
  if (changes.length === 0) return { line, changes };
  const grounded = next as unknown as ExtractedLine;
  const { tier, reason } = tierFor(grounded, message.text);
  return { line: { ...grounded, tier, tierReason: reason }, changes };
}
