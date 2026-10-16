// Pure helpers for a visitor's own demo state kept in a cookie (call-offs, the simulated outbox). Same idea as the
// ledger cookie (ADR D-19): the value is user-controlled, so every item is re-validated on read and anything bad is dropped.

import type { ZodType } from "zod";

/** Browsers keep about 4 KB per cookie; stay well inside it. */
export const MAX_VISITOR_COOKIE_CHARS = 3500;

export const encodeList = (items: readonly unknown[]): string => Buffer.from(JSON.stringify(items), "utf8").toString("base64url");

export function decodeList<T>(value: string | undefined, schema: ZodType<T>, isValid: (item: T) => boolean = () => true): T[] {
  if (!value || value.length > MAX_VISITOR_COOKIE_CHARS * 2) return [];
  let json: unknown;
  try {
    json = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
  } catch {
    return [];
  }
  if (!Array.isArray(json)) return [];
  const out: T[] = [];
  for (const item of json) {
    const parsed = schema.safeParse(item);
    if (parsed.success && isValid(parsed.data)) out.push(parsed.data);
  }
  return out;
}
