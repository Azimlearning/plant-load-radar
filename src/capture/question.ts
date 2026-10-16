// Reads a plain-words capacity question ("Can we take 800 m3 for Johor next week?") into a volume and a week.
// Rules only (ADR D-16): it extracts what the words state and says what it could not read; it never guesses a number.
// The answer itself comes from the calculator (src/core/ask.ts), never from this file.

import { addDays } from "@/core/dates";
import { weekOfDate } from "@/core/weeks";

export interface ParsedQuestion {
  volumeM3: number | null;
  /** ISO week label, or null when the words do not say. */
  week: string | null;
  /** How the week was read, in plain words, so a person can check it. */
  weekHow: string;
  /** A place or customer named after "for", echoed in the answer; it takes no part in the arithmetic. */
  place: string | null;
  /** What could not be read. Empty when both volume and week were found. */
  problems: string[];
}

const MONTHS: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 };
export const MAX_QUESTION_CHARS = 300;
const DAYS_PER_WEEK = 7;
const VOLUME = /(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)\s*(?:m\s?3|m³|cu\.?\s?m|cubic\s+met(?:re|er)s?)/i;
const PLACE = /\bfor\s+((?:[A-Z][\w'-]*)(?:\s+[A-Z][\w'-]*){0,2})/;

function readWeek(text: string, asOf: string): { week: string | null; how: string } {
  const today = weekOfDate(asOf);
  const lower = text.toLowerCase();
  if (/\bnext\s+week\b/.test(lower)) return { week: weekOfDate(addDays(asOf, DAYS_PER_WEEK)), how: "\"next week\", counted from the as-of date" };
  if (/\bthis\s+week\b/.test(lower)) return { week: today, how: "\"this week\", counted from the as-of date" };
  const wk = /\b(?:week|wk)\s*(\d{1,2})\b/.exec(lower) ?? /\bw(\d{2})\b/.exec(lower);
  if (wk) {
    const n = Number(wk[1]);
    if (n >= 1 && n <= 53) return { week: `${today.slice(0, 4)}-W${String(n).padStart(2, "0")}`, how: `week ${n} of the as-of year` };
  }
  const date = /\b(\d{1,2})\s*(jan|feb|mar|apr|may|jun|jul|aug|sept?|oct|nov|dec)[a-z]*\b/.exec(lower);
  if (date) {
    const iso = `${today.slice(0, 4)}-${String(MONTHS[date[2]!]).padStart(2, "0")}-${String(Number(date[1])).padStart(2, "0")}`;
    try {
      return { week: weekOfDate(iso), how: `the week containing ${date[1]} ${date[2]}` };
    } catch {
      return { week: null, how: "" };
    }
  }
  return { week: null, how: "" };
}

export function parseQuestion(text: string, asOf: string): ParsedQuestion {
  const t = text.slice(0, MAX_QUESTION_CHARS);
  const v = VOLUME.exec(t);
  const volumeM3 = v ? Number(v[1]!.replace(/,/g, "")) : null;
  const { week, how } = readWeek(t, asOf);
  const place = PLACE.exec(t)?.[1] ?? null;
  const problems: string[] = [];
  if (volumeM3 === null || !Number.isFinite(volumeM3) || volumeM3 <= 0 || !Number.isInteger(volumeM3)) problems.push("I could not read a volume. Write it in cubic metres, for example \"800 m3\".");
  if (week === null) problems.push("I could not read a week. Say \"next week\", \"this week\", \"week 44\" or a date such as \"27 Oct\".");
  return { volumeM3: problems.some((p) => p.includes("volume")) ? null : volumeM3, week, weekHow: how, place, problems };
}
