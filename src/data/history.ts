// Server-side only (reads a file). The seeded demo history and what it adds up to.

import { delayAvoidedRM } from "@/core/history";
import { loadJsonDataset } from "./loaders";
import { DemoHistorySchema, type DemoHistory, type SyntheticScenario } from "./schema";

export const HISTORY_FILE = "synthetic/demo-history.json";

export function loadHistory(dir?: string): DemoHistory {
  return loadJsonDataset(HISTORY_FILE, DemoHistorySchema, dir).data;
}

export interface HistorySummary {
  count: number;
  totalRM: number;
  weeks: string[];
}

export function summariseHistory(history: DemoHistory, s: SyntheticScenario): HistorySummary {
  return { count: history.entries.filter((e) => e.daysAvoided > 0).length, totalRM: delayAvoidedRM(history.entries, s.projects), weeks: history.entries.map((e) => e.week) };
}
