// Server-side only. Where a visitor's decisions live (ADR D-18, D-19):
//  - "file":   the append-only JSON Lines file (local use and `next start`).
//  - "cookie": a per-browser cookie, re-derived on every read (hosted use, where there is no shared writable disk
//              and one judge's approval must not change what the next judge sees).
// Cookie mode is chosen by PLR_LEDGER_MODE=cookie, or automatically when running on Vercel.

import { cookies } from "next/headers";
import type { LedgerRow, SyntheticScenario } from "@/data/schema";
import { COOKIE_NAME, decodeRows, encodeRows, MAX_COOKIE_CHARS } from "./cookie-ledger";
import { recordDecision, type DecisionInput, type Outcome } from "./decide";
import { fileStore } from "./store";

export type LedgerMode = "file" | "cookie";

export function ledgerMode(): LedgerMode {
  const forced = process.env.PLR_LEDGER_MODE;
  if (forced === "cookie" || forced === "file") return forced;
  return process.env.VERCEL ? "cookie" : "file";
}

const EIGHT_HOURS_S = 8 * 60 * 60;

export async function loadRows(s: SyntheticScenario): Promise<LedgerRow[]> {
  if (ledgerMode() === "file") return fileStore().read();
  return decodeRows((await cookies()).get(COOKIE_NAME)?.value, s);
}

/** Record a decision for the current visitor. Refusals come back as codes; nothing is written on a refusal. */
export async function saveDecision(s: SyntheticScenario, input: DecisionInput): Promise<Outcome> {
  if (ledgerMode() === "file") return recordDecision(s, input, fileStore());

  const rows = await loadRows(s);
  const out = recordDecision(s, input, { read: () => rows, append: (r) => void rows.push(r) });
  if (!out.ok) return out;
  const value = encodeRows(rows);
  if (value.length > MAX_COOKIE_CHARS) return { ok: false, error: "storage-full", message: "This browser's demo ledger is full. Start the demo again." };
  (await cookies()).set(COOKIE_NAME, value, { httpOnly: true, sameSite: "lax", path: "/", maxAge: EIGHT_HOURS_S, secure: process.env.NODE_ENV === "production" });
  return out;
}

/** Clear this visitor's demo decisions. Only available in cookie mode: the file ledger is append-only. */
export async function resetDemo(): Promise<boolean> {
  if (ledgerMode() !== "cookie") return false;
  (await cookies()).delete(COOKIE_NAME);
  return true;
}
