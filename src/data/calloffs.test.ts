import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { recommend, weekBalances } from "@/core/planner";
import { applyCallOffs, checkCallOff, earliestReservableWeek } from "./calloffs";
import { loadJsonDataset } from "./loaders";
import { toPlannedWeekCapacities, toPricedRequests, toWeekCapacities } from "./scenario";
import { SyntheticScenarioSchema, type CallOff } from "./schema";
import { SCENARIO_FILE } from "./synth";

const deck = loadJsonDataset("synthetic/deck-story.json", SyntheticScenarioSchema, join(process.cwd(), "data")).data;
const stress = loadJsonDataset(SCENARIO_FILE, SyntheticScenarioSchema, join(process.cwd(), "data")).data;
const ok = { projectId: "project-d", week: "2026-W46", volumeM3: "300", requestedBy: "Hakim (project director)" };
const spare = (s: typeof deck) => Object.fromEntries(weekBalances(toWeekCapacities(s), toPricedRequests(s)).map((b) => [b.week, b.spareM3]));

describe("seeded reserved slots (slide 7)", () => {
  it("count as committed volume, so the free capacity is still slide 9's", () => {
    expect(spare(deck)["2026-W45"]).toBe(2500);
    expect(spare(deck)["2026-W46"]).toBe(1000);
    expect((deck.reservations ?? []).map((r) => [r.week, r.reservedM3])).toEqual([["2026-W45", 800], ["2026-W46", 500]]);
  });
  it("a slot stops blocking capacity once its release date has passed (use it or lose it)", () => {
    const later = { ...deck, asOf: "2026-10-27" };
    expect(spare(later)["2026-W45"]).toBe(2500 + 800);
    expect(spare(later)["2026-W46"]).toBe(1000);
  });
  it("a confirmed call-off is a firm order, not also a reservation", () => {
    const confirmed = { ...deck, reservations: (deck.reservations ?? []).map((r) => ({ ...r, callOffConfirmed: r.week === "2026-W45" })) };
    expect(spare(confirmed)["2026-W45"]).toBe(2500 + 800);
  });
});

describe("a call-off", () => {
  it("earns a slot only four weeks ahead of the as-of date: week 46 here", () => {
    expect(earliestReservableWeek(deck)).toBe("2026-W46");
    expect(earliestReservableWeek(stress)).toBeNull();
  });
  it("is accepted when it is far enough ahead and fits, and then takes the volume out of the week", () => {
    const r = checkCallOff(deck, ok, [], () => new Date("2026-10-12T02:00:00Z"));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.callOff).toMatchObject({ id: "calloff-project-d-2026-W46", week: "2026-W46", volumeM3: 300 });
    const merged = applyCallOffs(deck, [r.callOff]);
    expect(spare(merged)["2026-W46"]).toBe(1000 - 300);
    expect(merged.reservations!.at(-1)!.releaseOn).toBe("2026-10-26"); // 14 days before Monday 9 Nov
  });
  it("refuses, with a code and no side effect, a nearer week, too much volume, a repeat, an unknown project and no name", () => {
    const code = (over: object, existing = []) => {
      const r = checkCallOff(deck, { ...ok, ...over }, existing);
      return r.ok ? "ok" : r.error;
    };
    expect(code({ week: "2026-W44" })).toBe("too-soon");
    expect(code({ volumeM3: "5000" })).toBe("no-room");
    expect(code({ volumeM3: "0" })).toBe("bad-volume");
    expect(code({ volumeM3: "12.5" })).toBe("bad-volume");
    expect(code({ projectId: "nobody" })).toBe("unknown-project");
    expect(code({ requestedBy: "  " })).toBe("name-required");
    expect(code({ week: "2026-W60" })).toBe("bad-week");
    const first = checkCallOff(deck, ok, []);
    if (first.ok) expect(code({}, [first.callOff] as never)).toBe("already-reserved");
    expect(checkCallOff(stress, ok, [])).toEqual({ ok: false, error: "no-policy" });
  });
  it("cannot change the week-43 decision: it only touches a week four or more weeks ahead", () => {
    const r = checkCallOff(deck, ok, []);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.callOff.week > "2026-W43").toBe(true);
  });
  it("can reserve any later week in the data, and still leaves every recommendation and the week-43 inputs untouched", () => {
    const before = recommend(toPlannedWeekCapacities(deck), toPricedRequests(deck));
    let merged = deck;
    const taken: CallOff[] = [];
    for (const week of ["2026-W46", "2026-W49", "2026-W52"]) {
      const r = checkCallOff(merged, { ...ok, week, volumeM3: "400" }, taken);
      expect(r.ok, week).toBe(true);
      if (!r.ok) return;
      taken.push(r.callOff);
      merged = applyCallOffs(deck, taken);
    }
    expect(recommend(toPlannedWeekCapacities(merged), toPricedRequests(merged))).toEqual(before);
    expect(spare(merged)["2026-W43"]).toBe(spare(deck)["2026-W43"]);
    expect(spare(merged)["2026-W52"]).toBe(spare(deck)["2026-W52"] - 400);
  });
});
