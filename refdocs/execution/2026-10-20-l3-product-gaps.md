# Execution — L3 product gaps

> Plan: `refdocs/plans/2026-10-20-l3-product-gaps.md`. Each step ends with `npm test`, lint, typecheck, `check:literals` green. Deviations are logged below as they happen.

1. Horizon: `deck-story-params.json` gets `weekCount` 12, `displayWeeks` 6, quiet scripted weeks 47 to 52 (with provenance notes); schema gets `displayWeeks`; regenerate (`npm run generate:deck-story`); the board chart and week table show `displayWeeks` unless `?weeks=all`; fix tests that assume six weeks.
2. Board slots: `slotViews` into the board model and screen; the board page merges the visitor's call-offs.
3. WhatsApp import: `src/capture/whatsapp.ts` (splitter), number words in `src/capture/normalise.ts`, gold cases in `data/synthetic/inbox-samples.json`, a paste mode on `/inbox/try`.
4. Huddle flag: `huddleFlagStore` in `src/ledger/visitor.ts`, a server action on `/decisions`, a section on `/huddle`.
5. Docs: STATUS, CHANGELOG, ADR if a decision was made.

## Status and deviations
All four items built and tested (see ADR D-23). Deviations from the plan above:

- **Step 1:** `displayWeeks` is a scenario field (and a deck-story parameter with a provenance note), not a board-only setting, so every view that wants "the weeks on screen" can read the same value. `/value` and its tests did not move (no figure there averages over weeks).
- **Step 2:** `slotViews` moved out of `calloffs-view.ts` into `src/data/slots.ts` to avoid a cycle with `board.ts`; `calloffs-view.ts` re-exports it.
- **Step 3:** msg-21's gold changed (the rules reader now reads its number words as inferred), so the `expectRulesLimit` example in the sample file is gone; the "unsure, never wrong-and-confident" behaviour is now tested with an English-words text in `rules.test.ts`. The sample count stays 22. The rules baseline in `refdocs/evals/` was regenerated. The sample chat is a new synthetic file (`data/synthetic/whatsapp-export-sample.txt`, manifest row added).
- **Step 4:** refusal codes for the flag are prefixed (`huddle-name-required`, `huddle-unknown-week`) because the decisions page already uses `name-required` and `unknown-week` with different text.
- **Added, not in the plan:** Playwright and axe tests (`e2e/`, `playwright.config.ts`, `npm run e2e`), a skip link, focusable scroll regions and underlined caption links (axe findings), and extra smoke needles.
