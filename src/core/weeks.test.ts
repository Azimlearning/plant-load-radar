import { describe, expect, it } from "vitest";
import { isoWeeksInYear, weekOfDate, weekSequence, weekStart } from "./weeks";

describe("ISO weeks", () => {
  it("week 1 of 2026 starts on Monday 29 Dec 2025", () => {
    expect(weekStart("2026-W01")).toBe("2025-12-29");
  });

  it("matches the deck: 'Tue 20 Oct' falls in 2026-W43, which starts Mon 19 Oct", () => {
    expect(weekStart("2026-W43")).toBe("2026-10-19");
    expect(weekOfDate("2026-10-20")).toBe("2026-W43");
    expect(weekOfDate("2026-10-26")).toBe("2026-W44"); // 'Mon 26 Oct' in the writer example
  });

  it("knows 2026 has 53 weeks and 2025 and 2027 have 52", () => {
    expect(isoWeeksInYear(2026)).toBe(53);
    expect(isoWeeksInYear(2025)).toBe(52);
    expect(isoWeeksInYear(2027)).toBe(52);
    expect(weekStart("2026-W53")).toBe("2026-12-28");
  });

  it("assigns year-boundary dates to the right ISO year", () => {
    expect(weekOfDate("2027-01-03")).toBe("2026-W53"); // Sunday, still last week of 2026
    expect(weekOfDate("2027-01-04")).toBe("2027-W01");
    expect(weekOfDate("2025-12-29")).toBe("2026-W01");
    expect(weekOfDate("2026-01-01")).toBe("2026-W01");
  });

  it("round-trips every week of 2025 to 2027", () => {
    for (const year of [2025, 2026, 2027]) {
      for (let n = 1; n <= isoWeeksInYear(year); n++) {
        const label = `${year}-W${String(n).padStart(2, "0")}`;
        expect(weekOfDate(weekStart(label)), label).toBe(label);
      }
    }
  });

  it("builds a sequence across a 53-week year end", () => {
    expect(weekSequence("2026-W52", 4)).toEqual(["2026-W52", "2026-W53", "2027-W01", "2027-W02"]);
    expect(weekSequence("2026-W41", 3)).toEqual(["2026-W41", "2026-W42", "2026-W43"]);
  });

  it("rejects malformed or non-existent weeks", () => {
    expect(() => weekStart("2026-43")).toThrow();
    expect(() => weekStart("2027-W53")).toThrow(/no week 53/);
    expect(() => weekSequence("2026-W01", 0)).toThrow();
  });
});
