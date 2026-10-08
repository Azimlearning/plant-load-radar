# Plant Load Radar — Claude Context

> Read this file at the start of every session, then run through `.claude/memory/preflight.md` — it's the six-question gate that turns these rules into something you actually did. Plant Load Radar is a **demo/MVP built to pitch** Chin Hin Group's "Capacity & Demand Intelligence" challenge (Kabel YEI 3.0): when a plant can't serve everyone, decide who goes first by the ringgit at stake — one rule, one owner, one board, with a 4-agent AI layer doing the legwork. It is not a production system.
> The PRD is the source of truth; this file is the short operating brief; preflight is the gate. Keep all three short.

---

## Order of authority (when docs conflict, surface it — don't resolve silently)

0. `refdocs/STATUS.md` — **where we are right now.** Phase checklist + the current module's progress. Check this first, every session.
1. `refdocs/plant-load-radar-PRD.md` — **what & why.** Owns scope, architecture, roadmap, Decision Log.
2. `refdocs/changelog/DECISIONS.md` — **settled calls.** Read before re-debating an architectural choice.
3. `refdocs/plans/*.md` — **what to build & why.**
4. `refdocs/execution/*.md` — **how & in what order.**
5. `refdocs/guides/` — **operational reference.** `env_setup.md` (every variable, where to get it), `checklist.md` (pre-ship).
6. `refdocs/plant-load-radar-sources.md` — **raw research** (external references, repos, APIs).
7. `refdocs/context/00–15_*.md` — **founding context** (the pitch pack: brief, research, deck, script, decisions made *before* the build). Read-only history; it is not updated as the build moves. When it conflicts with the PRD, the PRD wins — but say so.

If two docs disagree, stop and ask. Don't pick one and move on.

---

## Mandatory rules

### 1. Update the changelog after every session
After any session that changed code, made a decision, or modified a plan, add an entry to **`refdocs/changelog/CHANGELOG.md`** (format is in that file). Do not skip. Even a one-line fix gets a one-line entry.

### 2. Plan before you build
Before implementing any non-trivial feature, a **plan doc** (`refdocs/plans/`) and an **execution doc** (`refdocs/execution/`) must exist. If they don't, create them before writing code.

### 3. Log decisions as ADRs
New architectural/design decision → add an ADR to `refdocs/changelog/DECISIONS.md` (Decision → Why → Rejected/Trade-off). Mark unresolved assumptions `ASSUMED:` and surface them at the next checkpoint.

### 4. Keep docs current
If you deviate from a plan during execution, update the execution doc to match reality. Stale docs are worse than no docs.

### 5. Never commit without asking
Commit and push only when the user explicitly asks. `git init` and `.gitignore` are fine; a commit is the user's call.

### 6. Run the tests before saying "done"
"Done" means the relevant checks were run and passed (`refdocs/guides/checklist.md`), and the result is in the changelog's **Verified** line. If nothing was run, say so — don't imply otherwise.

### 7. Label every figure: illustrative or sourced
Every RM or m³ figure in code, data, UI, docs and slides is tagged **illustrative** or carries a source. Never present an illustrative number as Chin Hin's. Never use "AI cuts forecast errors 30–50%" (vendor marketing — see context `04_RESEARCH.md` §E).

### 8. Prefer the cheaper option
When two approaches both work, take the cheaper (cost, tokens, effort) and say so in the changelog or ADR. The LLM budget is small pay-per-use.

### 9. Plan by order and exit criteria, not dates
Work is rolling and flexible (user, 2026-10-08). Don't invent deadlines, target dates or "time remaining" arguments. Phases have an order and exit criteria; that is all. Effort estimates are fine; calendar dates are not.

---

## The hard constraints (these are mechanism, not preference)

1. **Numbers come from the calculator, never the model.** Every ringgit / m³ / day figure a user sees is computed by deterministic code in `src/core/`. LLMs may only *write words* around numbers they were handed. Enforced by: no LLM call may return a number that is displayed; a test asserts that agent output numbers are a subset of calculator output (P3). *If you are about to type an RM figure into a prompt, a UI string, or a fixture, stop — it belongs in data or the calculator.*
2. **Nothing is sent or committed without a person.** The scheduler approves every outgoing message and every ledger entry. There is no auto-send path and no "auto-approve" flag.
3. **Chin Hin has given us no data, and none will be assumed.** Everything the demo uses is one of three kinds: **`public`** (public information, found by deep research), **`model-generated`** (produced by a model *we* trained on public data), or **`synthetic`** (seeded, realistic, generated). There is no `real` kind. Each dataset is loaded from `data/` with a row in `data/MANIFEST.md` (kind, source, licence, retrieved date, and for model/synthetic data the seed, code path and what it was calibrated to). **No hard-coded data** in code, prompts or UI. A loader must refuse a file with no manifest row. The pitch must never imply the demo ran on Chin Hin's data.
4. **The brief's own constraints bind the design:** no new ERP, no consultant, no transfer-pricing policy handed down from head office, no escalation up the chain, deliverable within 12 weeks. Success is measured in cash released / margin recovered / delay days avoided — never logins, satisfaction or adoption.
5. **Out of scope until the data is clean:** forecasting models and letting AI decide allocation (context decisions D19, D20; PRD D-02). Don't build them, and don't let them creep in as "just a small forecast".
6. **Secrets never reach git, and never reach the browser.** `.env` is gitignored; the secret-guard hook blocks key-shaped literals at write time. The LLM key is read only in server code — never in a `NEXT_PUBLIC_*` variable or a client component. Variable names go in `.env.example` and `refdocs/guides/env_setup.md`.
7. **It's a demo.** Build for a convincing, honest walk-through of the week-43 story, not for production. No auth, multi-tenancy, real WhatsApp/Power Automate integration, or multi-plant support unless an ADR says otherwise.

---

## Stack

**Decided (D-05):** a web app. The user was unsure and told Claude to use whatever is most suitable; nothing is tied to Power Apps. Next.js + TypeScript was chosen as the simplest single-language stack that gives a scheduler-grade screen and a shareable link. Changing it needs a new ADR.

| Layer | Choice |
|---|---|
| App | Next.js (App Router) + TypeScript, Node 24 on the lead's machine (npm 11) |
| Core (rule, cost formulas, planner logic) | Pure TypeScript in `src/core/` — no LLM, no network, no framework imports. Fully unit-tested. |
| Data | JSON / CSV files in `data/`, validated by zod schemas at load time; append-only ledger file |
| Agents | Intake → Matching → Planner → Writer, human checkpoint. Orchestration library chosen in P2 after reading current docs (LangGraph.js is the deck's name; the Vercel AI SDK is the alternative) — ADR then |
| LLM | One provider interface in `src/llm/`; cheapest workable model first (ASSUMED provider: Anthropic — D-08) |
| Tests / lint | vitest, ESLint, `tsc --noEmit` |
| Offline data pipeline (optional) | Python + uv in `pipeline/`, only if a trained model is actually used (D-06). It emits files into `data/` with manifest rows; the web app never imports it. |

**Installed 2026-10-08 (P0 Task 1):** Next.js 16.4.0, React 19.3.0, TypeScript 5, Tailwind 4, ESLint 9, vitest 5. Next 16 differs from older versions — `AGENTS.md` says to read `node_modules/next/dist/docs/` before writing Next.js code, and to check current docs rather than recall APIs. zod 4.6.5 and tsx 4.23.15 (script runner) are installed. The LLM layer and the agents are not installed yet (P2).

## Surfaces

Single app. Everything lives in the repo root. `refdocs/context/` is documentation, not code. `pipeline/`, if it ever exists, is an offline data tool, not a second product.

## Running it

| What | Command | Notes |
|---|---|---|
| Install | `npm install` | Verified 2026-10-08 |
| Tests | `npm test` | vitest, one run (`npm run test:watch` to watch). Verified 2026-10-08 (smoke tests only so far) |
| Lint | `npm run lint` | ESLint. Verified 2026-10-08 |
| Type check | `npm run typecheck` | Runs `next typegen` first (generates the global `LayoutProps` types), then `tsc --noEmit`. Plain `tsc` fails on a fresh clone. Verified 2026-10-08 |
| Build | `npm run build` | Verified 2026-10-08 (static placeholder page) |
| Regenerate demo data | `npm run generate:synthetic` | Rewrites `data/synthetic/scenario.json` from `params.json` + public data (tsx). A test fails if the committed file is stale, so run this after changing the generator or params. Verified 2026-10-08 |
| Refresh public data | `npm run fetch:public` | Re-downloads the two DOSM series into `data/public/` (CC BY 4.0). Then update the manifest row's retrieved date by hand. Verified 2026-10-08 |
| Hard-coded figures | `npm run check:literals` | Fails if a numeric literal (3+ digits or a fraction) appears in `src/core` or `src/app` outside a named SCREAMING_CASE constant. Verified 2026-10-08 |
| Dev server | `npm run dev` | The board at `/`. Not run in dev mode yet; the production build was run with `npm run build` then `npx next start` and viewed (2026-10-08). After a rebuild, stop the old `next start` process first or it keeps serving the stale build |
| Agents smoke test | *not yet defined* | P2 |

---

## Build sequence

P0 Foundation (skeleton, schemas, data + provenance, rule calculator) → P1 Board (capacity vs demand, planner logic, dashboard) → P2 Capture (intake + matching agents, orders inbox, LLM interface) → P3 Decide & write (writer agent, ledger, "ask the board", human checkpoint) → P4 Pitch-ready (data realism, rehearsal, backup demo, deploy decision).

**Never build the second of anything until the first is green end-to-end.**

---

## Subagents (`.claude/agents/`)

| Agent | Use it when |
|---|---|
| `doc-keeper` | End of every session; "update the docs" |
| `feature-planner` | Before any non-trivial feature; start of a phase |
| `test-runner` | Before claiming anything works |
| `ui-reviewer` | After any dashboard change |
| `data-steward` | Any data question: deep research on public sources, the trained-model/synthetic pipeline, keeping `MANIFEST.md`, catching hard-coded numbers |
| `ceo-pitch-advisor` | Business case, pitch narrative, "will this win?", Q&A prep |
| `idea-catalyst` | Stuck, or want sharper ideas and honest feedback |

## When blocked

- **Open question:** check the PRD's Open Questions section. If unresolved, write your assumption to `DECISIONS.md` as `ASSUMED:`, proceed, surface at the next checkpoint.
- **Doc conflict:** stop. Quote both passages and ask. Don't pick silently.
- **Ambiguous spec:** prefer the cheaper option. Log the choice.

---

*Companion brief to `refdocs/plant-load-radar-PRD.md`. Last updated: 2026-10-08.*
