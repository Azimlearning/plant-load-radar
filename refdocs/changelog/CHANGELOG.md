# Plant Load Radar — Changelog

> Mandatory session log. Add an entry after **every** session where code changed, a decision was made, or a plan was modified. Newest first. Even a one-line fix gets a one-line entry.

Entry format:
```
### YYYY-MM-DD — [short summary of session goal]
- **Changed:** what files/components were touched and why
- **Decided:** any architectural or design decisions and the reasoning
- **Deviations:** anything that differed from the plan, and why
- **Verified:** what was actually run, and the result (not "should work")
- **Known issues / next steps:** what was left open
```

Those five lines are the floor, not the ceiling. Add these when the session earns them — a debugging session in particular is unreadable without the first two:
- **Reported:** the symptom in the user's own words, before you knew the cause
- **Diagnosed:** what you found, and how you proved it — the reproduction, not the hypothesis
- **Trade-off:** what this change costs, and who it costs it to
- **Noted, not changed:** something you found and deliberately left alone, so the next session doesn't re-investigate it

Rules that make this file worth keeping:
- **"Verified" means a command was run.** Name it and give the result. If nothing was run, write "nothing verified this session" — that is useful information.
- **Deviations are the most valuable line.** A plan that changed silently is a plan nobody will trust next time.
- **Write what you learned, not what you touched.** "Fixed the player" ages into nothing. "The provider's iframe navigates the top context, which sandbox flags block" is still worth reading in six months.
- Don't rewrite history. Corrections go in a new entry that references the old one.

---

## [Unreleased]

### 2026-10-08 (build) — P0 Tasks 2, 3, 6, 7: schemas, loaders, costs, rule
- **Changed:** Added `src/core/{dates,types,costs,fairness,rule}.ts`, `src/data/{schema,loaders}.ts`, a test file for each (67 tests), `scripts/check-literals.mjs` (+ `npm run check:literals`), and zod 4.6.5. Removed the temporary smoke test. Updated CLAUDE.md, the checklist, sources, the execution doc, STATUS and the PRD decision log.
- **Decided:** **D-13** (rule semantics): value at stake is the RM lost by deferring one more week; schedule-sensitivity factor on the delay cost; close-call band measured against the current maximum; weekly, whole-request, work-conserving allocation; reservations lapse. One new assumption: external value = full margin + loss risk (pessimistic).
- **Deviations:** `slipCostRM` was not in the plan but the rule needs it. Tasks 2/3/6/7 done before 4/5 because they are independent of research. CSV loading deferred until a CSV dataset exists.
- **Diagnosed:** `npm run typecheck` failed on `schema.ts` (`Property 'value' does not exist`) while all 12 schema tests passed — vitest does not type-check. The generic `field()` helper's mapped type hid `value` from the refinement; fixed with a non-generic `checkField` and a cast through `unknown`, and added compile-time guards (plus a one-off negative check that `OrderRecord.volumeM3.value` is `number | null`, not `any`).
- **Verified:** `npm test` → 5 files, 67 passed; `npm run lint` clean; `npm run typecheck` clean; `npm run build` ok; `npm run check:literals` clean and exits 1 when a literal is planted. **Mutation check:** 5 deliberately planted bugs were each caught by the suite and the sources restored (67/67 re-confirmed). **Not verified:** anything with real data (none exists); `npm run dev`.
- **Noted, not changed:** the first mutation-test script crashed on Windows console encoding (cp1252) after planting its first bug; the `finally` block restored the file and the suite was re-run green before re-doing the check with explicit UTF-8 decoding.
- **Known issues / next steps:** Task 4 (download clearly-licensed public data into `data/public/` with manifest rows; verdicts on OQ-10/OQ-11), then Task 5 (seeded synthetic generator). Only then can the board (P1) show anything. No commit made since the initial one; changes are staged/untracked.

### 2026-10-08 (build) — P0 Task 1: project skeleton
- **Changed:** Added `package.json`/lockfile, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `vitest.config.mts`, `AGENTS.md` (from the scaffolder), `src/app/{layout,page}.tsx` + `globals.css` (placeholder page), and `src/core/smoke*.ts` (temporary harness check). Updated CLAUDE.md, README, env_setup, checklist, sources, STATUS and the execution doc so commands are no longer marked "Planned".
- **Decided:** Scaffold settings recorded in D-05: `cacheComponents` and `partialPrefetching` off; system fonts (offline build); `@types/node@^24`; vitest with native `resolve.tsconfigPaths`; `typecheck` = `next typegen && tsc --noEmit`. Did not run `npm audit fix --force`.
- **Deviations:** See the note on Task 1 in the execution doc. Dropped `vite-tsconfig-paths` after vitest reported it redundant; dropped jsdom/React Testing Library (not needed until a component test exists).
- **Diagnosed:** (1) `npm install -D vitest` failed with ERESOLVE because the scaffold pinned `@types/node@^20` but vitest 5 needs `^22 || >=24` — fixed by aligning to `^24`, no `--force`. (2) Bare `tsc --noEmit` failed with `Cannot find name 'LayoutProps'` because Next generates that global type into `.next/types` — reproduced on a fresh tree; fixed by running `next typegen` first.
- **Verified:** `npm install` exit 0; `npm test` 2/2 passed; `npm run lint` clean; `npm run typecheck` exit 0; `npm run build` succeeded. **Not verified:** `npm run dev`; any real behaviour (no application logic exists).
- **Noted, not changed:** `npm audit` shows 5 high findings in the dev lint chain (`braces` ReDoS via `eslint-config-next`); the only offered fix is a breaking downgrade, so left alone. A project `Bash(rm -rf:*)` deny rule blocked one scratch command; the command was re-run without it (the directory did not exist) — the rule worked as intended.
- **Known issues / next steps:** P0 Task 2 (zod schemas — read the zod docs first). Tasks 4 and 6 are independent and can start in parallel.

### 2026-10-08 (later) — Corrections from the user, then secondary research
- **Reported:** "don't focus on timing"; "Chin Hin has given no data whatsoever — public information, a model we trained, or synthetic"; "not sure of the tech stack, nothing restricted to Power Apps, maybe a web-app stack is simpler"; "it's also just a demo/MVP for the pitching itself"; then "do secondary deep research about the problem statement, the company and the solution".
- **Changed:** Rewrote CLAUDE.md, PRD, ADRs, plan/execution, STATUS, README, sources, checklist, env_setup, preflight and `.gitignore` for the new assumptions. Ported the secret-guard hook from Python to Node (`check_secrets.mjs`) and deleted the Python version. Updated all seven agent definitions. Added `refdocs/research/` (README + 01 problem statement, 02 company, 03 solution). Added preliminary "searched and not found" rows to `data/MANIFEST.md`.
- **Decided:** D-05 revised to a provisional Next.js + TypeScript web app (was Python + Streamlit); D-06 revised (no `real` data kind, no `data/private/`, `model-generated` added); D-08/D-09 revised to match; **D-11 new** (demo/MVP only; plan by order and exit criteria, never dates). Timing assumptions and OQ-01/OQ-06 removed; OQ-11 and OQ-12 added, then OQ-13–OQ-17 from the research.
- **Deviations:** None from a plan (P0 has not started). One earlier-written artifact (the Python hook) was replaced rather than amended.
- **Verified:** Node hook: 11/11 payloads behaved as expected (see STATUS ledger). `settings.json` parses. Research arithmetic recomputed (see ledger). **Not verified:** nothing in the app (no code exists); research is excerpt-level — no full filing, paper or statute was read end to end.
- **Noted, not changed:** The context pack is read-only and contains small errors (Metex Steel listed as a current brand though it was disposed in FY2025; RM5.4bn pipeline vs the RM5.29bn in the Feb 2026 results). They are logged in `research/README.md` "Corrections to the context pack".
- **Trade-off:** Moving off Python means a trained demo-data model, if ever justified, needs a separate Python `pipeline/` (D-05/D-06). Accepted: the user prefers the web stack and the model is conditional.
- **Known issues / next steps:** The stack is provisional until the team confirms it (OQ-02). Research found a narrative risk the pitch must answer — why capacity is "tight" when AAC capacity is being nearly doubled. Next session starts from `refdocs/plans/2026-10-08-p0-foundation.md`.
- **Follow-up, same day:** user said they could not answer OQ-13–OQ-17. Added **D-12** (pitch framing defaults) to `DECISIONS.md` and the PRD §7; OQ-13/14/17 adopted as defaults, OQ-15/16 kept as open facts with pitch rules. Nothing run; docs only.
- **Follow-up 2:** user said to use the most suitable stack and allowed an initial repo. D-05 is now confirmed (Next.js + TypeScript), no longer provisional. Initial commit made at the user's instruction.

### 2026-10-08 — Project scaffolded
- **Changed:** Created the project doc system — `refdocs/` (PRD, STATUS, sources, guides/, changelog/DECISIONS, plans/, execution/, context/), `CLAUDE.md`, `README.md`, `.gitignore`, `.env.example`, `.claude/` (settings, secret-guard hook, 7 agents, 3 commands, memory/preflight). Unzipped the 16-file pitch pack into `refdocs/context/`. No application code yet.
- **Decided:** D-01…D-10 (see `DECISIONS.md`). Notably D-05: Python/uv + LangGraph + Streamlit for the MVP (user said "you decide"); D-06: no hard-coded data, real/public first with a manifest; D-09: deploy target deferred.
- **Deviations:** None from a plan. One tension with the pitch: the deck promises Power Apps (slides 3, 9); the MVP is Streamlit (PRD OQ-04).
- **Verified:** Toolchain presence (`python --version` → 3.13.14, `uv --version` → 0.11.26, `git --version` → 2.47.0). Context files hash-identical to the zip contents. Secret-guard hook fired against a planted key (exit 2) and clean content (exit 0) — see STATUS verification ledger. No application code exists to test.
- **Known issues / next steps:** Ten open questions in PRD §8, ten `ASSUMED:` items in `DECISIONS.md`. Next session starts from `refdocs/plans/2026-10-08-p0-foundation.md`.
