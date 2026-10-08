import { describe, expect, it } from "vitest";
import { AskError, canTake } from "./ask";
import type { PricedRequest, WeekCapacity } from "./types";

// Free = capacity - committed. W1: free 1,000, 600 already asked for. W2: free 500, nothing asked. W3: free 2,000.
const weeks: WeekCapacity[] = [
  { week: "2026-W01", capacityM3: 3000, committedM3: 2000 },
  { week: "2026-W02", capacityM3: 1000, committedM3: 500 },
  { week: "2026-W03", capacityM3: 2500, committedM3: 500 },
];
const req = (id: string, week: string, volumeM3: number): PricedRequest => ({ id, side: "external", volumeM3, requestedWeek: week, confirmedOn: "2026-01-01", deferralCostRM: () => 0 });
const requests = [req("a", "2026-W01", 600)];

describe("ask the board", () => {
  it("fits: the volume is within what is left after confirmed orders and pending requests", () => {
    expect(canTake(weeks, requests, "2026-W01", 400)).toMatchObject({ verdict: "fits", freeM3: 1000, requestedM3: 600, spareM3: 400, nextWeek: null });
  });

  it("contests: it fits the free capacity only if a pending request loses, so the rule has to decide", () => {
    expect(canTake(weeks, requests, "2026-W01", 401)).toMatchObject({ verdict: "contests", spareM3: 400 });
    expect(canTake(weeks, requests, "2026-W01", 1000)).toMatchObject({ verdict: "contests" });
  });

  it("no room: more than the week has free, and the next week with room is named", () => {
    expect(canTake(weeks, requests, "2026-W01", 1001)).toMatchObject({ verdict: "no-room", nextWeek: "2026-W03" });
    expect(canTake(weeks, requests, "2026-W02", 600)).toMatchObject({ verdict: "no-room", nextWeek: "2026-W03" });
  });

  it("no room and no later week with room: says so (null), never invents a week", () => {
    expect(canTake(weeks, requests, "2026-W03", 2001)).toMatchObject({ verdict: "no-room", nextWeek: null });
  });

  it("an already-short week still answers: nothing fits outright", () => {
    const short = [req("a", "2026-W02", 900)];
    expect(canTake(weeks, short, "2026-W02", 100)).toMatchObject({ spareM3: -400, verdict: "contests" });
  });

  it("refuses a zero, negative or non-numeric volume and a week outside the horizon", () => {
    expect(() => canTake(weeks, requests, "2026-W01", 0)).toThrow(AskError);
    expect(() => canTake(weeks, requests, "2026-W01", -5)).toThrow(AskError);
    expect(() => canTake(weeks, requests, "2026-W01", Number.NaN)).toThrow(AskError);
    expect(() => canTake(weeks, requests, "2026-W09", 10)).toThrow(/outside the horizon/);
  });
});
