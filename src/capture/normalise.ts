// Small pure readers for one kind of fact each. Every function returns the value AND the span of words it came from,
// or a reason it could not read one. None of them guesses: when the text does not say, they say so.

import { addDays } from "@/core/dates";
import { weekOfDate, weekSequence, weekStart } from "@/core/weeks";
import { MALAYSIA_UTC_OFFSET_HOURS, type Confidence, type Span } from "./types";

export interface Found<T> {
  value: T;
  confidence: Confidence;
  source: Span | null;
  reason: string;
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, mei: 5, jun: 6, jul: 7, aug: 8, ogos: 8, sep: 9, oct: 10, okt: 10, nov: 11, dec: 12, dis: 12,
};
const MONTH_RE = "Jan|Feb|Mar|Apr|May|Mei|Jun|Jul|Aug|Ogos|Sep|Oct|Okt|Nov|Dec|Dis";

/** Weekday names, English and Bahasa Malaysia, to 0 = Sunday ... 6 = Saturday. */
const WEEKDAYS: Record<string, number> = {
  sun: 0, ahad: 0, mon: 1, isnin: 1, tue: 2, selasa: 2, wed: 3, rabu: 3, thu: 4, khamis: 4, fri: 5, jumaat: 5, sat: 6, sabtu: 6,
};
const WD_RE = "Mon(?:day)?|Tue(?:s(?:day)?)?|Wed(?:nesday)?|Thu(?:r(?:s(?:day)?)?)?|Fri(?:day)?|Sat(?:urday)?|Sun(?:day)?|Isnin|Selasa|Rabu|Khamis|Jumaat|Sabtu|Ahad";
const wdIndex = (token: string): number => {
  const t = token.toLowerCase();
  return WEEKDAYS[t] ?? WEEKDAYS[t.slice(0, 3)]!;
};
const dayOfWeek = (iso: string): number => new Date(`${iso}T00:00:00Z`).getUTCDay();
const pad = (n: number): string => String(n).padStart(2, "0");

/** The calendar date in Malaysia (UTC+8) of an ISO UTC instant. */
export function receivedLocalDate(receivedAt: string): string {
  const shifted = new Date(new Date(receivedAt).getTime() + MALAYSIA_UTC_OFFSET_HOURS * 3_600_000);
  return shifted.toISOString().slice(0, 10);
}

// ---- customer / party -------------------------------------------------------------------------------

const PARTY_RE = /\b(?:[Pp]roject|[Pp]rojek|[Pp]roj|[Ss]ite|[Cc]ontractor|[Kk]ontraktor)\s+([A-Z][A-Za-z0-9]{0,2}(?:\/[A-Z][A-Za-z0-9]{0,2})?)\b/g;

/** Every party mention, in order, as written. */
export function findParties(text: string): { name: string; span: Span }[] {
  return [...text.matchAll(PARTY_RE)].map((m) => ({ name: m[0], span: { start: m.index!, end: m.index! + m[0].length } }));
}

// ---- product ----------------------------------------------------------------------------------------

export function findProduct(text: string, offset = 0): Found<string | null> {
  const aac = /\bAAC\b(?:\s+(block|blok|panel))?/i.exec(text);
  if (!aac) return { value: null, confidence: "missing", source: null, reason: "no product named" };
  const kind = /panel/i.test(aac[1] ?? "") ? "panel" : "block";
  const thickness = /\b(\d{2,3})\s?mm\b/i.exec(text);
  const start = aac.index + offset;
  if (!thickness) {
    return { value: `AAC ${kind}`, confidence: "inferred", source: { start, end: start + aac[0].length }, reason: "thickness not stated" };
  }
  const end = thickness.index + thickness[0].length + offset;
  return { value: `AAC ${kind} ${thickness[1]} mm`, confidence: "confirmed", source: { start, end: Math.max(end, start + aac[0].length) }, reason: "" };
}

// ---- volume -----------------------------------------------------------------------------------------

const NUM = String.raw`\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?`;
const M3 = String.raw`(?:m3|m³|m\^3|kubik|cbm|cubic(?:\s*met(?:er|re)s?)?)(?![A-Za-z0-9])`;
const OTHER_UNITS = String.raw`(pallets?|lori|lorry|lorries|trucks?|trips?|pcs|pieces?)`;
const NUMBER_WORDS = /\b(?:seribu|ribu|ratus|puluh|belas|sepuluh|dua|tiga|empat|lima|enam|tujuh|lapan|sembilan|one|two|three|four|five|six|seven|eight|nine|ten|hundred|thousand)\b[\w\s]{0,30}?\b(?:ratus|ribu|puluh|hundred|thousand|kubik|cubic)/i;

const toNumber = (s: string): number => Number(s.replace(/,/g, ""));

export function findVolume(text: string, offset = 0): Found<number | null> {
  const found = [...text.matchAll(new RegExp(`(${NUM})\\s*${M3}`, "gi"))];
  const distinct = [...new Set(found.map((m) => toNumber(m[1]!)))];
  if (distinct.length > 1) {
    return { value: null, confidence: "conflicting", source: null, reason: `two quantities in one message: ${distinct.map((v) => v.toLocaleString("en-US")).join(" and ")} m3` };
  }
  if (found.length > 0) {
    const m = found[0]!;
    return { value: toNumber(m[1]!), confidence: "confirmed", source: { start: m.index! + offset, end: m.index! + m[0].length + offset }, reason: "" };
  }
  const other = new RegExp(`(${NUM})\\s*${OTHER_UNITS}\\b`, "i").exec(text);
  if (other) {
    return { value: null, confidence: "missing", source: null, reason: `quantity is in ${other[2]!.toLowerCase()}, not m3, and the conversion is unknown` };
  }
  if (new RegExp(String.raw`\b\d+(?:\.\d+)?k\b`, "i").test(text)) {
    return { value: null, confidence: "missing", source: null, reason: "a quantity like \"1.5k\" has no unit" };
  }
  if (NUMBER_WORDS.test(text)) {
    return { value: null, confidence: "missing", source: null, reason: "quantity written in words; this reader does not read number words" };
  }
  return { value: null, confidence: "missing", source: null, reason: "no quantity stated" };
}

// ---- date -------------------------------------------------------------------------------------------

/** The first date strictly after `fromIso` that falls on `weekday`. */
export function nextOccurrence(weekday: number, fromIso: string): string {
  const delta = ((weekday - dayOfWeek(fromIso) + 6) % 7) + 1; // 1..7
  return addDays(fromIso, delta);
}

/** The given weekday in the ISO week after the one containing `fromIso`. */
export function inFollowingWeek(weekday: number, fromIso: string): string {
  const next = weekSequence(weekOfDate(fromIso), 2)[1]!;
  return addDays(weekStart(next), (weekday + 6) % 7);
}

export function findDate(text: string, receivedIso: string, offset = 0): Found<string | null> {
  const span = (m: RegExpExecArray): Span => ({ start: m.index + offset, end: m.index + m[0].length + offset });
  const found = (value: string, confidence: Confidence, m: RegExpExecArray, reason = ""): Found<string | null> => ({ value, confidence, source: span(m), reason });

  const iso = /\b(\d{4})-(\d{2})-(\d{2})\b/.exec(text);
  if (iso) return found(iso[0], "confirmed", iso);

  // "Tue 20 Oct", "20 Oct", "by 22 Oct": explicit day and month; the year is the next one that makes it a future date.
  const dm = new RegExp(`\\b(?:(${WD_RE})\\s+)?(\\d{1,2})\\s*(${MONTH_RE})[a-z]*\\b`).exec(text);
  if (dm) {
    const day = Number(dm[2]);
    const month = MONTHS[dm[3]!.toLowerCase()]!;
    const y = Number(receivedIso.slice(0, 4));
    let date = `${y}-${pad(month)}-${pad(day)}`;
    if (date < receivedIso) date = `${y + 1}-${pad(month)}-${pad(day)}`;
    if (dm[1] && dayOfWeek(date) !== wdIndex(dm[1])) {
      return { value: null, confidence: "conflicting", source: span(dm), reason: `"${dm[1]} ${day} ${dm[3]}" does not match the calendar` };
    }
    return found(date, "confirmed", dm);
  }

  // "20hb": hari bulan, the 20th of the month; the month is assumed.
  const hb = /\b(\d{1,2})\s?hb\b/i.exec(text);
  if (hb) {
    const day = Number(hb[1]);
    let y = Number(receivedIso.slice(0, 4));
    let mo = Number(receivedIso.slice(5, 7));
    if (day < Number(receivedIso.slice(8, 10))) {
      mo += 1;
      if (mo > 12) { mo = 1; y += 1; }
    }
    return found(`${y}-${pad(mo)}-${pad(day)}`, "inferred", hb, "\"hb\" means the day of the month; the month was assumed");
  }

  // "next Tue", "Isnin depan": ambiguous, so inferred with the reason shown.
  const next = new RegExp(`\\bnext\\s+(${WD_RE})\\b|\\b(${WD_RE})\\s+depan\\b`).exec(text);
  if (next) {
    const wd = wdIndex((next[1] ?? next[2])!);
    return found(inFollowingWeek(wd, receivedIso), "inferred", next, `"${next[0]}" is ambiguous; read as that day in the following week`);
  }

  const rel = /\b(tomorrow|tmr|esok|lusa|today|hari ini|hari ni)\b/i.exec(text);
  if (rel) {
    const w = rel[1]!.toLowerCase();
    const plus = w === "lusa" ? 2 : /today|hari/.test(w) ? 0 : 1;
    return found(addDays(receivedIso, plus), "inferred", rel, `"${rel[0]}" resolved from the day the message arrived`);
  }

  const bare = new RegExp(`\\b(${WD_RE})\\b`).exec(text);
  if (bare) {
    return found(nextOccurrence(wdIndex(bare[1]!), receivedIso), "inferred", bare, `"${bare[0]}" read as the next such weekday after the message`);
  }

  return { value: null, confidence: "missing", source: null, reason: "no date stated" };
}

// ---- reference (PO / DO / call-off number) ------------------------------------------------------------

export function findReference(text: string, offset = 0): Found<string | null> {
  const m = /\b(PO|DO)\s*[-#:]?\s*([A-Z]{0,2}-?\d[\w-]*)/.exec(text);
  if (!m) return { value: null, confidence: "missing", source: null, reason: "no PO or call-off number" };
  return { value: `${m[1]} ${m[2]}`, confidence: "confirmed", source: { start: m.index + offset, end: m.index + m[0].length + offset }, reason: "" };
}
