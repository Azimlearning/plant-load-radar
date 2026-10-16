import { describe, expect, it } from "vitest";
import { OutboxRowSchema } from "@/data/schema";
import { buildOutboxRows, cleanText, MAX_DRAFT_CHARS } from "./outbox";

const drafts = { brief: "Brief text", replies: [{ to: "Contractor B (fictional)", text: "Hi B, week 44?" }] };
const now = new Date("2026-10-12T02:00:00Z");

describe("the simulated outbox", () => {
  it("queues the huddle brief to the plant manager and each reply to its customer, in the order drafted", () => {
    const rows = buildOutboxRows({ week: "2026-W43", approvedBy: "Siti", now, drafts, edited: {} });
    expect(rows.map((r) => [r.channel, r.to, r.text])).toEqual([
      ["teams", "Plant manager (weekly huddle)", "Brief text"],
      ["whatsapp", "Contractor B (fictional)", "Hi B, week 44?"],
    ]);
    rows.forEach((r) => expect(OutboxRowSchema.safeParse(r).success).toBe(true));
  });
  it("a person can change the words, but never the recipient", () => {
    const rows = buildOutboxRows({ week: "2026-W43", approvedBy: "Siti", now, drafts, edited: { brief: "My brief", replies: ["Hi B, Monday works?"], to: "attacker" } as never });
    expect(rows[0]!.text).toBe("My brief");
    expect(rows[1]).toMatchObject({ to: "Contractor B (fictional)", text: "Hi B, Monday works?" });
  });
  it("blank, missing or non-text edits fall back to the template; control characters and overlong text are cleaned", () => {
    expect(cleanText("   ", "template")).toBe("template");
    expect(cleanText(42, "template")).toBe("template");
    expect(cleanText("a\u0000b\u0007c", "x")).toBe("abc");
    expect(cleanText("z".repeat(MAX_DRAFT_CHARS + 50), "x")).toHaveLength(MAX_DRAFT_CHARS);
  });
  it("carries who approved it and when", () => {
    const [row] = buildOutboxRows({ week: "2026-W43", approvedBy: "Siti", now, drafts, edited: {} });
    expect(row).toMatchObject({ approvedBy: "Siti", sentAt: "2026-10-12T02:00:00.000Z", id: "out-2026-W43-brief" });
  });
});
