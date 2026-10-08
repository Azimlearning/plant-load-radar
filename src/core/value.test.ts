import { describe, expect, it } from "vitest";
import { dailyDelayRateRM } from "./costs";
import { totalOf, valueCase, type ValueInputs } from "./value";

// Hand-checkable inputs (round numbers, so every expected value below can be done on paper).
const inputs: ValueInputs = {
  weeklyCapacityM3: 10_000,
  variableCostPerM3RM: 200,
  marginPerM3RM: 50,
  // purchase price x yearly rate / days in the year: 36,500,000 x 10% / 365 = 10,000 a day
  delayRatePerDayRM: dailyDelayRateRM({ purchasePriceRM: 36_500_000, idleSiteCostPerDayRM: 0 } as Parameters<typeof dailyDelayRateRM>[0]),
  carryingRate: { low: 0.2, base: 0.25, high: 0.3 },
  excessStockWeeks: { low: 0.5, base: 1, high: 2 },
  shortWeeksPerYear: { low: 2, base: 4, high: 8 },
  outsideM3LostPerShortWeek: { low: 0, base: 300, high: 600 },
  delayDaysPerYear: { low: 0, base: 7, high: 14 },
};
const [stock, margin, delay] = valueCase(inputs);

describe("the business-case calculator", () => {
  it("excess stock: weekly output x weeks x cost per m3 x carrying rate, by hand", () => {
    // base: 10,000 x 1 x 200 = RM2,000,000 of stock x 25% = RM500,000
    expect(stock!.result.base).toBeCloseTo(500_000);
    expect(stock!.result.low).toBeCloseTo(200_000); // 5,000 x 200 x 20%
    expect(stock!.result.high).toBeCloseTo(1_200_000); // 20,000 x 200 x 30%
  });

  it("margin lost: short weeks x m3 lost x margin, by hand", () => {
    // base: 4 x 300 = 1,200 m3 x RM50 = RM60,000
    expect(margin!.result).toEqual({ low: 0, base: 60_000, high: 240_000 });
  });

  it("delay: days x daily late-handover rate, by hand", () => {
    expect(inputs.delayRatePerDayRM).toBeCloseTo(10_000);
    expect(delay!.result.low).toBe(0);
    expect(delay!.result.base).toBeCloseTo(70_000);
    expect(delay!.result.high).toBeCloseTo(140_000);
  });

  it("low <= base <= high everywhere, and the total is the sum of the lines", () => {
    for (const l of valueCase(inputs)) for (const s of l.steps) expect(s.band.low <= s.band.base && s.band.base <= s.band.high, `${l.id}: ${s.label}`).toBe(true);
    const t = totalOf([stock!, margin!, delay!]);
    expect(t.base).toBeCloseTo(630_000);
    expect(t.low).toBeCloseTo(200_000);
    expect(t.high).toBeCloseTo(1_580_000);
  });

  it("every line ends with its result and every step names its source", () => {
    for (const l of valueCase(inputs)) {
      expect(l.steps[l.steps.length - 1]!.band).toEqual(l.result);
      for (const s of l.steps) expect(["public", "scenario", "placeholder", "assumed", "derived"]).toContain(s.source);
    }
  });

  it("refuses a negative, non-finite or inverted input", () => {
    expect(() => valueCase({ ...inputs, weeklyCapacityM3: -1 })).toThrow();
    expect(() => valueCase({ ...inputs, variableCostPerM3RM: Number.NaN })).toThrow();
    expect(() => valueCase({ ...inputs, carryingRate: { low: 0.3, base: 0.25, high: 0.2 } })).toThrow(/low <= base <= high/);
    expect(() => valueCase({ ...inputs, shortWeeksPerYear: { low: -1, base: 4, high: 8 } })).toThrow();
  });

  it("a zero input gives a zero line, not an error", () => {
    const zero = { low: 0, base: 0, high: 0 };
    const [s, m, d] = valueCase({ ...inputs, excessStockWeeks: zero, shortWeeksPerYear: zero, delayDaysPerYear: zero });
    expect([s!.result.base, m!.result.base, d!.result.base]).toEqual([0, 0, 0]);
  });
});
