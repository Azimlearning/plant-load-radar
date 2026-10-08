/**
 * Regenerates data/synthetic/scenario.json from data/synthetic/params.json and the public data.
 *   npm run generate:synthetic
 * Deterministic: the same seed and inputs give byte-identical output.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { dataDir } from "../src/data/loaders";
import { SCENARIO_FILE, generateScenario, serializeScenario } from "../src/data/synth";

const dir = dataDir();
const scenario = generateScenario(dir);
writeFileSync(join(dir, SCENARIO_FILE), serializeScenario(scenario));
console.log(
  `wrote data/${SCENARIO_FILE}: ${scenario.capacity.length} weeks, ${scenario.projects.length} projects, ` +
    `${scenario.customers.length} customers, ${scenario.firmOrders.length} firm orders, ${scenario.requests.length} requests (seed ${scenario.meta.seed})`,
);
