# Execution — P5 Deck-story scenario

> Plan: `refdocs/plans/2026-10-16-p5-deck-story.md`. Order matters; each step ends green.

| # | Step | Done when |
|---|---|---|
| 1 | `data/synthetic/deck-story-params.json` + `src/data/deck-story.ts` (`buildDeckStory(base, params, calibration)`) + `scripts/generate-deck-story.ts` + npm script `generate:deck-story` | file generated; schema parses |
| 2 | MANIFEST rows (params, scenario) | loader tests pass (every file manifested) |
| 3 | `src/data/deck-story.test.ts`: not stale; slide-9 spare figures; slide-7 figures; provenance on every param | green |
| 4 | Core: `needsCall` filter (build-ahead-covered weeks are not decisions); thread the stock cap into `recommendationFor` and its callers | existing tests green; new tests for covered and uncovered |
| 5 | View-models: covered weeks, formula line, calendar date in replies, what-if | model tests green |
| 6 | Pages: `ACTIVE_SCENARIO_FILE`; board shows covered note and what-if card | page tests green on both scenarios |
| 7 | Full run: test, lint, typecheck, check:literals, build; screenshots | recorded in changelog |
| 8 | Docs: ADR D-20, STATUS, changelog, plans README | done |

Deviations are logged here as they happen.

## Status and deviations (2026-10-16)

All eight steps done. Deviations from the plan:

- **Covered weeks need a second capacity view.** The plan said "covered weeks are not decisions". Done by adding `toPlannedWeekCapacities` (raw weeks with covered build-ahead applied) for the rule, decisions and ledger, while the chart and "ask the board" keep the raw weeks. Without it, Week 42's overflow carried into Week 43 and made it 2,900 m³ short instead of the deck's 2,000.
- **The honesty test caught a real slip in my own new test** (HTML entities like `&#x27;` read as the figure "27"); fixed by decoding entities, as the existing board test already does.
- **`/value` text corrected**: the "one short week in twelve" explanation described only the old scenario.
- The stale `next start` process served an old build with broken styling during the first screenshots; killed and re-viewed (known trap, `CLAUDE.md`).
