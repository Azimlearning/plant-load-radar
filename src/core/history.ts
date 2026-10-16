// Delay cost avoided by past decisions, from a seeded demo history. Pure arithmetic over project cards: each entry says
// which project was served first and how many days of handover slip that avoided; the ringgit comes from the same
// daily late-handover rate the rule uses (ADR D-13, D-20). The history is synthetic, so the total is illustrative.

import { dailyDelayRateRM } from "./costs";
import type { ProjectCard } from "./types";

export interface HistoryEntry {
  projectId: string;
  /** Days of handover slip the decision avoided for this project. */
  daysAvoided: number;
}

export function delayAvoidedRM(entries: readonly HistoryEntry[], cards: readonly ProjectCard[]): number {
  const byId = new Map(cards.map((c) => [c.projectId, c] as const));
  return entries.reduce((total, e) => {
    const card = byId.get(e.projectId);
    if (!card) throw new Error(`History names an unknown project: ${e.projectId}`);
    if (e.daysAvoided < 0) throw new Error("daysAvoided must be >= 0");
    return total + dailyDelayRateRM(card) * e.daysAvoided;
  }, 0);
}
