// Server-side only. The counts beside the navigation items (slide 9: "Orders inbox (3)", "Decisions (1)"), formatted by
// the same `Figures` as everything else and computed from the same sources as the pages they point to.

import { Figures } from "@/data/board";
import { loadCapture } from "@/data/inbox";
import { recommend } from "@/core/planner";
import { toPlannedWeekCapacities, toPricedRequests } from "@/data/scenario";
import type { NavCounts } from "@/app/shell";
import { loadScenario } from "./scenario-session";
import { loadRows } from "./session";
import { outboxStore } from "./visitor";

export async function loadNavCounts(): Promise<NavCounts> {
  const scenario = await loadScenario();
  const fig = new Figures();
  const decided = new Set((await loadRows(scenario)).map((r) => r.week));
  const waiting = recommend(toPlannedWeekCapacities(scenario), toPricedRequests(scenario)).filter((r) => !decided.has(r.week)).length;
  const { result } = loadCapture();
  const sent = (await outboxStore.read()).length;
  return {
    "/inbox": fig.n(result.counts.needsPerson),
    "/decisions": fig.n(waiting),
    ...(sent > 0 ? { "/outbox": fig.n(sent) } : {}),
  };
}
