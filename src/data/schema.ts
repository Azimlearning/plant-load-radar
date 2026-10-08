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

// ---- Public data files (data/public) ---------------------------------------------------------
// Two shapes: a downloaded statistical series (fetch-public-data.mjs) and a hand-curated list of
// sourced facts. Every fact names its source URL and how much to trust it.

/** government/regulator/company filing = primary; press or law-firm write-up = secondary; vendor or calculator site = low-authority. */
export const ReliabilitySchema = z.enum(["primary", "secondary", "low-authority"]);

export const PublicFactSchema = z.object({
  /** Stable dotted key, e.g. "chinhin.seg.aac_precast.revenue.2026q2". */
  key: z.string().min(1),
  label: z.string().min(1),
  value: z.union([z.number(), z.string()]),
  unit: z.string().min(1),
  /** The period the value describes, e.g. "2026-Q2", "2026-08", "as of 2026-10-08". */
  period: z.string().min(1),
  sourceName: z.string().min(1),
  sourceUrl: z.url(),
  reliability: ReliabilitySchema,
  note: z.string().optional(),
});

export const PublicFactsFileSchema = z
  .object({
    meta: z.object({
      title: z.string().min(1),
      retrieved: IsoDateSchema,
      /** What may be done with this data, in words, and the attribution required. */
      licence: z.string().min(1),
      caveats: z.array(z.string()).default([]),
    }),
    facts: z.array(PublicFactSchema).min(1),
  })
  .superRefine((f, ctx) => {
    const seen = new Set<string>();
    f.facts.forEach((fact, i) => {
      if (seen.has(fact.key)) {
        ctx.addIssue({ code: "custom", path: ["facts", i, "key"], message: `Duplicate fact key: ${fact.key}` });
      }
      seen.add(fact.key);
    });
  });

export const SeriesRowSchema = z.object({
  date: IsoDateSchema,
  code: z.string().min(1),
  series: z.enum(["abs", "growth_yoy"]),
  value: z.number(),
});

export const SeriesFileSchema = z.object({
  meta: z.object({
    dataset: z.string().min(1),
    title: z.string().min(1),
    url: z.url(),
    lookupUrl: z.url().optional(),
    retrieved: IsoDateSchema,
    rawSha256: z.string().regex(/^[0-9a-f]{64}$/),
    filter: z.string().min(1),
    units: z.string().min(1),
    codes: z.record(z.string(), z.string()),
    licence: z.string().min(1),
  }),
  rows: z.array(SeriesRowSchema).min(1),
});

export type PublicFact = z.output<typeof PublicFactSchema>;
export type PublicFactsFile = z.output<typeof PublicFactsFileSchema>;
export type SeriesFile = z.output<typeof SeriesFileSchema>;

// ---- Synthetic scenario (data/synthetic) --------------------------------------------------------
// params.json is the generator's configuration; every parameter must carry a provenance note (rule 7).
// The scenario file is the generator's output: one plant, one product, a run of weeks.

const Range = z.object({ min: z.number(), max: z.number() }).refine((r) => r.min <= r.max, "min must be <= max");
const IntRange = z.object({ min: z.number().int(), max: z.number().int() }).refine((r) => r.min <= r.max, "min must be <= max");

export const SynthParamsSchema = z.object({
  seed: z.number().int(),
  startWeek: WeekSchema,
  weekCount: z.number().int().min(4).max(52),
  plant: z.object({ id: z.string().min(1), name: z.string().min(1), product: z.string().min(1) }),
  capacity: z.object({
    availabilityFactor: z.number().gt(0).max(1),
    maxCommittedShareOfCapacity: z.number().gt(0).max(1),
    maintenance: z.array(z.object({ week: WeekSchema, capacityFactor: z.number().min(0).max(1) })),
  }),
  demand: z.object({
    baselineUtilisation: z.number().gt(0).max(1),
    weeklyNoise: z.number().min(0).max(0.5),
    internalShare: z.number().min(0).max(1),
    firmOrdersPerSidePerWeek: IntRange,
    calibrationExcludedYears: z.array(z.number().int()),
  }),
  requests: z.object({
    perWeek: IntRange,
    volumeM3: Range,
    volumeStepM3: z.number().int().positive(),
    confirmLeadDays: IntRange,
  }),
  projects: z.object({
    count: z.number().int().min(1),
    shareOfUnbilledSales: Range,
    deadlineOffsetDays: IntRange,
    projectedFloatDays: IntRange,
    bufferDays: IntRange,
    idleSiteCostPerDayRM: z.number().nonnegative(),
    scheduleSensitivity: Range,
  }),
  customers: z.object({
    count: z.number().int().min(2),
    keyAccountCount: z.number().int().nonnegative(),
    pricePerM3RM: z.number().positive(),
    priceSpread: z.number().min(0).max(0.5),
    lossRiskRMKeyAccount: z.number().nonnegative(),
  }),
  margin: z.object({ fixedCostShareOfRevenue: z.number().min(0).max(1), customerNoise: z.number().min(0).max(0.2) }),
  planner: z.object({ stockCapM3: z.number().nonnegative() }),
  story: z.object({
    week: WeekSchema,
    shortfallM3: z.number().nonnegative(),
    internalRequestM3: z.number().positive(),
    externalRequestM3: z.number().positive(),
    featuredProject: z.object({
      name: z.string().min(1),
      purchasePriceRM: z.number().positive(),
      deadlineDaysBeforeWeek: z.number().int(),
      projectedDaysAfterDeadline: z.number().int(),
      bufferDays: z.number().int().nonnegative(),
      scheduleSensitivity: z.number().min(0).max(1),
    }),
  }),
  /** One note per parameter, keyed by its dotted path. A test fails if any parameter lacks one. */
  provenance: z.record(z.string(), z.string().min(1)),
});

export const FirmOrderSchema = z.object({
  id: z.string().min(1),
  week: WeekSchema,
  side: SideSchema,
  partyId: z.string().min(1),
  volumeM3: z.number().positive(),
});

export const RequestSchema = z.object({
  id: z.string().min(1),
  week: WeekSchema,
  side: SideSchema,
  partyId: z.string().min(1),
  volumeM3: z.number().positive(),
  confirmedOn: IsoDateSchema,
});

export const SyntheticScenarioSchema = z
  .object({
    meta: z.object({
      kind: z.literal("synthetic"),
      seed: z.number().int(),
      startWeek: WeekSchema,
      weekCount: z.number().int(),
      paramsFile: z.string().min(1),
      generator: z.string().min(1),
      /** Every number derived from public data, with the key of the fact or series it came from. */
      calibration: z.record(z.string(), z.object({ value: z.number(), from: z.string().min(1) })),
      notes: z.array(z.string()),
    }),
    plant: z.object({ id: z.string().min(1), name: z.string().min(1), product: z.string().min(1) }),
    plannerSettings: z.object({ stockCapM3: z.number().nonnegative() }),
    capacity: z.array(CapacityWeekSchema).min(1),
    projects: z.array(ProjectCardSchema.extend({ name: z.string().min(1) })).min(1),
    customers: z.array(CustomerCardSchema.extend({ name: z.string().min(1) })).min(2),
    firmOrders: z.array(FirmOrderSchema),
    requests: z.array(RequestSchema),
  })
  .superRefine((s, ctx) => {
    const weeks = new Set(s.capacity.map((c) => c.week));
    const parties = new Set([...s.projects.map((p) => p.projectId), ...s.customers.map((c) => c.customerId)]);
    s.firmOrders.forEach((o, i) => {
      if (!weeks.has(o.week)) ctx.addIssue({ code: "custom", path: ["firmOrders", i, "week"], message: `Unknown week ${o.week}` });
      if (!parties.has(o.partyId)) ctx.addIssue({ code: "custom", path: ["firmOrders", i, "partyId"], message: `Unknown party ${o.partyId}` });
    });
    s.requests.forEach((r, i) => {
      if (!weeks.has(r.week)) ctx.addIssue({ code: "custom", path: ["requests", i, "week"], message: `Unknown week ${r.week}` });
      if (!parties.has(r.partyId)) ctx.addIssue({ code: "custom", path: ["requests", i, "partyId"], message: `Unknown party ${r.partyId}` });
    });
    const ids = [...s.firmOrders.map((o) => o.id), ...s.requests.map((r) => r.id)];
    if (new Set(ids).size !== ids.length) ctx.addIssue({ code: "custom", path: ["requests"], message: "Duplicate order or request id" });
    const committed = new Map<string, number>();
    s.firmOrders.forEach((o) => committed.set(o.week, (committed.get(o.week) ?? 0) + o.volumeM3));
    s.capacity.forEach((c, i) => {
      if ((committed.get(c.week) ?? 0) > c.capacityM3) {
        ctx.addIssue({ code: "custom", path: ["capacity", i], message: `Firm orders exceed capacity in ${c.week}` });
      }
    });
  });

export type SynthParams = z.output<typeof SynthParamsSchema>;
export type FirmOrder = z.output<typeof FirmOrderSchema>;
export type ScenarioRequest = z.output<typeof RequestSchema>;
export type SyntheticScenario = z.output<typeof SyntheticScenarioSchema>;
