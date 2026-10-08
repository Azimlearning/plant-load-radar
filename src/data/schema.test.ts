import { describe, expect, it } from "vitest";
import type { CustomerCard, ProjectCard } from "@/core/types";
import {
  CapacityWeekSchema,
  CustomerCardSchema,
  LedgerRowSchema,
  OrderSchema,
  ProjectCardSchema,
  WeekSchema,
  type CustomerCardRecord,
  type OrderRecord,
  type ProjectCardRecord,
} from "./schema";

// Compile-time guard: what the schemas produce must be usable by the core. If a field is added to one
// side and not the other, `npm run typecheck` fails here (schema-change invariant, preflight Q5).
const _projectOk = (x: ProjectCardRecord): ProjectCard => x;
const _customerOk = (x: CustomerCardRecord): CustomerCard => x;
void _projectOk;
void _customerOk;

// Compile-time guard: the field() helper must not widen the inferred types of extracted values.
const _fieldTypes = (o: OrderRecord) => {
  const volume: number | null = o.volumeM3.value;
  const customer: string | null = o.customer.value;
  const needed: string | null = o.neededBy.value;
  return [volume, customer, needed];
};
void _fieldTypes;

// ILLUSTRATIVE fixture based on the deck's intake example (slide 8); not a real order.
const goodOrder = {
  id: "ord-1",
  receivedAt: "2026-10-12T09:42:00Z",
  channel: "whatsapp",
  raw: "Boss, Project A site need 1,500 m3 AAC 100mm by Tue 20 Oct. Can confirm ya",
  customer: { value: "Project A", confidence: "confirmed", source: "whatsapp:msg-1#sender" },
  product: { value: "AAC block 100 mm", confidence: "confirmed", source: "whatsapp:msg-1#text" },
  volumeM3: { value: 1500, confidence: "confirmed", source: "whatsapp:msg-1#text" },
  neededBy: { value: "2026-10-20", confidence: "inferred", source: "whatsapp:msg-1#text" },
  tier: "likely",
} as const;

describe("week labels", () => {
  it("accepts ISO-style labels only", () => {
    expect(WeekSchema.safeParse("2026-W43").success).toBe(true);
    expect(WeekSchema.safeParse("2026-W53").success).toBe(true);
    expect(WeekSchema.safeParse("2026-W54").success).toBe(false);
    expect(WeekSchema.safeParse("2026-43").success).toBe(false);
    expect(WeekSchema.safeParse("W43").success).toBe(false);
  });
});

describe("OrderSchema", () => {
  it("accepts a well-formed order", () => {
    expect(OrderSchema.safeParse(goodOrder).success).toBe(true);
  });

  it("rejects an invalid tier", () => {
    expect(OrderSchema.safeParse({ ...goodOrder, tier: "maybe" }).success).toBe(false);
  });

  it("round-trips a missing field as null with 'missing' confidence", () => {
    const o = OrderSchema.parse({
      ...goodOrder,
      neededBy: { value: null, confidence: "missing", source: "whatsapp:msg-1#text" },
    });
    expect(o.neededBy).toEqual({ value: null, confidence: "missing", source: "whatsapp:msg-1#text" });
  });

  it("refuses a 'missing' field that carries a value", () => {
    const bad = { ...goodOrder, neededBy: { value: "2026-10-20", confidence: "missing", source: "x" } };
    expect(OrderSchema.safeParse(bad).success).toBe(false);
  });

  it("refuses a 'confirmed' field with no value", () => {
    const bad = { ...goodOrder, volumeM3: { value: null, confidence: "confirmed", source: "x" } };
    expect(OrderSchema.safeParse(bad).success).toBe(false);
  });

  it("refuses a non-positive volume and an impossible date", () => {
    expect(OrderSchema.safeParse({ ...goodOrder, volumeM3: { value: 0, confidence: "confirmed", source: "x" } }).success).toBe(false);
    expect(OrderSchema.safeParse({ ...goodOrder, neededBy: { value: "2026-02-31", confidence: "confirmed", source: "x" } }).success).toBe(false);
  });

  it("requires a source on every field", () => {
    expect(OrderSchema.safeParse({ ...goodOrder, customer: { value: "A", confidence: "confirmed", source: "" } }).success).toBe(false);
  });
});

describe("cards", () => {
  it("fills safe defaults for idle cost, sensitivity, key account and loss risk", () => {
    const p = ProjectCardSchema.parse({
      projectId: "p",
      purchasePriceRM: 1,
      projectedHandover: "2026-12-01",
      handoverDeadline: "2026-11-01",
      bufferDays: 0,
    });
    expect(p.idleSiteCostPerDayRM).toBe(0);
    expect(p.scheduleSensitivity).toBe(1);
    const c = CustomerCardSchema.parse({ customerId: "c", pricePerM3RM: 10, variableCostPerM3RM: 5 });
    expect(c.keyAccount).toBe(false);
    expect(c.lossRiskRM).toBe(0);
  });

  it("keeps schedule sensitivity within 0..1 and buffer days whole", () => {
    const base = { projectId: "p", purchasePriceRM: 1, projectedHandover: "2026-12-01", handoverDeadline: "2026-11-01", bufferDays: 0 };
    expect(ProjectCardSchema.safeParse({ ...base, scheduleSensitivity: 1.2 }).success).toBe(false);
    expect(ProjectCardSchema.safeParse({ ...base, bufferDays: 1.5 }).success).toBe(false);
  });
});

describe("capacity and ledger", () => {
  it("validates a capacity week", () => {
    expect(CapacityWeekSchema.safeParse({ plant: "S", product: "AAC", week: "2026-W43", capacityM3: 10 }).success).toBe(true);
    expect(CapacityWeekSchema.safeParse({ plant: "S", product: "AAC", week: "2026-W43", capacityM3: -1 }).success).toBe(false);
  });

  it("requires a named approver on a ledger row (no auto-approval) and consistent totals", () => {
    const line = { requestId: "A", partyId: "p", side: "internal", volumeM3: 10, valueRM: 100 };
    const row = {
      id: "l1",
      decidedAt: "2026-10-12T10:00:00Z",
      week: "2026-W43",
      served: [line],
      deferred: [{ ...line, requestId: "B", side: "external", valueRM: 10, movedTo: "2026-W44" }],
      servedValueRM: 100,
      deferredValueRM: 10,
      approvedBy: "scheduler-1",
      mode: "recommendation-approved",
      note: "",
    };
    expect(LedgerRowSchema.safeParse(row).success).toBe(true);
    expect(LedgerRowSchema.safeParse({ ...row, approvedBy: "" }).success).toBe(false);
    expect(LedgerRowSchema.safeParse({ ...row, approvedBy: "   " }).success).toBe(false);
    expect(LedgerRowSchema.safeParse({ ...row, servedValueRM: 999 }).success).toBe(false);
    expect(LedgerRowSchema.safeParse({ ...row, served: [] }).success).toBe(false);
  });
});
