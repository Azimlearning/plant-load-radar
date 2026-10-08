# Preflight — Plant Load Radar Session Start

> Read this at the start of every session, before touching code.
> One page, six questions, then you can build. CLAUDE.md is the reference; this is the gate.

---

## 1. Where are we?

Open `refdocs/STATUS.md`. Find the current phase and the one next action.
If STATUS's claims and the code disagree, **that's the session's first task** — not the thing you were about to do.

---

## 2. What am I about to touch?

Single app, single surface. The module map:

| Area | Where | Phase |
|---|---|---|
| Rule calculator, cost formulas, planner logic | `src/core/` | P0–P1 |
| Schemas, loaders, synthetic generator, manifest | `src/data/`, `data/` | P0 |
| Agents (Intake → Matching → Planner → Writer) | `src/agents/` | P2–P3 |
| LLM interface (server-side only) | `src/llm/` | P2 |
| Dashboard and server routes | `src/app/` | P1+ |
| Optional offline data-model tool | `pipeline/` | only if D-06 gate passes |
| Pitch pack and research (read-only history / reference) | `refdocs/context/`, `refdocs/research/` | — |

`refdocs/context/` is documentation, not code, and is not updated as the build moves.

---

## 3. Does a plan exist for what I'm about to build?

Non-trivial feature → a plan doc in `refdocs/plans/` **and** an execution doc in `refdocs/execution/`.
If neither exists, write them first (`/plan-feature`). If one exists but reality has moved, update it before building on it.

---

## 4. Has this already been decided?

Skim `refdocs/changelog/DECISIONS.md` before re-opening an architectural choice. If your plan contradicts an ADR, you need a new ADR that says why — not a silent reversal.

Check the open `ASSUMED:` list at the bottom of that file. If today's work is load-bearing on one of them, **confirm it before you build**, not after. Right now the load-bearing ones are: team roles and skills (1); LLM provider (2); web-app-vs-Power-Apps (4). There are no date assumptions: planning is by order and exit criteria (D-11).

---

## 5. Is any number, datum, or rule about to be duplicated, typed in, or changed without its twin?

This project's invariant: **a change here always needs a matching change there.** The silent failures are the ones that pass tests on one side only.

| If I… | …then I must also… |
|---|---|
| Show or phrase any RM / m³ / day figure | Source it from `core/`. Never type it into a UI string, prompt or fixture; never accept it from an LLM. |
| Add or change a field in the order / capacity / card schema | Update the synthetic generator, the sample files and the agents' extraction schema in the same change. |
| Change the allocation rule or a cost formula | Update the calculator tests and the PRD §4 / `context/03` §9 formula text together. |
| Add a data file | Add its `data/MANIFEST.md` row (source, licence, retrieved date or seed, kind `public` / `model-generated` / `synthetic` — never `real`). Ask `data-steward`. |
| Touch anything that runs in the browser | Confirm no secret or `NEXT_PUBLIC_*` key; LLM calls stay server-side. |
| Change what the solution does | Flag the deck and speaker notes (`context/10_DECK.md`, `11_SCRIPT.md`) as stale — the live deck is a Claude artifact outside this repo. |
| Present any figure | Label it illustrative or give its source. |

No hook enforces these yet — they can't be compared mechanically across two files. Hooks wait until a rule has actually been broken once.

---

## 6. Will I close the session properly?

`/session-end` — changelog entry, STATUS phase table, verification ledger, any new ADR.
The changelog entry is mandatory after any session that changed code, made a decision, or modified a plan. Even a one-line fix gets a one-line entry. And: do not commit unless the user asks.

---

## Quick links

| Doc | Purpose |
|---|---|
| `refdocs/STATUS.md` | Where the build actually is |
| `CLAUDE.md` | Operating brief — rules, constraints, stack |
| `refdocs/plant-load-radar-PRD.md` | Scope, architecture, roadmap, decision log |
| `refdocs/changelog/DECISIONS.md` | Settled calls — read before re-debating |
| `refdocs/guides/env_setup.md` | Every env var, where to get it |
| `refdocs/guides/checklist.md` | Pre-ship checklist |
| `refdocs/plans/` · `refdocs/execution/` | What/why · how/in what order |
| `refdocs/context/` | Founding pitch pack (read-only history) |
