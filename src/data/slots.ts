// Reserved slots as the pages show them (slide 7, guardrail 2): seeded ones plus a visitor's own call-offs.
// Its own module so the board and the call-off page can both use it without importing each other.

import { daysBetween, formatDayShort } from "@/core/dates";
import type { Figures } from "./board";
import type { CallOff, SyntheticScenario } from "./schema";

export interface SlotView {
  project: string;
  weekName: string;
  volume: string;
  releases: string;
  status: string;
  source: string;
}

export function slotViews(s: SyntheticScenario, fig: Figures, mine: readonly CallOff[] = []): SlotView[] {
  const names = new Map(s.projects.map((p) => [p.projectId, p.name] as const));
  const mineIds = new Set(mine.map((c) => c.id));
  return [...(s.reservations ?? [])]
    .sort((a, b) => a.week.localeCompare(b.week) || a.id.localeCompare(b.id))
    .map((r) => {
      const lapsed = s.asOf !== undefined && !r.callOffConfirmed && daysBetween(r.releaseOn, s.asOf) > 0;
      return {
        project: names.get(r.projectId) ?? r.projectId,
        weekName: fig.week(r.week),
        volume: fig.m3(r.reservedM3),
        releases: fig.text(formatDayShort(r.releaseOn)),
        status: r.callOffConfirmed ? "Call-off confirmed: now a firm order" : lapsed ? "Released: no call-off in time" : "Held until the call-off is confirmed",
        source: mineIds.has(r.id) ? "Your call-off" : "Seeded for the demo",
      };
    });
}
