// Which store the demo state lives in (ADR D-19). Its own module so the stores can share it without importing each other.

export type LedgerMode = "file" | "cookie";

export function ledgerMode(): LedgerMode {
  const forced = process.env.PLR_LEDGER_MODE;
  if (forced === "cookie" || forced === "file") return forced;
  return process.env.VERCEL ? "cookie" : "file";
}
