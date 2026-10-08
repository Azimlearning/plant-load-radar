# Plant Load Radar — Build Status

> **Read this first to know where we are.** Updated at the end of every build session. Phases and scope come from `refdocs/plant-load-radar-PRD.md` §6. Don't reorder phases without updating this file and saying why (CLAUDE.md "keep docs current").

**Build philosophy:** A demo built to be shown. Deterministic core first, agents second, polish last. Never build the second of anything until the first is green end-to-end. Numbers come from the calculator; data comes from files with provenance. Planning is by order and exit criteria — no dates (D-11).

**Right now:** **P0 is complete.** The deterministic core (cost functions, the allocation rule and its fairness rules), zod schemas, manifest-enforcing loaders, 8 sourced public data files and a seeded synthetic scenario all exist and are tested (151 tests). Running the rule on the scenario reproduces the deck's story: week 43 is the only contested week, Project A is served and Contractor B is moved to week 44. There is **no UI beyond a placeholder page, no agents and no LLM code** yet. The next step is P1 (the board): write its plan/execution pair with `/plan-feature`, then build the capacity-vs-demand view on `data/synthetic/scenario.json`.

Programme state (from the user, 2026-10-08): pre-interview passed, team of 5 formed. Chin Hin has provided no data. Timing is rolling and flexible.

---

## Phase checklist

| Phase | Scope | Status |
|---|---|---|
| P0 Foundation | Web skeleton, schemas, data + MANIFEST + loaders, deep public-data research, synthetic generator, rule calculator + tests | ✅ Done 2026-10-08 — every item in the plan's definition of done observed (151 tests) |
| P1 Board | Capacity check, planner, web board, KPI tiles, recommendation card | ⬜ Not started |
| P2 Capture | LLM interface, Intake + Matching agents, orders inbox, confidence states | ⬜ Not started |
| P3 Decide & write | Writer agent, approval checkpoint, ledger, ask-the-board | ⬜ Not started |
| P4 Pitch-ready | Data realism, demo script, backup demo, deploy decision, rehearsal | ⬜ Not started |

Status vocabulary — use these exactly, and never round up:

- ⬜ **Not started**
- 🔶 **In progress** — say precisely what works and what doesn't
- ✅ **Done** — built *and* verified. If it compiles but was never run, it is not done.
- ⛔ **Blocked** — name the blocker and who/what unblocks it

---

## P0 — Foundation (complete)

| Item | Approach | Status |
|---|---|---|
| Project skeleton | Next.js 16.4.0 + TypeScript, vitest 5, ESLint; current docs read first | ✅ Done 2026-10-08 (placeholder page only; 2 smoke tests) |
| Schemas | zod 4: capacity, orders (with per-field confidence), projects (delay-cost card), customers (margin card), ledger row | ✅ `src/data/schema.ts`; 12 tests + compile-time guards (schema ↔ core types, inferred field types) |
| Manifest + loaders | `data/MANIFEST.md`; loaders throw on files with no manifest row or kind `real` | ✅ `src/data/loaders.ts`; 18 tests incl. one asserting the real `data/` folder has no unmanifested or missing files |
| Deep public-data research | Research the DOSM, LAD, carrying-cost, Chin Hin disclosure and market-price sources; download only clearly licensed files into `data/public/` with manifest rows; verdicts on OQ-10 and OQ-11 | ✅ 8 public files in `data/public/` with manifest rows (2 DOSM series under CC BY 4.0, 6 sourced-fact files); OQ-10 and OQ-11 answered (D-14) |
| Synthetic generator | Seeded, config-driven, calibrated to public aggregates, labelled `synthetic`; trained model only if research justifies it | ✅ `src/data/synth.ts`, `data/synthetic/{params,scenario}.json`; calibrated to public series; reproduces the deck's week-43 story by construction; 57 tests; 8 of 8 planted bugs caught |
| Delay-cost + margin functions | `(Σ price × 10%) ÷ 365 + idle site cost`, only past deadline; contribution margin; schedule-sensitivity slip cost (D-13) | ✅ `src/core/costs.ts`; 13 tests incl. RM300m → 82,191.78/day |
| Rule comparator + fairness | More ringgit wins; ~10% close call → first confirmed; confirmed orders never bumped; move before refuse | ✅ `src/core/rule.ts`, `fairness.ts`; 24 tests incl. the week-43 worked example; semantics in D-13 |
| Tests | Includes the RM300m block ≈ RM82,192/day vs RM18k margin worked example | ✅ 151 passing across 8 files; core and generator mutation-checked (5 + 8 planted bugs, all caught by semantic tests) |

---

## Verification ledger

What has actually been run, not what has been written. A row here needs a real command and a real result.

| Date | What was verified | How | Result |
|---|---|---|---|
| 2026-10-08 | Toolchain on the lead's machine | `node --version`, `npm --version`, `pnpm --version`, `python --version`, `uv --version`, `git --version` | Node 24.11.0, npm 11.6.1, pnpm 10.12.1, Python 3.13.14, uv 0.11.26, git 2.47.0 present |
| 2026-10-08 | Pitch-pack files extracted intact | SHA-256 compare of `refdocs/context/*.md` against the zip contents | All 16 files identical |
| 2026-10-08 | P0 Task 1: skeleton installs and passes its checks | `npm install` (exit 0); `npm test` → vitest 5.0.3; `npm run lint`; `npm run typecheck` (= `next typegen && tsc --noEmit`); `npm run build` (Next.js 16.4.0, Turbopack) | Tests 2/2 passed; lint clean; typecheck exit 0; build succeeded, static routes `/` and `/_not-found`. Bare `tsc --noEmit` fails on a fresh tree (`LayoutProps` is generated), hence `typecheck` |
| 2026-10-08 | P0 Tasks 2, 3, 6, 7: schemas, loaders, cost functions, rule | `npm test` (vitest 5.0.3) → 5 files, **67 tests passed**; `npm run lint` exit 0; `npm run typecheck` exit 0; `npm run build` ok; `npm run check:literals` → 7 files, no hard-coded figures (and exits 1 when a literal is planted) | All pass. Mutation check: 5 deliberately planted bugs (capacity boundary, close-call band, delay-cost start day, reservations never lapse, committed capacity ignored) were each caught by the suite; sources restored and 67/67 re-confirmed. Negative type check confirmed `OrderRecord.volumeM3.value` infers as `number \| null`, not `any` |
| 2026-10-08 | P0 Task 4: public data downloaded, manifested and cross-checked | `npm run fetch:public` (2 DOSM CSVs, SHA-256 recorded); `npm test` → 6 files, **87 passed** (after adding the glass/roofing and wire-mesh lines); lint, typecheck, build, `check:literals` clean. Source PDFs (DOSM Q2 2026 statement; Chin Hin Q2 FY26 interim report) downloaded, text extracted and compared | All pass. Every DOSM figure matched; every Chin Hin segment value found in the report with the right row/column. Checks include: every file in `data/` has a manifest row and vice versa; DOSM subsectors sum to totals; Chin Hin sub-segments reconcile to the division subtotal; the pitch's growth rates (property +31.2%, construction +22.0%, building materials +13.5%) recompute from the data; the LAD rate in the sourced data equals the constant in `src/core/costs.ts`. One test failed on first run (DOSM early-year rounding, worst gap RM1m of ~13,700m in 2015 Q1) and the tolerance was set from the measured gap, not guessed |
| 2026-10-08 | P0 Task 5 and P0 definition of done | `npm run generate:synthetic` (seed 20261054); `npm test` → 8 files, **151 passed**; `npm run lint`, `npm run typecheck`, `npm run build`, `npm run check:literals` clean. Generator mutation check run from bash: 8 planted bugs, **8 caught** by semantic tests (story-week shaping, shortfall size, pandemic-year exclusion, margin ratio, maintenance week, who confirmed first, committed-share cap, growth tilt) | All pass. Findings along the way: (1) my first shaping left only 1,250 m3 free in week 43, so Project A (1,500) could not fit and the deck's story would not have happened — fixed so free capacity fits A but not A+B by construction, with a test for any of 25 seeds; (2) the first mutation scripts reported "CAUGHT" because the Python subprocess could not start vitest (TypeError reading 'config'), so the verdicts were meaningless — redone via bash, which exposed 3 real gaps (maintenance week, confirmation order, growth tilt) that were then covered by new tests; (3) only 1 of 80 seeds gave a scenario where week 43 is the only contested week; the seed was chosen by scan and the choice is documented in the params file |
| 2026-10-08 | Secret-guard hook (Node port, `.claude/hooks/check_secrets.mjs`) behaves | Scratchpad script piped 11 payloads: planted Anthropic key via Write, Edit and MultiEdit; planted JWT; clean code; allowlist pragma; `.env.example`; `.env`; malformed JSON; empty stdin; non-write tool. `settings.json` parsed as valid JSON | 11/11 as expected: exit 2 on the four planted secrets, exit 0 on the rest. (This replaced an earlier Python hook, 9/9, since deleted.) |
| 2026-10-08 | Research arithmetic | Recomputed by hand: 300e6×10%÷365 = 82,191.78; 500,000×10%×30÷365 = 4,109.59; 100,000×10%×139÷365 = 3,808.22; Q2 FY26 segment growth rates and PBT margins from the Bursa figures; Selangor+Johor shares 25.5%+19.6% | All match the figures written in `refdocs/research/` |

---

## Known gaps

- Only a placeholder page exists in the UI. The core has tests but nothing runs end to end yet (no data, no board).
- External order value is the full margin plus loss risk (pessimistic; D-13 assumption 11). Revisit when there is a basis for a probability of loss.
- `npm audit` reports 5 high-severity findings, all in the lint toolchain (`eslint-config-next` → `fast-glob` → `micromatch` → `braces`, a ReDoS in glob matching). Dev-only, not shipped. The suggested `npm audit fix --force` would downgrade `eslint-config-next` to v14 (breaking) — do not run it; re-check after Next/eslint updates.
- `npm run dev` has not been run yet (only `build`).
- Secondary research is done (`refdocs/research/`) but is excerpt-level: no full annual report, paper or statute was read end to end, and no data files were downloaded. P0 Task 4 does that properly.
- Pitch framing defaults are set by D-12 (OQ-13/14/17). Two facts remain unknown: OQ-15 (is the third AAC plant running?) and OQ-16 (do material shortages extend LAD?). The pitch must not claim either way.
- No file-structure doc: deliberately not scaffolded (a file map of a project with no files is fabrication). Write one once there is a tree to describe.
- No parity doc: single-surface project.
- Stack decided (D-05, confirmed); deploy target undecided (D-09).
- Open `ASSUMED:` items: see `changelog/DECISIONS.md` and PRD §8.
- Context pack is stale on programme status (it ends 5 Oct; the interview was 6 Oct).
