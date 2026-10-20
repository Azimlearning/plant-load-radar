// Bahasa Malaysia number words to a number: "seribu lima ratus" is 1500. Pure and deterministic. It accepts only a
// well-formed number (an optional thousands part, then hundreds, then tens and units, each group smaller than the one
// before) and returns null for anything else, rather than adding up whatever words it finds. Used by the rules reader
// only, and the value it gives is always `inferred`, because the figure was worked out from words, not quoted.

const DIGITS: Record<string, number> = { satu: 1, dua: 2, tiga: 3, empat: 4, lima: 5, enam: 6, tujuh: 7, lapan: 8, sembilan: 9 };
const SPECIAL: Record<string, number> = { sepuluh: 10, sebelas: 11, seratus: 100, seribu: 1000 };
const MULTIPLIERS = ["belas", "puluh", "ratus", "ribu"] as const;

/** Every word this parser knows, as a regex alternation (longest first, so "seratus" is not read as "se" + "ratus"). */
export const MALAY_NUMBER_WORDS: readonly string[] = [...Object.keys(SPECIAL), ...Object.keys(DIGITS), ...MULTIPLIERS].sort((a, b) => b.length - a.length);

const THOUSAND = 1000;
const HUNDRED = 100;
const TEN = 10;

/** A number below one thousand: [hundreds] then [teen | tens [units] | units], consuming every word. Empty is 0; anything else out of order is null. */
function belowThousand(words: readonly string[]): number | null {
  let i = 0;
  let value = 0;
  if (words[i] === "seratus") {
    value += HUNDRED;
    i += 1;
  } else if (words[i] !== undefined && words[i]! in DIGITS && words[i + 1] === "ratus") {
    value += DIGITS[words[i]!]! * HUNDRED;
    i += 2;
  }
  if (i === words.length) return value;

  const w = words[i]!;
  if (w === "sepuluh" || w === "sebelas") {
    value += SPECIAL[w]!;
    i += 1;
  } else if (w in DIGITS) {
    const digit = DIGITS[w]!;
    if (words[i + 1] === "belas") {
      value += TEN + digit;
      i += 2;
    } else if (words[i + 1] === "puluh") {
      value += digit * TEN;
      i += 2;
      if (words[i] !== undefined && words[i]! in DIGITS) {
        value += DIGITS[words[i]!]!;
        i += 1;
      }
    } else {
      value += digit;
      i += 1;
    }
  } else {
    return null;
  }
  return i === words.length ? value : null;
}

/** The number the words say, or null when they are empty, repeat a group, or put a word out of place. */
export function parseMalayNumber(phrase: string): number | null {
  const words = phrase.toLowerCase().split(/\s+/).filter((t) => t !== "" && t !== "dan");
  if (words.length === 0) return null;

  const seribu = words.indexOf("seribu");
  const ribu = words.indexOf("ribu");
  if (seribu !== -1) {
    if (seribu !== 0 || ribu !== -1) return null; // "seribu" opens the number, and cannot sit beside another thousands group
    const rest = belowThousand(words.slice(1));
    return rest === null ? null : THOUSAND + rest;
  }
  if (ribu !== -1) {
    if (words.indexOf("ribu", ribu + 1) !== -1) return null;
    const head = belowThousand(words.slice(0, ribu));
    const tail = belowThousand(words.slice(ribu + 1));
    if (head === null || head === 0 || tail === null) return null;
    return head * THOUSAND + tail;
  }
  const value = belowThousand(words);
  return value !== null && value > 0 ? value : null;
}
