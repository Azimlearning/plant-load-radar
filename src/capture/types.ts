// Shared plain types for capture (P2). No zod, no I/O, no network: importable from tests, scripts and server code.
// The meaning of each confidence state is fixed here once, so the extractors, the grounding check, the matcher
// and the inbox screen cannot drift apart.

/**
 * How sure we are of one extracted value.
 *  - confirmed:   the value is stated in the message, unambiguously (it can be found in the text).
 *  - inferred:    the value was worked out from the message (a relative date, an abbreviation, a unit synonym
 *                 with no thickness, a fuzzy name) and a person should glance at it.
 *  - missing:     the message does not say. The value is null. We never fill it in.
 *  - conflicting: the message says two different things (a self-correction, two quantities). The value is null.
 */
export type Confidence = "confirmed" | "inferred" | "missing" | "conflicting";

export type Tier = "firm" | "likely" | "possible";

/** Character offsets into the message text: text.slice(start, end) is the words the value came from. */
export interface Span {
  start: number;
  end: number;
}

export interface ExtractedField<T> {
  value: T | null;
  confidence: Confidence;
  /** Where in the message the value came from, or null when there is no such place (missing/conflicting). */
  source: Span | null;
  /** Why the field is not `confirmed`, in plain words. Empty for confirmed fields. */
  reason: string;
}

/** One order line read from a message. Party names are as written; matching resolves them later. */
export interface ExtractedLine {
  customer: ExtractedField<string>;
  /** Normalised product, e.g. "AAC block 100 mm". */
  product: ExtractedField<string>;
  volumeM3: ExtractedField<number>;
  /** ISO date YYYY-MM-DD. */
  neededBy: ExtractedField<string>;
  /** A purchase order, delivery order or call-off number, e.g. "PO 4471". */
  reference: ExtractedField<string>;
  tier: Tier;
  /** Why this tier, e.g. "no PO or call-off number yet". */
  tierReason: string;
}

/** The message an extractor reads. `receivedAt` is an ISO UTC instant; dates are resolved in Malaysia time (UTC+8). */
export interface InboxMessage {
  id: string;
  channel: "whatsapp" | "excel";
  receivedAt: string;
  sender: string;
  text: string;
}

export const FIELD_NAMES = ["customer", "product", "volumeM3", "neededBy", "reference"] as const;
export type FieldName = (typeof FIELD_NAMES)[number];

/** Malaysia is UTC+8 with no daylight saving. */
export const MALAYSIA_UTC_OFFSET_HOURS = 8;
