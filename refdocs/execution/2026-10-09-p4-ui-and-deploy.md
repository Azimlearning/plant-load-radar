# Execution — P4a UI rework and shareable deploy

> Plan: `refdocs/plans/2026-10-09-p4-ui-and-deploy.md`. Each task has a Verify step. Commit only when asked (rule 5; the user authorised commit and push on 2026-10-08 for earlier work).

### Task 1 — Per-browser ledger (cookie mode) — ✅ DONE 2026-10-09

> `src/ledger/cookie-ledger.ts` (pure: encode, decode, `isGenuine`) with 7 tests, `src/ledger/session.ts` (async wrapper over `recordDecision`), `startAgain` action. A new refusal code `storage-full`.
**Files:** `src/ledger/session.ts` (async `loadRows`, `saveDecision`, `resetDemo`; mode from `PLR_LEDGER_MODE` or `VERCEL`), `isGenuine` in `cookie-ledger.ts` (re-derive and compare a row), `src/app/decisions/actions.ts`, pages that read the ledger, tests.
**Verify:** cookie round-trip; a tampered cookie (edited value, forged total, wrong week) yields no rows; oversize write refused; file mode unchanged; reset only in cookie mode.

### Task 2 — App shell and styles — ✅ DONE 2026-10-09

> `shell.tsx` replaced `nav.tsx`; `globals.css` rewritten, light only. Contrast computed for 17 text pairs, lowest 5.03:1 (red 'Decision needed' tag on the pink wash). Phone: navigation becomes a sticky scrolling strip; the decision card sits right after the chart.
**Files:** `src/app/shell.tsx` (replaces `nav.tsx`), `src/app/globals.css` (rewrite, light only), the six page components.
**Verify:** tests still pass (adjust only assertions about layout, never about figures or honesty); the synthetic notice is still the first thing in the page and has `role="note"`.

### Task 3 — Board layout from the deck — ✅ DONE 2026-10-09

> Four tiles; chart beside the red-outlined decision card; build-ahead under the chart (grid areas, so on a phone the order is chart, decision, build-ahead); an Orders to check strip with four lines from the pipeline. **Deviation:** the deck's mock-up has a 'protected this month' tile; the prototype keeps its own tiles (weeks short, decisions waiting, largest shortage, orders to check) because 'protected' has no measured source.
**Files:** `src/app/board.tsx`, `src/data/board.ts` (an "orders to check" preview strip; strings go through `Figures`), tests.
**Verify:** honesty test on the new strip; screenshots at desktop and 390 px.

### Task 4 — Deploy readiness — ✅ DONE 2026-10-09 (the deploy itself was NOT done)

> `outputFileTracingIncludes` for `data/**`; trace files list the data for `/`, `/decisions`, `/ledger`; the cookie flow was run for real against the production server (blank name refused; approval with a forged field recorded the calculator's values; second approval refused; tampered cookie ignored; a second browser sees nothing; reset clears). `refdocs/guides/deploy.md` written. The Vercel connector is unauthorised in this session and the CLI is not installed or logged in.
**Files:** `next.config.ts` (`outputFileTracingIncludes`), `refdocs/guides/deploy.md`, `.gitignore` check.
**Verify:** build trace files list the `data/` JSON for the dynamic routes; production server run with `PLR_LEDGER_MODE=cookie`: approve, reload, tamper, reset (real requests with `curl`).

### Task 5 — Wrap-up — ✅ DONE 2026-10-09
STATUS, CHANGELOG, ADR D-19, PRD roadmap row, CLAUDE.md running table, index rows; state plainly that deploy was not performed from here.
