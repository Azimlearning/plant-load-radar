import { describe, expect, it } from "vitest";
import { CallOffSchema } from "@/data/schema";
import { decodeList, encodeList, MAX_VISITOR_COOKIE_CHARS } from "./visitor-codec";

const row = { id: "calloff-project-d-2026-W46", createdAt: "2026-10-12T02:00:00.000Z", projectId: "project-d", week: "2026-W46", volumeM3: 300, requestedBy: "Hakim" };

describe("a visitor's cookie list", () => {
  it("round-trips valid rows", () => {
    expect(decodeList(encodeList([row]), CallOffSchema)).toEqual([row]);
  });
  it("drops rows that fail the schema, keeps the good ones", () => {
    expect(decodeList(encodeList([row, { ...row, volumeM3: -4 }, "junk", null]), CallOffSchema)).toEqual([row]);
  });
  it("returns nothing for garbage, a non-list, an oversized value or no value", () => {
    expect(decodeList("%%%not-base64", CallOffSchema)).toEqual([]);
    expect(decodeList(Buffer.from('{"a":1}').toString("base64url"), CallOffSchema)).toEqual([]);
    expect(decodeList("a".repeat(MAX_VISITOR_COOKIE_CHARS * 2 + 1), CallOffSchema)).toEqual([]);
    expect(decodeList(undefined, CallOffSchema)).toEqual([]);
  });
  it("applies an extra validity check per row", () => {
    expect(decodeList(encodeList([row]), CallOffSchema, () => false)).toEqual([]);
  });
});
