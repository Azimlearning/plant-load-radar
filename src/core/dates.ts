// Whole-day date helpers on ISO "YYYY-MM-DD" strings, computed in UTC so results never
// depend on the machine's time zone or daylight saving.

const MS_PER_DAY = 86_400_000;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** UTC midnight (ms since epoch) for an ISO date. Throws on a malformed or impossible date. */
export function parseIsoDate(iso: string): number {
  const m = ISO_DATE.exec(iso);
  if (!m) throw new Error(`Not an ISO date (YYYY-MM-DD): "${iso}"`);
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const ms = Date.UTC(y, mo - 1, d);
  const back = new Date(ms);
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== mo - 1 || back.getUTCDate() !== d) {
    throw new Error(`Impossible calendar date: "${iso}"`);
  }
  return ms;
}

/** Whole days from `fromIso` to `toIso` (positive when `toIso` is later). */
export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((parseIsoDate(toIso) - parseIsoDate(fromIso)) / MS_PER_DAY);
}

/** `iso` shifted by a whole number of days. */
export function addDays(iso: string, days: number): string {
  if (!Number.isInteger(days)) throw new Error(`addDays needs a whole number, got ${days}`);
  return new Date(parseIsoDate(iso) + days * MS_PER_DAY).toISOString().slice(0, 10);
}
