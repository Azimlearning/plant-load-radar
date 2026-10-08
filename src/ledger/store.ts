// Server-side only: uses node:fs. Never import this from a client component.
// The ledger is an append-only JSON Lines file (ADR D-18). There is deliberately no update or delete function:
// the file is only ever opened for append, and every line is validated when it is written and again when read.

import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { LedgerRowSchema, type LedgerRow } from "@/data/schema";

export const LEDGER_ENV = "PLR_LEDGER_PATH";

export class LedgerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LedgerError";
  }
}

export function ledgerPath(): string {
  return process.env[LEDGER_ENV] || join(/* turbopackIgnore: true */ process.cwd(), ".ledger", "ledger.jsonl");
}

/** Every row, oldest first. A missing file is an empty ledger; a bad line fails loudly with its line number. */
export function readLedger(path: string = ledgerPath()): LedgerRow[] {
  if (!existsSync(path)) return [];
  const rows: LedgerRow[] = [];
  readFileSync(path, "utf8")
    .split("\n")
    .forEach((line, i) => {
      if (line.trim() === "") return;
      let json: unknown;
      try {
        json = JSON.parse(line);
      } catch {
        throw new LedgerError(`Ledger line ${i + 1} is not valid JSON`);
      }
      const parsed = LedgerRowSchema.safeParse(json);
      if (!parsed.success) throw new LedgerError(`Ledger line ${i + 1} is not a valid row: ${parsed.error.issues[0]?.message ?? "unknown"}`);
      rows.push(parsed.data);
    });
  return rows;
}

/** Append one validated row. Never rewrites or truncates what is already there. */
export function appendRow(row: LedgerRow, path: string = ledgerPath()): void {
  const checked = LedgerRowSchema.parse(row);
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, `${JSON.stringify(checked)}\n`, { encoding: "utf8", flag: "a" });
}

export interface Store {
  read(): LedgerRow[];
  append(row: LedgerRow): void;
}

export const fileStore = (path: string = ledgerPath()): Store => ({ read: () => readLedger(path), append: (row) => appendRow(row, path) });
