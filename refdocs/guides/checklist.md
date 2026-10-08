# Pre-Ship Checklist — Plant Load Radar

> Run the relevant section before pushing, deploying, or calling a phase done.
> Not every item applies to every change — use judgement based on what actually changed. But read the list; that's where you notice the thing you forgot.

---

## Every change

- [ ] **It was actually run.** Not "it compiles" — executed, and the result observed. If it wasn't run, say so rather than implying otherwise.
- [ ] **Build passes** — `npm run build`
- [ ] **Tests pass** — `npm test` *(only smoke tests exist until P0 Tasks 2–7 land; tracked in STATUS Known gaps)*
- [ ] **No hard-coded figures** — `npm run check:literals`
- [ ] **Lint and types clean** — `npm run lint` and `npm run typecheck` (not bare `tsc`; it needs `next typegen` first)
- [ ] **No secrets staged** — `git status` shows no `.env*`; no key literal in the diff
- [ ] **No stray debug output** left in the diff — print statements, commented-out experiments
- [ ] **Changelog entry added** — `refdocs/changelog/CHANGELOG.md`, including an honest **Verified** line
- [ ] **STATUS.md reflects reality** — the phase table doesn't round up, and the verification ledger has a row for what you just ran
- [ ] **Docs match what you built** — if the work diverged from the execution doc, that doc is edited, not left stale

---

## Numbers and data (this project's invariants)

- [ ] **Every displayed figure traces to `core/`.** No RM / m³ / day literal in `app/`, `agents/` prompts, or UI strings.
- [ ] **No hard-coded data.** New data file → row in `data/MANIFEST.md` (source, licence, retrieved date or seed, kind `public` / `model-generated` / `synthetic`). There is no `real` kind — Chin Hin gave us no data.
- [ ] **Never implied real.** Nothing in the UI, docs or script suggests the demo ran on Chin Hin's data.
- [ ] **Every figure labelled** illustrative or carrying a source — in UI, docs and any slide you touch.
- [ ] **No key in the browser.** No `NEXT_PUBLIC_*` secret; the LLM key is read in server code only.
- [ ] **Schema change?** Generator, sample files and the agents' extraction schema all updated in the same change.
- [ ] **Rule or formula change?** Calculator tests and the PRD / `context/03` formula text updated together.
- [ ] **Solution changed?** Deck and speaker notes (`context/10_DECK.md`, `11_SCRIPT.md`) flagged as needing an update — they live outside this repo as a Claude artifact.

---

## New dependency

- [ ] Recorded in `refdocs/plant-load-radar-sources.md` with its license and why it was chosen
- [ ] License is compatible with this project's distribution
- [ ] Its actual docs/types were read — the API was not recalled from memory
- [ ] Considered-and-rejected alternatives noted, so nobody re-derives that comparison

---

## New environment variable

- [ ] Added to `refdocs/guides/env_setup.md` with where to get it
- [ ] Added to `.env.example` with a blank/fake value
- [ ] Set in the deploy target's dashboard, if there is one
- [ ] Missing-variable case fails loudly at startup, naming the variable

---

## Architectural decision

- [ ] ADR in `refdocs/changelog/DECISIONS.md` — Decision → Why → Trade-offs/rejected
- [ ] Same id added to the PRD's §7 Decision Log
- [ ] Any `ASSUMED:` it resolves is deleted from the assumptions list

---

## Before the pitch demo (P4)

- [ ] Full demo runs end to end from a clean clone on a second machine
- [ ] Backup recording exists in case the network or LLM provider fails
- [ ] Every number on screen is labelled illustrative or sourced; none is presented as Chin Hin's
- [ ] LLM spend checked against the budget; no key in the repo or the screen share
- [ ] Deploy target decided (D-09) and the hosted link, if any, opened in a private window
- [ ] Q&A rehearsed with `ceo-pitch-advisor` against `context/12_INTERVIEW_PREP.md`
