// Which scenario the app shows. One constant, so the pages, the server action, the inbox matcher and the cost page
// can never disagree (ADR D-20). The generated 12-week scenario (synth.ts) stays as the stress case the unit tests use.

import { DECK_SCENARIO_FILE } from "./deck-story";

export const ACTIVE_SCENARIO_FILE = DECK_SCENARIO_FILE;
