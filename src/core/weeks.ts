import { addDays, parseIsoDate } from "./dates";
import type { Week } from "./types";

// ISO 8601 weeks (Monday start; week 1 contains 4 January), computed in UTC. Labels look like "2026-W43".

const MS_PER_DAY = 86_400_000;
const DAYS_PER_WEEK = 7;
const WEEK_LABEL = /^(\d{4})-W(\d{2})$/;

function parseWeek(week: Week): { year: number; n: number } {
  const m = WEEK_LABEL.exec(week);
  if (!m) throw new Error(`Not an ISO week label (YYYY-Www): "${week}"`);
  const year = Number(m[1]);
  const n = Number(m[2]);
  if (n < 1 || n > isoWeeksInYear(year)) throw new Error(`${year} has no week ${n}`);
  return { year, n };
}

function toLabel(year: number, n: number): Week {
  return `${year}-W${String(n).padStart(2, "0")}`;
}

/** Monday of ISO week 1 of `year`, as a UTC millisecond timestamp. */
function week1Monday(year: number): number {
  const jan4 = Date.UTC(year, 0, 4);
  const dow = (new Date(jan4).getUTCDay() + 6) % 7; // 0 = Monday
  return jan4 - dow * MS_PER_DAY;
}

/** ISO week-numbering year and week of an ISO date. */
export function weekOfDate(iso: string): Week {
  const ms = parseIsoDate(iso);
  const dow = (new Date(ms).getUTCDay() + 6) % 7;
  const thursday = ms + (3 - dow) * MS_PER_DAY; // the Thursday decides the ISO year
  const year = new Date(thursday).getUTCFullYear();
  const n = Math.floor((thursday - week1Monday(year)) / (DAYS_PER_WEEK * MS_PER_DAY)) + 1;
  return toLabel(year, n);
}

/** 52 or 53. 28 December is always in the last ISO week of its year. */
export function isoWeeksInYear(year: number): number {
  return Number(weekOfDate(`${year}-12-28`).slice(-2));
}

/** The Monday (ISO date) that starts `week`. */
export function weekStart(week: Week): string {
  const { year, n } = parseWeek(week);
  return new Date(week1Monday(year) + (n - 1) * DAYS_PER_WEEK * MS_PER_DAY).toISOString().slice(0, 10);
}

/** `count` consecutive weeks starting at `start`, crossing year ends correctly. */
export function weekSequence(start: Week, count: number): Week[] {
  if (!Number.isInteger(count) || count < 1) throw new Error("count must be a positive whole number");
  const out: Week[] = [];
  let monday = weekStart(start);
  for (let i = 0; i < count; i++) {
    out.push(weekOfDate(monday));
    monday = addDays(monday, DAYS_PER_WEEK);
  }
  return out;
}
