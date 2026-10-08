# Plan — P4a UI rework and shareable deploy

> Phase P4 (Pitch-ready) of `refdocs/plant-load-radar-PRD.md` §6. Execution doc: `refdocs/execution/2026-10-09-p4-ui-and-deploy.md`. ADR: D-19. Requested by the user, 2026-10-09: "the UI needs a major rework, light theme, more professional, refer to Microsoft or Amazon style sites; the deck has a mock-up; host on Vercel so judges can be sent the demo; use my Vercel MCP".

## Why this exists

The demo is judged by people who will open a link. The current screens are correct but look like an engineering test page (dark by default, one narrow column, plain cards). The deck already promised a scheduler-grade screen (slide 9: left navigation, four headline tiles, chart beside a recommendation card, orders inbox below). And the demo must be **sendable**: a judge must be able to open it, approve the week-43 decision, and see the result without a shared server file or anyone else's approval getting in the way.

## What's already covered (no work needed)

- All six screens, their view-models, the honesty tests and the data. P4a changes **presentation and storage only**: no figure, rule or data file changes.
- The deck's palette is recoverable from the slide XML (ink `1B1F1C`, brand green `1F6B45`, dark green `16402B`, red `B03A2E`, muted `646B66`, cream `FAFAF7`, rules `E2E2DC`, tints `F8E7E4` pink and `EAF2EC` mint). Slide text was not extractable as a picture, so the layout was read from shape positions: a white card with a left navigation column, four tiles, chart (left, wide) beside a red-outlined recommendation card (right), inbox strip beneath.

## Scope

**In:**
- **App shell (Microsoft 365 / Amazon style):** a slim top bar with the product name and a "Synthetic demo" pill, a left navigation rail with icons-free text items and a green active pill (as in the deck), a light-grey canvas with white cards, a clear type scale (Segoe UI first, system fallbacks), consistent buttons, pills, tables and form fields. **Light theme only**: no dark block.
- **Board layout from the deck:** four tiles; chart card beside the decision card; an orders-to-check strip. Same content, rearranged.
- **Chart colours:** spare stays the validated blue and short stays red, **not** the deck's green, because green against red fails the colour-blind check (ΔE 5.8 under protanopia, measured with the dataviz validator); position, labels and legend carry the meaning as before. Brand green is used for navigation and buttons.
- **Shareable storage:** on Vercel the file ledger cannot work (read-only, shared). A signed-free **per-browser cookie** holds each visitor's own decisions (ADR D-19); on read every row is re-derived from the scenario and dropped if it does not match, so a edited cookie cannot show a figure the calculator did not produce. A "Start the demo again" button (cookie mode only) clears it. Locally the append-only file ledger is unchanged.
- **Deploy readiness:** make sure the `data/` files are bundled with the server functions (they are read at request time), keep the build free of required environment variables, document the one-click import path.

**Out (and why):**
- **Deploying from this session.** The Vercel connector is not authorised in this non-interactive session and the Vercel CLI is not installed or logged in. The repo is ready for a one-click import; the user authorises the connector or runs the import.
- Dark mode, a design-token library, a UI framework, animation (rule 8; the user asked for light and professional).
- New figures, new pages, or any change to rules, data or copy beyond what layout needs.

## Approach

One `Shell` server component replaces the per-page header, banner and `Nav`. Pages pass a title and the current route. CSS is rewritten once in `globals.css` around a small set of tokens. Existing class names that tests rely on (`result-row`, `scroll-hint`, `actions-note`, `role="note"` first in the page, and so on) are kept. The cookie ledger is a thin async layer (`src/ledger/session.ts`) around the unchanged synchronous `recordDecision`, so the most defended code in the app is not touched.

## Risks & unknowns

| Risk | Mitigation |
|---|---|
| A redesign breaks the honesty tests or accessibility | Tests run after every step; contrast computed for every text pair; screenshots at desktop and phone width |
| Cookie ledger lets a visitor forge a row | Rows are re-derived from the scenario on every read and dropped on mismatch; test with a tampered cookie |
| Cookie size (4 KB) | One contested week means one row (about 1 KB); a size guard refuses a write that would not fit |
| Data files missing on Vercel (read at request time, not traced) | `outputFileTracingIncludes` for `data/**`; verified in the build's trace files; if it cannot be proven locally the deploy notes say so |
| Judges share one browser/session | Cookie is per browser; the reset button lets a second run start clean |
| "Looks like Microsoft/Amazon" tempts copying | Use the pattern language (app shell, card grid, clear hierarchy), no logos or brand marks |

## Definition of done

- Every page uses the shell, is light-only, readable at 390 px and desktop, with the deck's layout on the board.
- `npm test`, `lint`, `typecheck`, `build`, `check:literals` pass; contrast of every text pair computed; screenshots of every page viewed.
- In cookie mode (`PLR_LEDGER_MODE=cookie`) a full approve flow works against the production server, a tampered cookie is ignored, and the reset clears it; file mode still passes its tests.
- The build output includes the `data/` files for the dynamic routes; deploy steps written down; the Vercel connector's unauthorised state reported plainly.
