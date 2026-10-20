# Super prompt: continue Plant Load Radar locally in Claude Code

> Paste everything under the line into Claude Code, opened in a fresh clone of `https://github.com/Azimlearning/plant-load-radar` (branch `main`, commit `e74381a` or later). Edit the two lines marked **YOU DECIDE** first. Written 2026-10-20 after the cloud session finished P5 to P11.

---

You are continuing development of **Plant Load Radar**, a demo/MVP built to pitch Chin Hin Group's "Capacity & Demand Intelligence" challenge (Kabel YEI 3.0). The cloud session finished everything that could be done without a model key, a browser on my machine, or my hosting accounts. Your job is to finish what is left, in order, with evidence, and stop when the **Definition of done** at the bottom is met.

## 0. Start here (do not skip)

1. Read `CLAUDE.md`, then `.claude/memory/preflight.md`, then `refdocs/STATUS.md`, then `refdocs/changelog/DECISIONS.md` (ADRs D-20, D-21, D-22 are the newest), then `refdocs/plans/2026-10-16-deck-parity-to-trl3.md` and `refdocs/execution/2026-10-16-p6-p11-build.md` (the "Status and deviations" section lists every known shortcut).
2. `npm install`, then confirm the baseline is green **before changing anything**: `npm test` (expect 449 passed), `npm run lint`, `npm run typecheck`, `npm run check:literals`, `npm run build`. If anything is red, that is your first task.
3. Copy `.env.example` to `.env`. It is missing five names the code reads; add them: `PLR_LLM_MODE=`, `PLR_LLM_MAX_CALLS=`, `PLR_LLM_RECORDINGS=`, `PLR_LEDGER_MODE=`, `PLR_LEDGER_PATH=` (descriptions in `refdocs/guides/env_setup.md`). Commit that fix to `.env.example`.
4. Use the project subagents in `.claude/agents/`: `test-runner` before claiming anything works, `ui-reviewer` after UI changes, `data-steward` for any data file or figure, `ceo-pitch-advisor` for the pitch and Q&A, `doc-keeper` at the end of every session.

## 1. What this is (so you do not re-derive it)

When a Starken AAC plant runs short, serve the request with more **ringgit at stake**: a Chin Hin project's cost of delay (late-handover damages: purchase price × 10% ÷ 365 a day, only past the deadline plus buffer) or an outside order's margin. A scheduler decides; the calculator prices both sides; four agents (Intake, Matching, Planner, Writer) do the legwork; nothing is sent or recorded without a named person. The deck is `refdocs/Docs/` plus the revised 15-slide PDF the user supplied (slides 3, 6, 7, 9, 10 are the ones the app must match). The app is Next.js 16 + TypeScript, deterministic core in `src/core/`, data in `data/` with a manifest row per file.

State on `main`: 15 routes (`/`, `/board`, `/inbox`, `/inbox/try`, `/decisions`, `/huddle`, `/ask`, `/calloffs`, `/outbox`, `/ledger`, `/finance`, `/value`, `/pilot`, `/sources`, plus `/finance/export` and `/do-image/[id]`). The scenario the app shows is `data/synthetic/deck-story.json` (weeks 41 to 46 as slide 9). `src/llm/` holds the model layer: **built and unit-tested against a scripted stand-in, never run against the real service.**

## 2. Non-negotiable rules (from `CLAUDE.md`; they are mechanisms, not preferences)

- **Numbers come from the calculator, never the model.** Every RM, m³ or day figure shown is computed in `src/core/` and passes through `Figures` in a view-model. LLMs only write or read words. Model text may contain no number that is not already in the template draft (`src/llm/writer.ts`). A new page needs a test that every figure on it is accounted for (copy the pattern in `src/app/personas.test.tsx`).
- **Nothing is sent or committed without a person.** No auto-send, no auto-approve. The outbox is simulated.
- **Chin Hin has given no data.** Every data file is `public`, `synthetic` or `model-generated`, has a row in `data/MANIFEST.md`, and loaders refuse a file without one. Never imply the demo ran on Chin Hin data. Label every figure **illustrative** or give its source.
- **Secrets never reach git or the browser.** The key is read only in `src/llm/anthropic.ts` (server). Never a `NEXT_PUBLIC_*` variable, never in a client component, never in chat or a commit.
- **Out of scope until the data is clean:** forecasting and letting AI decide allocation. Do not add them, even "a small forecast".
- **Plan before you build; log decisions as ADRs; update the changelog after every session; keep execution docs true.** Prefer the cheaper option and say so. Plan by order and exit criteria, never dates.
- Run the checks before saying "done", and put the commands and results in the changelog's **Verified** line. If you did not run something, say so.
- **Git:** work on branch `local-dev`. **YOU DECIDE (edit this line):** *Standing permission: commit and push to `local-dev` after each green phase; never push to `main` and never open a pull request until I say so.* (Without this line, ask me before every commit.)

## 3. The work, in order. Finish each phase's exit criteria before starting the next.

### L1. Prove the model layer for real (the one thing the cloud could not do)
- I will put `ANTHROPIC_API_KEY` in `.env` myself. Set `PLR_LLM_MODE=record`.
- Run `npm run eval:model`. It scores the model reader on the 22 invented messages against hand-written gold. **The number to watch is "Invented and confirmed": it must be 0.** Compare with the committed rules baseline in `refdocs/evals/rules-reader.md`. Write the live report to `refdocs/evals/model-reader-<model>-<date>.md` with the model id, token counts and cost.
- If accuracy or restraint is worse than the rules reader, tune the prompts in `src/llm/intake.ts` (system text only; never loosen grounding or the tier rules), re-run, and record each attempt. Raise the model (`PLR_LLM_MODEL`) only if the cheaper one cannot pass, and log why in an ADR.
- Exercise the photo reader on `/inbox/try` (both `data/synthetic/do-images/` samples) and the writer on `/decisions` with the mode `live`. Check: photo fields never exceed "inferred"; the writer's text never adds a number (look for the "template was kept" fallbacks and read why).
- Keep a handful of recordings locally (`.llm/`, gitignored) so rehearsals work offline with `PLR_LLM_MODE=replay`. Do **not** commit recordings.
- Exit: eval report committed; `STATUS.md`, the changelog and `refdocs/pitch/demo-notes-and-qa.md` (Q11) say honestly what the live run showed, including failures.

### L2. Browser quality pass on a real machine
- `npm run dev`; click every page at desktop and at a real phone width. Walk the five-minute script in `refdocs/pitch/demo-notes-and-qa.md` §1 exactly as a judge would, including the hosted-style cookie mode (`PLR_LEDGER_MODE=cookie`).
- Run the `ui-reviewer` subagent against slides 9 and 10 and the five personas on slide 6. Fix what it finds. Check keyboard-only use, focus order, form labels, colour contrast (the chart colours were chosen by measured colour-blind distance, ADR D-21; do not change them without redoing that check), and `prefers-reduced-motion`.
- Add a real end-to-end test (Playwright is available locally) for the money path: open `/decisions`, type a name, edit a reply, **Approve and send**, see the Outbox row, see the Finance row, see the board's "Decisions waiting" drop to 0. Keep `npm run smoke` as the cheap check.
- Exit: no console errors on any page; the e2e test passes; fixes logged.

### L3. Close the known gaps in the product
Pick up, in this order, each with a plan/execution note if non-trivial:
1. **Reserved slots on the board** (slide 7, guardrail 2): show them on `/board` with their release dates; they are only on `/huddle` and `/calloffs` today.
2. **A longer horizon for call-offs.** With six weeks, a call-off can only reserve Week 46. Extend the deck-story with quiet scripted weeks after 46 (keep weeks 41 to 46 exactly as slide 9 on screen, e.g. a "show more weeks" control), so the call-off form is not a one-option form. Re-check that a call-off can never change a recorded decision (`src/data/calloffs.test.ts` has the invariant).
3. **WhatsApp export import:** accept a pasted WhatsApp chat export (`[date, time] name: text` lines) on `/inbox/try`, split into messages, run the same pipeline. Rules reader first; add Bahasa Malaysia number words ("seribu lima ratus") to the rules reader with gold cases.
4. **Send to the huddle** as a stored state (a flag on the pending decision visible on `/huddle`), not just a link. Per-visitor store, same pattern as the outbox.
5. Anything in `STATUS.md` "Known gaps" you can close cheaply. Do not build new surfaces beyond these.

### L4. Data and honesty audit
- Run `data-steward`: every file in `data/` has a manifest row; no figure is hard-coded in code, prompts or UI strings (`npm run check:literals` plus a manual read of `src/llm/*.ts` prompts); every parameter has a provenance note; the seeded history and policy comparison are labelled illustrative everywhere they appear.
- Re-verify the public facts against their sources where you can reach them (Chin Hin filings, DOSM). Fix `data/public/*.json` and the manifest if a figure is wrong. The twelve deck references in `data/public/pitch-references.json` are transcribed, not re-read: spot-check three.
- Decide, with me, the one open modelling assumption that favours one side: outside margin uses the public PBT margin (ADR D-20), which is lower than a contribution margin. Show the sensitivity on `/value` or `/pilot` if it is cheap; otherwise leave it documented.

### L5. Deploy, then rehearse
- Redeploy to Vercel (`refdocs/guides/deploy.md`). Hosted mode uses per-browser cookies. **Leave `PLR_LLM_MODE=off` on any link I hand to strangers**: each model call spends my key (the per-run cap and a provider-console spend limit are the backstops; see `env_setup.md`). Verify the hosted site with `BASE_URL=<url> npm run smoke`.
- Run `ceo-pitch-advisor` over the pitch narrative and the Q&A sheet; apply only changes that keep every claim honest.
- Produce a backup of the demo I can use if the network fails: a screen recording script (list of clicks and timings) and, if I ask, a recording.
- Exit: deployed URL passes smoke; the demo notes match what the hosted site shows.

### L6. Repository hygiene
- Add a `README.md` for GitHub: what it is, the honesty statement (synthetic and public data only), how to run, the route map, the commands table, and a link to `refdocs/`.
- Triage `npm audit` (known: lint-toolchain findings; do **not** run `npm audit fix --force`, it downgrades `eslint-config-next`).
- `doc-keeper`: reconcile `STATUS.md`, plans, execution docs, the PRD's decision rows and `DECISIONS.md` with the code. Stale docs are worse than none.

## 4. Traps already hit (do not repeat)

- After `npm run build`, an old `next start` keeps serving the stale build with broken styling. Kill it by PID (not `pkill -f "next start"` inside a command containing that text) and re-check the served HTML for a new string.
- `npm run typecheck` runs `next typegen` first; bare `tsc` fails on a fresh tree. New routes need typegen before typecheck passes.
- Component tests render synchronously: an async server component inside a page breaks them. Counts for the nav are passed as props; keep that pattern.
- The figure-accounting tests strip ISO dates and week labels but nothing else: any digit in a UI string (a page title like "Month 1", an agent label like "4 Writer") must be registered with `fig.text(...)`, or the test fails. That failure is the mechanism working.
- `src/app` and `src/core` may not contain numeric literals of three or more digits outside a named SCREAMING_CASE constant (`npm run check:literals`); move such values into data or the view-model.
- Visitor state (ledger, call-offs, outbox) is a file locally and a cookie when hosted; cookie stores are capped near 3.5 KB. A change to a recorded week's inputs would make an old ledger row fail its re-derivation and vanish: keep call-offs away from decided weeks.
- Photo reads and model output are capped or guarded on purpose; do not "fix" a fallback by relaxing a guard.

## 5. How to work and report

- Work phase by phase. After each: run `test-runner` (tests, lint, typecheck, literals, build), run `npm run smoke` against `next start`, update the execution doc's deviations, add a changelog entry (what changed, decided, deviated, **Verified** with commands and results, noted-not-changed, next steps), and commit per the git line above.
- When two docs disagree (the deck, the PRD, the demo notes), stop and ask me with both passages quoted. When a decision is mine (a number's source, a colour, a scope cut), ask in one short question with your recommendation first.
- Keep answers short. Report in this shape: what is done and verified (with the command and result), what failed, what I must do (keys, accounts, decisions), and the next phase.

## 6. Definition of done

All of these are observable, and you list the evidence for each:
1. The model reader has been run live on the 22 samples and both photos; the report is committed; "Invented and confirmed" is 0, or the failure and the fallback are documented.
2. `npm test`, lint, typecheck, `check:literals` and build are green; the Playwright money-path test and `npm run smoke` pass locally and against the deployed URL.
3. Reserved slots appear on the board; call-offs have more than one week to choose from; WhatsApp export import works; "send to the huddle" is a stored state.
4. Every page is checked at phone width and by keyboard; `ui-reviewer` has no open blocking findings.
5. The manifest, the figure labels and the sources page are consistent with the code; the demo notes' walk-through matches the hosted site click for click.
6. `README.md` exists; `STATUS.md`, the changelog, plans, execution docs and ADRs describe what the code actually does.
7. The hosted link I share has the model layer **off** unless I said otherwise.

When all seven hold, stop and give me a final report; do not invent more features.
