/**
 * Regenerates data/synthetic/deck-story.json from data/synthetic/scenario.json and deck-story-params.json.
 *   npm run generate:deck-story
 * Deterministic. Run `npm run generate:synthetic` first if the base scenario changed.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { DECK_SCENARIO_FILE, generateDeckStory } from "../src/data/deck-story";
import { dataDir } from "../src/data/loaders";
import { serializeScenario } from "../src/data/synth";

const dir = dataDir();
const scenario = generateDeckStory(dir);
writeFileSync(join(dir, DECK_SCENARIO_FILE), serializeScenario(scenario));
console.log(
  `wrote data/${DECK_SCENARIO_FILE}: ${scenario.capacity.length} weeks, ${scenario.projects.length} projects, ` +
    `${scenario.customers.length} customers, ${scenario.firmOrders.length} firm orders, ${scenario.requests.length} requests`,
);
