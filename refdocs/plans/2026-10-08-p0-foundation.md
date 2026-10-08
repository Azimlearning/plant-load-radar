# Plan — P0 Foundation

> Phase P0 of `refdocs/plant-load-radar-PRD.md` §6. Execution doc: `refdocs/execution/2026-10-08-p0-foundation.md`.
> A plan says **what and why**. The execution doc says **how and in what order**. Keep them separate — when they merge, both stop being read.

## Why this exists

Every later phase — the board, the agents, the ledger — leans on three things that don't exist yet: a project skeleton the whole team of five can install in one command, a data layer where every number has provenance, and a deterministic calculator that is provably correct on the pitch's own worked example. If those are wrong, the agents will faithfully narrate wrong numbers. P0 also fixes the schema first so four people can work in parallel afterwards (context `03` §10: "Agree the data schema on day one"). And because Chin Hin has given no data, P0 is where the project's data honesty is built: deep research for what *is* public, and a clearly-labelled generator for the rest.

## What's already covered (no work needed)

- The rule, owner, board and fairness rules are fully specified in `refdocs/context/03_PROJECT_PLANT_LOAD_RADAR.md` §2–4 and the cost formulas in §9 — P0 implements them, it does not redesign them.
- The worked example (Project A ≈ RM82,000/day vs Contractor B ≈ RM18,000 margin → serve A, move B to week 44) is already stated in the deck and is the acceptance test.
- Secondary research already done: `refdocs/research/` (problem statement, company, solution) and `refdocs/context/04_RESEARCH.md` — Task 4 builds on them rather than repeating them.
- Toolchain on the lead's machine (Node 24.11.0, npm 11.6.1, git 2.47.0) is verified (STATUS ledger).

## Scope

**In:**
- Next.js + TypeScript skeleton with vitest, ESLint and `tsc --noEmit`; one-command install for teammates.
- zod schemas: capacity, orders (per-field value + confidence state + source), projects (delay-cost card), customers (margin card), ledger row.
- `data/` layout, `data/MANIFEST.md`, loaders that refuse unmanifested files.
- Deep public-data research by `data-steward`, each hit recorded in the manifest, plus a recorded "not findable" for every item that isn't.
- A seeded, config-driven synthetic generator labelled `synthetic`. A trained model (`model-generated`) **only if** Task 4 finds a defensible public training source.
- Delay-cost, margin, rule comparator and fairness rules in `src/core/`, with tests.

**Out (and why):**
- Planner, capacity-vs-demand board, dashboard — P1 (don't build the second thing before the first is green).
- LLM interface and agents — P2/P3; P0 has no network and no key.
- Forecasting of any kind — D-02.
- Precast mould slots and ready-mix truck dispatch — AAC first; same rule, different lever, later.
- Deployment — D-09.
- Any Chin Hin data handling — there is none (D-06).

## Approach

Pure-TypeScript `src/core/` with no I/O, no framework imports, so it is trivially testable and cannot call a model. Schemas in one module that agents will later reuse as their extraction schema. Loaders sit between files and schemas and enforce the manifest. The synthetic generator reads parameters from a config file under `data/synthetic/`, so no demand or capacity figure appears as a literal in code; the deck's illustrative values (20,000 m³/week; weekly firm/likely demand) may seed that config and the manifest labels them illustrative. Fairness rules are implemented as small, individually tested functions composed by one comparator, so a rule can be switched off for an experiment without editing the others. The trained-model decision is a gate, not an assumption: research first, model only if a source justifies it.

## Risks & unknowns

Be honest about confidence. "I have read this library's docs" and "I think this library does that" are different rows, and only one of them is safe to build on.

| Risk / unknown | Confidence | Mitigation |
|---|---|---|
| Next.js scaffold command, flags, and App Router layout | Low — not read yet | Task 1 reads the current Next.js docs (via context7) before running anything; no flag is recalled from memory |
| vitest + TypeScript path-alias configuration inside a Next.js project | Low | Task 1 reads vitest's docs; keep `src/core/` free of Next imports so config stays trivial |
| zod API (v3 vs v4 differences) | Low — not re-read this session | Task 2 starts by reading the current zod docs via context7 |
| Any plant- or order-level public data exists | **Low** (PRD OQ-10) | Expect aggregates only (DOSM, LAD rate, carrying cost, company disclosures); record "not findable" per item; synthetic carries the order stream |
| A defensible public training source exists for a trained model | Low (PRD OQ-11) | Gate in Task 5: if none, skip the model and say so in the manifest |
| Public aggregates are usable for calibrating synthetic demand | Medium | `data-steward` documents the calibration and its limits in the manifest note |
| "Idle site cost" has no public source | Low | Explicit input field defaulting to 0 with a manifest note; OQ-07 |
| Five teammates can install Node + npm and know TypeScript | Unknown (OQ-02, OQ-09) | Task 1 writes a plain-language setup section in the README; check on a second machine when possible |
| ±10% "close call" semantics ambiguous (10% of what?) | Medium | Define explicitly in code and ADR: close call when abs(a − b) ≤ 10% × max(a, b) |
| Cost of delay applies only after the handover deadline passes; buffer-day handling | Medium | Model explicitly: delay days counted from (deadline + buffer); tests include a before-deadline case returning 0 |
| Floating-point rounding on money (82,191.78…) | Medium | Decide rounding policy once (compute in floats, round only at display) and test it |
| Hosted deploys have ephemeral filesystems (ledger persistence, D-05/OQ-12) | Medium — general platform behaviour, not verified for the chosen host | Out of P0; recorded so P4 doesn't discover it late |

## Definition of done

This phase is done when every line below is true and has been *observed*, not assumed:

- `npm install` followed by `npm test` exits 0 on the lead's machine, with the test count and result recorded in the STATUS verification ledger.
- A test reproduces the worked example from data fixtures: a RM300,000,000 block past its deadline yields ≈ RM82,192/day (300e6 × 10% ÷ 365 = 82,191.78), beats a RM18,000 margin, and the comparator returns "serve internal, offer external the next free week".
- A test shows a confirmed order is never displaced by a new, higher-value request.
- A test shows a close call (within the defined 10% band) goes to the earlier-confirmed request.
- Loading a data file with no `MANIFEST.md` row throws; loading a manifested one succeeds.
- Running the synthetic generator twice with the same seed yields byte-identical output, and its output validates against the schemas.
- `data/MANIFEST.md` has a row for every file in `data/`, each marked `public`, `model-generated` or `synthetic`, and the research outcome is recorded (including what was *not* findable).
- `npm run lint` and `npx tsc --noEmit` exit 0.
- No RM or m³ literal appears in `src/core/` or `src/app/` outside tests and clearly-named, sourced defaults (grep check recorded in the ledger).
