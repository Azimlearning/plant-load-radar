// Server-side only. The scenario this visitor sees: the committed deck story plus any call-offs they have confirmed.

import { ACTIVE_SCENARIO_FILE } from "@/data/active";
import { applyCallOffs } from "@/data/calloffs";
import { loadJsonDataset } from "@/data/loaders";
import { SyntheticScenarioSchema, type SyntheticScenario } from "@/data/schema";
import { callOffStore } from "./visitor";

export async function loadScenario(): Promise<SyntheticScenario> {
  const base = loadJsonDataset(ACTIVE_SCENARIO_FILE, SyntheticScenarioSchema).data;
  return applyCallOffs(base, await callOffStore.read());
}
