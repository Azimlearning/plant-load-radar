import { describe, expect, it } from "vitest";
import {
  activeReservedM3,
  committedForWeek,
  isCloseCall,
  pickNext,
  planPrebuild,
  type Reservation,
} from "./fairness";

describe("close call (within ~10%)", () => {
  it("is relative to the larger value", () => {
    expect(isCloseCall(100, 90)).toBe(true); // exactly 10% of 100
    expect(isCloseCall(100, 89)).toBe(false);
    expect(isCloseCall(0, 0)).toBe(true);
  });
});

describe("pickNext", () => {
  const a = { id: "a", valueRM: 100, confirmedOn: "2026-10-05" };
  const b = { id: "b", valueRM: 95, confirmedOn: "2026-10-01" };

  it("picks the higher value when the gap is wide", () => {
    const r = pickNext([a, { ...b, valueRM: 80 }])!;
    expect(r.pick.id).toBe("a");
    expect(r.byCloseCall).toBe(false);
  });

  it("lets the first confirmed win a close call, and says so", () => {
    const r = pickNext([a, b])!;
    expect(r.pick.id).toBe("b");
    expect(r.byCloseCall).toBe(true);
  });

  it("breaks exact ties by confirmation date, then id, not by input order", () => {
    const x = { id: "x", valueRM: 50, confirmedOn: "2026-10-02" };
    const y = { id: "y", valueRM: 50, confirmedOn: "2026-10-02" };
    expect(pickNext([y, x])!.pick.id).toBe("x");
    expect(pickNext([x, y])!.pick.id).toBe("x");
  });

  it("returns null for no candidates", () => {
    expect(pickNext([])).toBeNull();
  });
});

describe("reservations (plan ahead, use it or lose it)", () => {
  const res: Reservation = {
    projectId: "p",
    week: "2026-W43",
    reservedM3: 800,
    releaseOn: "2026-10-10",
    callOffConfirmed: false,
  };

  it("blocks capacity until the release date, then frees it", () => {
    expect(activeReservedM3(res, "2026-10-10")).toBe(800);
    expect(activeReservedM3(res, "2026-10-11")).toBe(0);
  });

  it("does not double count once the call-off is confirmed (it is then a firm order)", () => {
    expect(activeReservedM3({ ...res, callOffConfirmed: true }, "2026-10-01")).toBe(0);
  });

  it("committed = firm orders + active reservations for that week only", () => {
    const firm = [
      { week: "2026-W43", volumeM3: 1_000 },
      { week: "2026-W44", volumeM3: 500 },
    ];
    expect(committedForWeek(firm, [res], "2026-W43", "2026-10-05")).toBe(1_800);
    expect(committedForWeek(firm, [res], "2026-W43", "2026-10-20")).toBe(1_000);
    expect(committedForWeek(firm, [res], "2026-W44", "2026-10-05")).toBe(500);
  });
});

describe("planPrebuild (fill the quiet weeks)", () => {
  it("covers a short week from the nearest earlier spare — the deck's week 42 / week 41 case", () => {
    const { moves, stillShort } = planPrebuild(
      [
        { week: "2026-W41", spareM3: 1_200 },
        { week: "2026-W42", spareM3: -700 },
      ],
      10_000,
    );
    expect(moves).toEqual([{ fromWeek: "2026-W41", toWeek: "2026-W42", m3: 700 }]);
    expect(stillShort).toEqual([]);
  });

  it("is limited by the stock cap and reports what is still short", () => {
    const { moves, stillShort } = planPrebuild(
      [
        { week: "2026-W41", spareM3: 1_200 },
        { week: "2026-W42", spareM3: -700 },
      ],
      500,
    );
    expect(moves).toEqual([{ fromWeek: "2026-W41", toWeek: "2026-W42", m3: 500 }]);
    expect(stillShort).toEqual([{ week: "2026-W42", spareM3: -200 }]);
  });

  it("never builds ahead for a later week using spare that comes after it", () => {
    const { moves, stillShort } = planPrebuild(
      [
        { week: "2026-W41", spareM3: -300 },
        { week: "2026-W42", spareM3: 900 },
      ],
      10_000,
    );
    expect(moves).toEqual([]);
    expect(stillShort).toEqual([{ week: "2026-W41", spareM3: -300 }]);
  });

  it("shares one stock cap across several short weeks", () => {
    const { moves } = planPrebuild(
      [
        { week: "2026-W41", spareM3: 1_000 },
        { week: "2026-W42", spareM3: -400 },
        { week: "2026-W43", spareM3: -400 },
      ],
      600,
    );
    // 400 held through W41→W42 end, then 200 more fits under the 600 cap for W43.
    const toW43 = moves.filter((m) => m.toWeek === "2026-W43").reduce((s, m) => s + m.m3, 0);
    expect(moves.filter((m) => m.toWeek === "2026-W42").reduce((s, m) => s + m.m3, 0)).toBe(400);
    expect(toW43).toBe(200);
  });
});
