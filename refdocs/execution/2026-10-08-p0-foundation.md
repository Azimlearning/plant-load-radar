# Execution — P0 Foundation

> Plan: `refdocs/plans/2026-10-08-p0-foundation.md`. Tasks run top to bottom unless marked parallel. Each task carries its own **Verify** step, and a task is not done until its Verify actually passes — not when the code compiles.
> If reality diverges from this doc, **edit this doc** (CLAUDE.md rule 4). A stale execution doc is worse than none.

## Before starting

- Read `CLAUDE.md` and `.claude/memory/preflight.md`.
- Node and npm available: `node --version` and `npm --version` (lead's machine: v24.11.0 / 11.6.1).
- The stack is decided (D-05, confirmed by the user). If it proves unworkable for the team, write a superseding ADR and update this doc *before* Task 1.
- No env vars needed in P0 — there is no network or LLM code yet.
- Working tree: this repo is `git init`-ed but has **no commits**; do not commit unless the user asks (rule 5).
- Tasks 4 (research) and 6 (cost functions) do not depend on the skeleton and **can run in parallel** with Tasks 1–3 across the team. Task 5 needs Tasks 2 and 4. Task 7 needs Task 6.

---

### Task 1 — Project skeleton — ✅ DONE 2026-10-08

> **Deviations from the steps below (all recorded in the changelog and D-05):** scaffolded with `create-next-app@latest` in a scratch folder (flags read from `--help`: `--ts --eslint --tailwind --app --src-dir --import-alias "@/*" --use-npm --disable-git`) and copied in without overwriting; `cacheComponents`/`partialPrefetching` turned off; system font stack instead of `next/font/google`; `@types/node` raised to `^24` (vitest 5 peer range); vitest uses native `resolve.tsconfigPaths` (no plugin); `typecheck` script runs `next typegen` first. The README setup section was updated rather than rewritten.

**Files:** `package.json`, `tsconfig.json`, `src/` layout, `vitest` config, `eslint` config, `README.md` (setup section).

1. **Read first:** the current Next.js installation docs and vitest's Next.js/TypeScript guide (use context7). Do not recall scaffold flags from memory.
2. Create the Next.js (App Router) + TypeScript project in the repo root without disturbing `refdocs/`, `.claude/`, `CLAUDE.md`, `README.md`, `.gitignore`, `.env.example` or `data/`. If the scaffolder insists on an empty directory, scaffold in a scratch folder and move the files in; do **not** overwrite existing files.
3. Create `src/core/` (pure TypeScript, no Next/React imports) and `src/data/`. No `src/agents/` or `src/llm/` until P2.
4. Add vitest and a `npm test` script; make sure `npm run lint` and `npx tsc --noEmit` work.
5. Add a plain-language "Setup" section to `README.md` for non-programmers on the team.

**Verify:** `npm install` exits 0; `npm test` exits 0 (a smoke test is fine); `npm run lint` and `npx tsc --noEmit` exit 0. Record the Node and npm versions.

### Task 2 — Schemas — ✅ DONE 2026-10-08

> Read the current zod docs first (zod 4.6.5: `import * as z from "zod"`, `z.iso.date()`). Order fields use a value/confidence/source wrapper with consistency rules (a `missing` field must be null; `confirmed`/`inferred` need a value). `schema.test.ts` contains compile-time guards that the schema output is assignable to the core types and that field types do not widen.

**Files:** `src/data/schema.ts`, `src/data/schema.test.ts`.

1. **Read first:** the current zod docs (use context7); do not rely on remembered v3 syntax.
2. Define schemas: `CapacityWeek`, `Order` (fields: customer/project, product, volume_m3, needed_by, tier firm/likely/possible; each extracted field wrapped with `value`, `confidence` ∈ {confirmed, inferred, missing, conflicting}, `source`), `ProjectCard` (units, purchase price, handover deadline, buffer days, idle site cost default 0), `CustomerCard` (price, variable cost, key-account flag), `LedgerRow`.
3. Fix the schema now — it is the contract the four modules share (context `03` §10).

**Verify:** `npm test -- schema` passes, covering valid construction, a rejected invalid tier, and a `missing`-confidence field round-trip.

### Task 3 — Data layout, manifest, loaders — ✅ DONE 2026-10-08

> `loadJsonDataset` is the gate (CSV loading is added when a CSV dataset exists). Beyond the plan: `findUnmanifested` and `findMissingFiles` audits, path-escape protection, and a test that runs both audits on the real `data/` folder.

**Files:** `data/MANIFEST.md` (exists — keep its format), `src/data/loaders.ts`, `src/data/loaders.test.ts`.

1. Define one parseable manifest row format (the file's header documents it) with kinds `public` / `model-generated` / `synthetic` only.
2. Loaders resolve the data dir from `PLR_DATA_DIR` (default `./data`), parse the manifest, and **throw** when asked to load a file with no manifest row or a row with an unknown kind (e.g. `real`).
3. Server-side only: loaders use `fs` and must never be imported by client components.

**Verify:** `npm test -- loaders` — one test loads a manifested fixture (passes), one asks for an unmanifested file (throws the named error), one rejects kind `real`.

### Task 4 — Deep public-data research (parallel) — ✅ DONE 2026-10-08

> Done inline by the main session (not the `data-steward` subagent). Two DOSM series are fetched by `npm run fetch:public` (`scripts/fetch-public-data.mjs`); six hand-curated fact files carry per-fact source URLs and reliability. Verdicts: OQ-10 not findable; OQ-11 no trained model (ADR D-14). Leads not yet followed: DOSM Industrial Production Index lines for cement/concrete articles (catalogue shows them ending 2024), and the full Chin Hin annual-report PDFs.

**Owner:** `data-steward` subagent. **Files:** `data/public/*`, `data/MANIFEST.md`, findings appended to `refdocs/plant-load-radar-sources.md`. **Start from** `refdocs/research/` and `refdocs/context/04_RESEARCH.md` — do not redo what is already sourced.

1. Search for public sources for: Malaysian construction output (DOSM — named in context `04`), LAD rate and deadlines, inventory carrying-cost range, Chin Hin's published capacity/utilisation/financial disclosures, AAC/precast/ready-mix market and price data, any open dataset resembling building-material orders or plant output, and a defensible training source for a demand-shaping model (if any).
2. Download only what has a clear licence. Each file gets a manifest row with URL, licence, retrieved date, and what it does **not** measure. For each item **not findable**, write that down in the manifest's "Searched and not found" table.
3. Do not copy figures into code. Figures live in `data/public/` files.
4. Finish with a one-paragraph verdict on OQ-10 (is order-level data findable?) and OQ-11 (is a trained model justified?).

**Verify:** every file under `data/` has a manifest row (a test or script lists unmanifested files → empty); each item in step 1 has either a `public` row or a "not found" row; OQ-10 and OQ-11 have a recorded verdict.

### Task 5 — Synthetic generator (no trained model: ADR D-14) — ✅ DONE 2026-10-08

> `npm run generate:synthetic` (tsx) writes `data/synthetic/scenario.json` from `data/synthetic/params.json` + the public data. Beyond the plan: every parameter carries a provenance note with a category tag (a test enforces it); the story week is shaped so the deck's example works by construction; a freshness test fails if the committed file differs from what the generator would produce now; `src/data/scenario.ts` bridges a scenario to the core's inputs and prices each request in ringgit (internal = marginal cost of one more week of slip, external = margin + loss risk). Seed 20261054 was chosen by scanning 80 seeds.

**Files:** `data/synthetic/params.json` (config), `src/data/synth.ts`, `src/data/synth.test.ts`. Only if justified: `pipeline/` (Python + uv, own README) and `data/model/*` with a model card.

1. Parameters (weekly capacity, demand mix by tier, internal vs external split, project cards, customer cards) live in the config file, calibrated to Task 4's public aggregates where available; the manifest note records the calibration and its limits. The deck's illustrative figures may seed the config and are marked illustrative.
2. Seeded PRNG; same seed → same output. Output validates against the Task 2 schemas and is written to `data/synthetic/` with `synthetic` rows in the manifest.
3. **Gate:** build a trained model only if Task 4 found a defensible public training source. If it did, the model lives in `pipeline/`, is small enough to train on a CPU, emits files into `data/model/`, and its rows are `model-generated` with the model card. If not, record "no trained model — no defensible public training source" in the manifest.

**Verify:** `npm test -- synth` — determinism (two runs byte-identical) and schema validity. Sanity check: at least one week is short and one has slack (the board needs both). If a model exists: its output also validates against the schemas and its model card names every training source.

### Task 6 — Cost functions — ✅ DONE 2026-10-08

> Functions are `delayCostPerDayRM`, `dailyDelayRateRM`, `slipCostRM`, `contributionMarginRM`, `externalValueRM`, `workingCapitalCostPerYearRM`. `slipCostRM` is new relative to this plan: the rule needs the cost of a week of waiting, applying schedule sensitivity and the deadline+buffer threshold (ADR D-13).

**Files:** `src/core/costs.ts`, `src/core/costs.test.ts`.

1. `delayCostPerDay(card, asOf)` = `(price × 10%) ÷ 365 + idleSiteCost`, counted only once `asOf` is past `deadline + buffer`; returns 0 before. Rate as a named constant with a source comment (Housing Development Act, 10% p.a.).
2. `contributionMargin(order, customerCard)` and `workingCapitalCost(excessValue, carryingRate)` (rate default from the manifested public range, not a literal).
3. Rounding policy: compute in floats, round only at display; test it.

**Verify:** `npm test -- costs` — RM300,000,000 past deadline → 82,191.78/day (±0.01); before deadline → 0; margin and carrying-cost examples (RM5m × 25% = RM1.25m/yr) match context `03` §9.

### Task 7 — Rule comparator + fairness rules — ✅ DONE 2026-10-08

> `decide()` processes weeks in order and carries deferred requests forward, which implements *move before refuse* and the unplaced outcome in one mechanism. Semantics and trade-offs: ADR D-13. The literal check is now `npm run check:literals` (strips comments; allows only named SCREAMING_CASE constants).

**Files:** `src/core/rule.ts`, `src/core/rule.test.ts`.

1. `decide(newRequests, firmCommitments, capacity)` returns, per short week, which request is served, which is offered the next free week, and the ringgit on each side.
2. Fairness rules as separate functions: **promises kept** (confirmed orders never displaced), **close call** (abs(a − b) ≤ 10% × max(a, b) → earlier confirmed wins), **plan ahead, get protected** (reserved capacity released if unused), **fill the quiet weeks** (pre-build AAC within a stock cap), **move before refuse** (offer next free week).
3. Record the ±10% definition as an ADR when implemented.

**Verify:** `npm test -- rule` — the worked example (A beats B, B offered the next free week), a confirmed-order-never-bumped case, a close-call case, a move-before-refuse case. Then `grep -rnE "RM ?[0-9]|[0-9]{2,3},[0-9]{3}" src/core` returns no literals outside named, sourced defaults (record the result).

---

## Wrap-up (do not skip)

- [ ] `refdocs/STATUS.md` — phase table updated, verification ledger updated with what was actually run
- [ ] `refdocs/changelog/CHANGELOG.md` — session entry added
- [ ] `refdocs/changelog/DECISIONS.md` — any new ADR (the ±10% definition; the P2 orchestration library; the trained-model gate outcome), any resolved `ASSUMED:`
- [ ] This doc updated to match what actually happened
