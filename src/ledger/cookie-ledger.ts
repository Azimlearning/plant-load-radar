// The per-browser ledger used when the app is hosted (ADR D-19). Pure: no `next/*` imports, so it is unit-tested.
// A cookie holds a visitor's own decisions. It is user-controlled, so every read re-derives each row from the
// scenario and drops any row that does not match: an edited cookie cannot show a figure the calculator did not produce.

import { recommendationFor, recommendationWithChoice } from "@/core/decision";
import { toPricedRequests, toWeekCapacities } from "@/data/scenario";
import { LedgerRowSchema, type LedgerRow, type SyntheticScenario } from "@/data/schema";
import { linesOf } from "./decide";

export const COOKIE_NAME = "plr_ledger";
/** Browsers keep about 4 KB per cookie; stay well inside it. */
export const MAX_COOKIE_CHARS = 3500;

/** JSON with keys sorted, so two equal objects always compare equal as strings. */
const stable = (v: unknown): string =>
  JSON.stringify(v, (_k, x: unknown) => (x && typeof x === "object" && !Array.isArray(x) ? Object.fromEntries(Object.entries(x as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b))) : x));

/** True when the row is exactly what the calculator would have recorded for that week, mode and choice. */
export function isGenuine(s: SyntheticScenario, row: LedgerRow): boolean {
  try {
    if (row.id !== `dec-${row.week}`) return false;
    const weeks = toWeekCapacities(s);
    const reqs = toPricedRequests(s);
    const rec =
      row.mode === "recommendation-approved"
        ? recommendationFor(weeks, reqs, row.week)
        : recommendationWithChoice(weeks, reqs, row.week, row.served[0]?.requestId ?? "");
    const { served, deferred } = linesOf(s, rec);
    const sum = (ls: { valueRM: number }[]) => ls.reduce((t, l) => t + l.valueRM, 0);
    return stable(served) === stable(row.served) && stable(deferred) === stable(row.deferred) && Math.abs(sum(served) - row.servedValueRM) < 0.005 && Math.abs(sum(deferred) - row.deferredValueRM) < 0.005;
  } catch {
    return false;
  }
}

export const encodeRows = (rows: readonly LedgerRow[]): string => Buffer.from(JSON.stringify(rows), "utf8").toString("base64url");

/** Rows from a cookie value: anything malformed, invalid, tampered or duplicated for a week is dropped. */
export function decodeRows(value: string | undefined, s: SyntheticScenario): LedgerRow[] {
  if (!value || value.length > MAX_COOKIE_CHARS * 2) return [];
  let json: unknown;
  try {
    json = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
  } catch {
    return [];
  }
  if (!Array.isArray(json)) return [];
  const seen = new Set<string>();
  const rows: LedgerRow[] = [];
  for (const item of json) {
    const parsed = LedgerRowSchema.safeParse(item);
    if (!parsed.success || seen.has(parsed.data.week) || !isGenuine(s, parsed.data)) continue;
    seen.add(parsed.data.week);
    rows.push(parsed.data);
  }
  return rows;
}
