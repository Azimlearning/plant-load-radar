// Splits a pasted WhatsApp chat export into messages for the same pipeline a typed message goes through.
// Pure: no I/O, no clock. Understands the two shapes WhatsApp writes:
//   iPhone:  [12/10/2026, 9:42:15 AM] Siti (Project A site): Boss, need 1,500 m3 ...
//   Android: 12/10/2026, 9:42 am - Siti (Project A site): Boss, need 1,500 m3 ...
// A line that does not start with a timestamp continues the message before it. Lines with no "name: text" (encryption
// notice, someone joined) and "<Media omitted>" are counted and dropped, never turned into orders.

import { MALAYSIA_UTC_OFFSET_HOURS, type InboxMessage } from "./types";

export const MAX_EXPORT_CHARS = 3000;
export const MAX_EXPORT_MESSAGES = 15;

const STAMP = String.raw`(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}|\d{4}-\d{2}-\d{2}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AaPp]\.?[Mm]\.?)?)`;
const IPHONE_HEADER = new RegExp(String.raw`^\[${STAMP}\]\s*(.*)$`);
const ANDROID_HEADER = new RegExp(String.raw`^${STAMP}\s+-\s+(.*)$`);
// Left-to-right and right-to-left marks, embedding controls and the byte-order mark; WhatsApp inserts them around names.
const INVISIBLE = /[‎‏‪-‮﻿]/g;
const NARROW_SPACE = / /g;
const MEDIA_RE = /^<?(?:media omitted|image omitted|video omitted|audio omitted|sticker omitted|gif omitted|document omitted)>?$/i;
const MS_PER_HOUR = 3_600_000;
const HOURS_PER_HALF_DAY = 12;
const FIRST_CENTURY_YEAR = 2000;
const TWO_DIGIT_YEAR = 2;
const FOUR_DIGIT_YEAR = 4;
/** Years the demo will read. Anything else is more likely a typo or hostile input, and would build dates the rest of the app cannot parse. */
const MIN_YEAR = 2000;
const MAX_YEAR = 2099;
const MONTHS_PER_YEAR = 12;

/** day/month/year (the Malaysian default) or month/day/year (a US-locale phone). */
export type DateOrder = "dmy" | "mdy";

interface Header {
  date: string;
  time: string;
  rest: string;
}

const clean = (raw: string): string => raw.replace(INVISIBLE, "").replace(NARROW_SPACE, " ");

function header(line: string): Header | null {
  const m = IPHONE_HEADER.exec(line) ?? ANDROID_HEADER.exec(line);
  return m ? { date: m[1]!, time: m[2]!, rest: m[3]! } : null;
}

const numericParts = (date: string): [number, number, string] | null => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const p = date.split(/[/.-]/);
  return [Number(p[0]), Number(p[1]), p[2]!];
};

/** Malaysian local date and time to an ISO UTC instant, or null if either part is not a real date or time. */
export function exportInstant(date: string, time: string, order: DateOrder = "dmy"): string | null {
  let y: number, mo: number, d: number;
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (iso) {
    [y, mo, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  } else {
    const [first, second, year] = numericParts(date)!;
    [d, mo] = order === "dmy" ? [first, second] : [second, first];
    if (year.length !== TWO_DIGIT_YEAR && year.length !== FOUR_DIGIT_YEAR) return null;
    y = Number(year) < 100 ? Number(year) + FIRST_CENTURY_YEAR : Number(year);
  }
  if (y < MIN_YEAR || y > MAX_YEAR) return null;
  const t = /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s?([AaPp])?/.exec(time);
  if (!t) return null;
  let h = Number(t[1]);
  const min = Number(t[2]);
  const sec = Number(t[3] ?? 0);
  if (t[4]) {
    if (h < 1 || h > HOURS_PER_HALF_DAY) return null;
    h = (h % HOURS_PER_HALF_DAY) + (t[4].toLowerCase() === "p" ? HOURS_PER_HALF_DAY : 0);
  }
  if (mo < 1 || mo > MONTHS_PER_YEAR || d < 1 || d > 31 || h > 23 || min > 59 || sec > 59) return null;
  const local = Date.UTC(y, mo - 1, d, h, min, sec);
  const check = new Date(local);
  if (check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) return null; // 31 Feb and the like
  return new Date(local - MALAYSIA_UTC_OFFSET_HOURS * MS_PER_HOUR).toISOString().replace(/\.\d{3}Z$/, "Z");
}

/**
 * Settle the date order once for the whole export, so one export cannot mix the two readings. A first field above 12
 * can only be a day; a second field above 12 can only be a day in a month-first export. When no line decides, the
 * Malaysian order is assumed, and `assumed` says so.
 */
export function detectDateOrder(dates: readonly string[]): { order: DateOrder; assumed: boolean } {
  let dayFirst = false;
  let monthFirst = false;
  let ambiguous = false;
  for (const date of dates) {
    const p = numericParts(date);
    if (!p) continue;
    const [a, b] = p;
    if (a > MONTHS_PER_YEAR) dayFirst = true;
    else if (b > MONTHS_PER_YEAR) monthFirst = true;
    else if (a !== b) ambiguous = true;
  }
  if (dayFirst === monthFirst) return { order: "dmy", assumed: ambiguous && !dayFirst };
  return { order: monthFirst ? "mdy" : "dmy", assumed: false };
}

/** True when the first non-empty line starts with a WhatsApp timestamp. */
export function looksLikeWhatsAppExport(text: string): boolean {
  const first = clean(text).split(/\r?\n/).find((l) => l.trim() !== "");
  return first !== undefined && header(first.trim()) !== null;
}

export interface ExportParse {
  messages: InboxMessage[];
  /** Header lines dropped because they were system lines, media, or had an impossible date. */
  ignored: number;
  /** True when there were more messages than the cap and the rest were left out. */
  truncated: boolean;
  /** True when no line settled day/month against month/day, so day/month was assumed. */
  dateOrderAssumed: boolean;
}

export function parseWhatsAppExport(raw: string, idPrefix = "chat"): ExportParse {
  const lines = clean(raw.slice(0, MAX_EXPORT_CHARS)).split(/\r?\n/);
  const { order, assumed } = detectDateOrder(lines.flatMap((l) => header(l.trim())?.date ?? []));
  const drafts: { receivedAt: string; sender: string; text: string }[] = [];
  let ignored = 0;
  let open = false; // is the last draft still collecting continuation lines?

  for (const line of lines) {
    const h = header(line.trim());
    if (!h) {
      if (open && line.trim() !== "") drafts[drafts.length - 1]!.text += `\n${line.trim()}`;
      continue;
    }
    const at = exportInstant(h.date, h.time, order);
    const split = h.rest.indexOf(": ");
    const sender = split > 0 ? h.rest.slice(0, split).trim() : "";
    const body = split > 0 ? h.rest.slice(split + 2).trim() : "";
    if (at === null || sender === "" || body === "" || MEDIA_RE.test(body)) {
      ignored += 1;
      open = false;
      continue;
    }
    drafts.push({ receivedAt: at, sender, text: body });
    open = true;
  }

  const kept = drafts.slice(0, MAX_EXPORT_MESSAGES);
  return {
    messages: kept.map((d, i) => ({ id: `${idPrefix}-${i + 1}`, channel: "whatsapp" as const, receivedAt: d.receivedAt, sender: d.sender, text: d.text })),
    ignored,
    truncated: drafts.length > kept.length,
    dateOrderAssumed: assumed,
  };
}
