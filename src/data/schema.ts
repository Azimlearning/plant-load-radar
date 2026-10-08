import * as z from "zod";

// The contract shared by every module (context 03 §10: "agree the data schema on day one").
// The deterministic core uses plain types (src/core/types.ts); schema.test.ts checks at compile time
// that the output of these schemas is assignable to them.

export const WeekSchema = z.string().regex(/^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/, 'Week must look like "2026-W43"');
export const IsoDateSchema = z.iso.date();
export const IsoDateTimeSchema = z.iso.datetime();

export const TierSchema = z.enum(["firm", "likely", "possible"]);
export const SideSchema = z.enum(["internal", "external"]);
export const ChannelSchema = z.enum(["whatsapp", "paper", "excel"]);

/** How sure the intake agent is about one extracted field (research 03: tag every field). */
export const ConfidenceSchema = z.enum(["confirmed", "inferred", "missing", "conflicting"]);

type FieldLike = { value: unknown; confidence: z.output<typeof ConfidenceSchema> };

/** Value/confidence consistency, kept non-generic so TypeScript can see `value`. */
function checkField(f: FieldLike, ctx: z.RefinementCtx): void {
  if (f.confidence === "missing" && f.value !== null) {
    ctx.addIssue({ code: "custom", path: ["value"], message: "A missing field must have a null value" });
  }
  if ((f.confidence === "confirmed" || f.confidence === "inferred") && f.value === null) {
    ctx.addIssue({ code: "custom", path: ["value"], message: `A ${f.confidence} field needs a value` });
  }
}

/**
 * One extracted field: the value, how sure we are, and where it came from.
 * A `missing` field has no value; a `confirmed` or `inferred` one must have a value.
 * `conflicting` may carry the value we are least unsure of, or null.
 */
function field<T extends z.ZodType>(value: T) {
  return z
    .object({
      value: value.nullable(),
      confidence: ConfidenceSchema,
      /** Where the value came from, e.g. "whatsapp:msg-12#text" or "paper:photo-3#line-2". */
      source: z.string().min(1),
    })
    .superRefine((f, ctx) => checkField(f as unknown as FieldLike, ctx));
}

export const CapacityWeekSchema = z.object({
  plant: z.string().min(1),
  product: z.string().min(1),
  week: WeekSchema,
  capacityM3: z.number().nonnegative(),
});

export const OrderSchema = z.object({
  id: z.string().min(1),
  receivedAt: IsoDateTimeSchema,
  channel: ChannelSchema,
  /** The original message or a description of the document, kept beside the parsed record for audit. */
  raw: z.string(),
  customer: field(z.string().min(1)),
  product: field(z.string().min(1)),
  volumeM3: field(z.number().positive()),
  neededBy: field(IsoDateSchema),
  tier: TierSchema,
});

export const ProjectCardSchema = z
  .object({
    projectId: z.string().min(1),
    purchasePriceRM: z.number().nonnegative(),
    projectedHandover: IsoDateSchema,
    handoverDeadline: IsoDateSchema,
    bufferDays: z.number().int().nonnegative(),
    idleSiteCostPerDayRM: z.number().nonnegative().default(0),
    scheduleSensitivity: z.number().min(0).max(1).default(1),
  });

export const CustomerCardSchema = z.object({
  customerId: z.string().min(1),
  pricePerM3RM: z.number().nonnegative(),
  variableCostPerM3RM: z.number().nonnegative(),
  keyAccount: z.boolean().default(false),
  lossRiskRM: z.number().nonnegative().default(0),
});

/** One approved decision, with the ringgit on each side (the ledger is append-only). */
export const LedgerRowSchema = z.object({
  id: z.string().min(1),
  decidedAt: IsoDateTimeSchema,
  week: WeekSchema,
  servedRequestId: z.string().min(1),
  deferredRequestId: z.string().min(1).nullable(),
  servedValueRM: z.number().nonnegative(),
  deferredValueRM: z.number().nonnegative(),
  /** A named person. There is no auto-approval (ADR D-04). */
  approvedBy: z.string().min(1),
  mode: z.enum(["recommendation-approved", "changed-by-scheduler"]),
  note: z.string(),
});

export type CapacityWeekRecord = z.output<typeof CapacityWeekSchema>;
export type OrderRecord = z.output<typeof OrderSchema>;
export type ProjectCardRecord = z.output<typeof ProjectCardSchema>;
export type CustomerCardRecord = z.output<typeof CustomerCardSchema>;
export type LedgerRow = z.output<typeof LedgerRowSchema>;
