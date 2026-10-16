// A Kingdee-style sales-order export (CSV) turned into the pipe-separated rows the rules reader already understands
// ("Contractor F | AAC block 100mm | 1,000 m3 | 2026-10-26 | PO F-77"). No new extractor: a structured row goes through the
// same grounding and matching as a message, so a blank cell is `missing`, never filled in. The real export layout is
// unknown; columns are matched by name, and anything else is ignored and reported.

import type { InboxMessage } from "./types";

export const CSV_MAX_ROWS = 50;
export const CSV_MAX_CHARS = 8000;

export interface CsvRead {
  rows: string[][];
  header: string[];
}

/** Minimal RFC 4180 reader: quotes, doubled quotes, commas and newlines inside quotes. */
export function parseCsv(text: string): string[][] {
  const out: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const src = text.replace(/\r\n?/g, "\n");
  for (let i = 0; i < src.length; i++) {
    const c = src[i]!;
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n") {
      row.push(cell);
      out.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    out.push(row);
  }
  return out.filter((r) => r.some((c) => c.trim() !== ""));
}

const COLUMN_ALIASES: Record<"customer" | "product" | "volume" | "date" | "reference", string[]> = {
  customer: ["customer", "customer_name", "party", "account"],
  product: ["product", "item", "description"],
  volume: ["volume_m3", "volume", "qty_m3", "quantity", "qty"],
  date: ["needed_by", "delivery_date", "required_date", "date"],
  reference: ["reference", "po", "po_number", "order_no", "call_off"],
};

const norm = (h: string): string => h.trim().toLowerCase().replace(/[\s-]+/g, "_");

export interface CsvOutcome {
  messages: InboxMessage[];
  ignoredColumns: string[];
  problems: string[];
}

/** Turn CSV text into messages for the pipeline. `receivedAt` is when the export was received. */
export function csvToMessages(text: string, receivedAt: string, sender: string): CsvOutcome {
  const problems: string[] = [];
  if (text.length > CSV_MAX_CHARS) return { messages: [], ignoredColumns: [], problems: ["That is too much text for one export. Paste a smaller one."] };
  const table = parseCsv(text);
  if (table.length < 2) return { messages: [], ignoredColumns: [], problems: ["The export needs a header row and at least one row."] };
  const header = table[0]!.map(norm);
  const indexOf = (names: string[]): number => header.findIndex((h) => names.includes(h));
  const col = { customer: indexOf(COLUMN_ALIASES.customer), product: indexOf(COLUMN_ALIASES.product), volume: indexOf(COLUMN_ALIASES.volume), date: indexOf(COLUMN_ALIASES.date), reference: indexOf(COLUMN_ALIASES.reference) };
  const used = new Set(Object.values(col).filter((i) => i >= 0));
  for (const [name, i] of Object.entries(col)) if (i < 0) problems.push(`No column for ${name}; those cells will read as missing.`);
  const ignoredColumns = header.filter((_, i) => !used.has(i));
  const body = table.slice(1, 1 + CSV_MAX_ROWS);
  if (table.length - 1 > CSV_MAX_ROWS) problems.push(`Only the first ${CSV_MAX_ROWS} rows were read.`);

  const cell = (r: string[], i: number): string => (i >= 0 ? (r[i] ?? "").replace(/[|\n]/g, " ").trim() : "");
  const messages: InboxMessage[] = body.map((r, n) => {
    const vol = cell(r, col.volume);
    const volume = vol === "" ? "" : /^[\d,.]+$/.test(vol) ? `${vol} m3` : vol;
    return {
      id: `csv-row-${n + 1}`,
      channel: "excel" as const,
      receivedAt,
      sender,
      text: [cell(r, col.customer), cell(r, col.product), volume, cell(r, col.date), cell(r, col.reference)].join(" | "),
    };
  });
  return { messages, ignoredColumns, problems };
}
