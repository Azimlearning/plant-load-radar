# Architectural Decisions — Plant Load Radar

> Record decisions here so they aren't re-debated in future sessions.
> Format: **Decision** → **Why** → **Trade-offs / what was rejected**.
> Canonical one-line list lives in `refdocs/plant-load-radar-PRD.md` §7; this file expands the load-bearing ones under the same id.

An ADR is worth writing when the decision (a) is expensive to reverse, (b) will look arbitrary to a future reader, or (c) had a real alternative someone will propose again. Everything else is just a commit message.

Pitch-phase decisions (context D01–D24) are in `refdocs/context/05_DECISIONS.md` and are not duplicated here; the ones that bind the build are re-stated below under project ids.

D-05, D-06, D-08 and D-09 were first written earlier on 2026-10-08 and **revised the same day** after the user corrected the stack, data and timing assumptions. The superseded wording is described in each entry's "Revision" line and in the changelog.

---

## D-01 — The solution is Plant Load Radar 2.0 (2026-10-08, from context D13/D18/D20)

**Decision:** Build the rule + decision rights + board + 4-agent AI layer described in `context/03_PROJECT_PLANT_LOAD_RADAR.md`. Serve whichever request has more ringgit at stake; scheduler applies it weekly; 30-minute huddle for exceptions; one board of committed demand vs capacity.
**Why:** The real brief is about allocation, decision rights, messy data and cash outcomes — not forecasting. Won council rounds 2–4.
**Trade-offs / rejected:** Forecast dashboard (ignores the conflict; data too messy); knowledge-graph copilot (premature with paper/WhatsApp data); order-promising agent that decides (accountability); pricing/demand shaping (needs a transfer-price policy the brief rules out). See `context/06_COUNCIL_DEBATES.md`.

## D-02 — Forecasting and AI-decides-allocation are out of scope (2026-10-08, from context D19/D20)

**Decision:** No forecasting model and no automatic AI allocation in the MVP. The deck tells the panel both are "still premature"; the build must not contradict the deck.
**Why:** Data is on paper, WhatsApp and spreadsheets; someone must stay accountable for allocation.
**Trade-offs:** Less "wow" than a forecast chart. Mitigation: the agent layer and the "ask the board" Q&A carry the AI story. **Note:** D-06 allows a *trained model that generates realistic demo data*; that is data tooling, not a forecasting feature, and its output is never presented as a forecast.

## D-03 — Only the deterministic calculator produces displayed numbers (2026-10-08, from context D20)

**Decision:** Every ringgit / m³ / day figure shown to a user is computed by `src/core/`. LLMs write the words around numbers they are handed. A test (P3) asserts that numbers in agent output are a subset of calculator output.
**Why:** The pitch's central promise: "agents do the legwork, a calculator does the maths, people make the call." A model-produced figure would break it.
**Trade-offs:** Agents need tool-calling plumbing; free-text answers are constrained. Worth it.

## D-04 — Human checkpoint on every send and every ledger entry (2026-10-08, from context D20)

**Decision:** No auto-send, no auto-approve flag. The scheduler approves outgoing messages and ledger writes.
**Why:** Accountability; it is the guardrail the pitch showed (slide 7).
**Trade-offs:** One extra click per decision. Accepted.

## D-05 — MVP stack: a web app — Next.js + TypeScript, pure-TS core, file-based data (2026-10-08, revised same day; CONFIRMED)

**Decision:** Next.js (App Router) + TypeScript on Node, with npm. `src/core/` is pure TypeScript (no framework, no network, no LLM). Data are JSON/CSV files in `data/`, validated by zod at load time; the ledger is an append-only file. Tests with vitest; lint with ESLint and `tsc --noEmit`. Agent orchestration library (LangGraph.js vs the Vercel AI SDK) is chosen in P2 after reading current docs, with its own ADR. An optional Python + uv `pipeline/` exists only if a trained model is actually used (D-06). Power Apps / Excel / SharePoint / Power Automate remain the **production path** the deck describes, not part of the MVP.
**Why:** The user said they are unsure of the stack, that nothing is tied to Power Apps, and that "maybe it is simpler to use webapp tech stack". A web app is the simplest thing that gives a scheduler-grade screen and can be shown from a link; one language for core, agents and UI is cheaper for a team of 5 with unknown skills than two. Node 24.11.0, npm 11.6.1 and pnpm 10.12.1 are present on the lead's machine (checked 2026-10-08). The core being pure TS keeps it trivially testable and unable to call a model.
**Revision:** the first version of this ADR chose Python + uv + LangGraph + Streamlit. Replaced because the user prefers a web-app stack; Streamlit would also have pinned the team to Python for the UI.
**Trade-offs / rejected:**
- *Python + Streamlit:* fastest to a first screen for a data person, but a weaker "real product" feel and a Python-only team assumption. Rejected for the user's web-app preference.
- *Follow the deck exactly (Power Apps + SharePoint + Power Automate):* most faithful to slides 3 and 9, but licence- and tenant-dependent and hard for five people to parallelise. **Tension:** the deck says "built in Excel and Power Apps" — see PRD OQ-04.
- *Next.js front-end + Python (FastAPI) back-end:* clean split, but two deploys and two toolchains for a demo. Rejected (rule 8).
- *Database:* not needed for a demo on file data. **Caveat:** serverless hosts (including Vercel) have ephemeral/read-only filesystems, so an append-only ledger *file* will not persist when hosted. For the demo, either keep the ledger in memory/browser storage, or pick storage in P4 alongside D-09.
- *pnpm over npm:* pnpm is installed on the lead's machine, but npm ships with Node so teammates need nothing extra (rule 8).
**Scaffold settings (P0 Task 1):** `cacheComponents` and `partialPrefetching` (opt-in flags the scaffolder enabled) are turned **off** because they make server code stricter about dynamic data and this demo reads local files (rule 8); fonts use the system stack so the demo builds offline; `@types/node` is `^24` to match the runtime and satisfy vitest 5's peer range; vitest uses Vite's native `resolve.tsconfigPaths` instead of a plugin.
**Confirmed:** user, 2026-10-08: "for solution or tech stack just use most suitable." Claude's judgement is Next.js + TypeScript; no longer provisional. Reopen only with a new ADR (for example if it emerges that the team cannot work in TypeScript).

## D-06 — Data policy: Chin Hin gives no data; public, model-generated or synthetic only; no hard-coded data; manifest enforced (2026-10-08, revised same day)

**Decision:** Chin Hin has provided no data whatsoever and none is assumed. Every dataset in the project is one of:
- **`public`** — public information found by deep research (government statistics, filings, published rates, press), with URL, licence and retrieved date;
- **`model-generated`** — produced by a model *we* trained on public data, recorded with the model's training sources, code path, seed and limits;
- **`synthetic`** — seeded, config-driven, realistic data, recorded with its seed, config file and what it was calibrated to.

There is no `real` kind. Each file under `data/` has a row in `data/MANIFEST.md`; loaders refuse unmanifested files; no figure is hard-coded in code, prompts or UI. `data-steward` owns the manifest and does the research. The pitch must say plainly that the demo does not run on Chin Hin's data.
**Revision:** the first version preferred "real" data, reserved a gitignored `data/private/` for Chin Hin files, and treated Chin Hin sharing data as a possibility (old OQ-06). All of that is removed.
**Why:** User, 2026-10-08: "Chin Hin has given no data whatsoever; everything we will use will either be public information (you will deep research) or data from a model we trained or synthetic data." Honesty with the panel matters more than realism claims.
**Trade-offs:** Order-level plant data does not exist publicly, so the order stream will be model-generated or synthetic and the demo proves the *logic*, not the numbers. Mitigation: calibrate to public aggregates and say so. A trained model adds a Python/data toolchain and a model card to maintain — only build it if the research shows a defensible training source (rule 8).

## D-07 — One repo, one surface; pitch pack kept as read-only context (2026-10-08)

**Decision:** Single repo, single app. The 16 pitch-pack files are unzipped to `refdocs/context/` and treated as read-only founding context. When it conflicts with the PRD, the PRD wins and the conflict is surfaced.
**Why:** User asked to unzip the docs for the project; the PRD paraphrases them and paraphrase loses detail.
**Trade-offs:** Context files can go stale (e.g. interview date). Accepted; they are history, not status.

## D-08 — LLM behind one provider interface in `src/llm/`; cheapest workable model; provider ASSUMED Anthropic (2026-10-08, revised same day)

**Decision:** A single TypeScript module `src/llm/` is the only place that talks to a provider; the model name comes from `PLR_LLM_MODEL`; default to the cheapest model that passes the P2 extraction tests. Provider `ASSUMED:` Anthropic (`ANTHROPIC_API_KEY`); swappable. The key is read server-side only — never in a `NEXT_PUBLIC_*` variable or a client component.
**Revision:** was `llm.py` under the Python stack.
**Why:** User chose "small pay-per-use budget"; no provider was stated. Anthropic is a placeholder pending the team's call.
**Trade-offs:** The abstraction is more code than calling an SDK directly; it is small and keeps the budget lever and a provider switch open.

## D-09 — Deploy target deferred (2026-10-08, revised same day)

**Decision:** Build first; keep the app runnable locally with `npm run dev`; choose the deploy target in P4. A web app makes a hosted demo link straightforward (Vercel is the obvious candidate), but nothing is committed to it now.
**Why:** User: "decide later, build first."
**Trade-offs:** A hosted demo may take a day to set up late, and the ledger persistence caveat in D-05 must be solved then. Mitigation: keep the app stateless apart from files, and record a backup demo in P4.

## D-10 — Seven subagents (2026-10-08)

**Decision:** doc-keeper, feature-planner, test-runner, ui-reviewer (standard), plus **data-steward** (deep research on public data, the trained-model/synthetic pipeline, no hard-coding, owns `MANIFEST.md`), **ceo-pitch-advisor** (business side, best pitcher and advisor to win) and **idea-catalyst** (sharp ideas and honest feedback), as the user requested.
**Why:** Matches the work: a 5-person team, a data-honesty rule, and a pitch that decides the outcome.
**Trade-offs:** The catalog advises 2–4 because each definition costs context every session. Seven exceeds that; if the cost bites, drop `ui-reviewer` and `test-runner` first (tests run via plain `npm test`).

## D-11 — This is a demo/MVP for the pitch, and planning is by order, not by date (2026-10-08)

**Decision:** The product exists to make a convincing, honest pitch. Scope is the week-43 walk-through end to end on public / model-generated / synthetic data. Production concerns (auth, multi-tenancy, real WhatsApp or Power Automate integration, multi-plant, hardening) are out. Planning uses phase order and exit criteria only — no target dates, no deadline arguments.
**Why:** User, 2026-10-08: "its also just a demo/MVP for the pitching itself" and "its all rolling and flexible basis so don't focus on timing."
**Trade-offs:** Nothing forces a stop; scope creep is guarded instead by the hard constraints, PRD §5 Non-Goals and the "never build the second thing before the first is green" rule. If the team ever needs a date, the user supplies it.

## D-12 — Pitch framing defaults from the secondary research (2026-10-08)

**Decision:** Because the team could not answer OQ-13/14/16/17 (user: "not sure how to answer any of them"), these defaults apply until someone with better information overrides them:

1. **Capacity story (OQ-13):** never claim Chin Hin has a shortage today. Say: *"when capacity binds — in a specific plant, product or week — here is how the decision is made, and the same comparison tells you what to do with slack."* This combines framings 1 (scarcity is local) and 3 (the rule also directs spare capacity) from `research/01` §2. Framing 2 (ramp-up) is mentioned only if the third plant is confirmed as ramping.
2. **ERP (OQ-14):** present Plant Load Radar as the capture-and-decision layer *beside* the ERP: it handles WhatsApp/paper orders the ERP never sees, decides, and hands clean order lines and a decision ledger to whatever system of record Chin Hin uses. Never imply the ERP is Microsoft; never claim to replace or compete with Kingdee's AI Quotation Agent.
3. **Third plant (OQ-15):** do not state that 2.2M m³ is running. Say "once the third line is at full rate" and use the 1.2M m³ figure for anything described as today.
4. **LAD (OQ-16):** present RM82k/day only as a labelled upper-bound illustration. Do not state that a materials delay *causes* LAD; say it *can* contribute where a unit's handover would pass its deadline. Add a schedule-sensitivity factor to the delay-cost card in P0.
5. **Autonomy ladder (OQ-17):** adopt it. Stage 1 (the demo): agents prepare, a person approves. Stage 2 (shown as roadmap only): auto-approve inside a ringgit threshold once the ledger shows the rule matches human choices. Stage 3: autonomous within guardrails. The demo builds Stage 1 only (consistent with D-02/D-04); Stages 2–3 are a slide, not code.

**Why:** the research (`refdocs/research/`) shows each default is the safest honest reading of public evidence: capacity is being added into a soft market (so a shortage claim is attackable); Chin Hin is deploying a Kingdee ERP with AI agents; the third plant's status is unconfirmed; LAD mechanics are per buyer and post-deadline; and Chin Hin's own AI ladder ends in agentic workflows, so "premature" reads better as a stage gate.
**Trade-offs:** (1) is less dramatic than "plants are overloaded"; (4) weakens the biggest number on slide 4 — a judge who attacks it finds it already caveated; (5) promises a roadmap the team won't build. All are cheaper than being caught overclaiming.
**Still open (facts, not choices):** whether the third plant is commissioned (OQ-15) and whether materials shortages extend LAD (OQ-16) — find out via `data-steward` (company releases, Bursa filings) and, for LAD, a short legal read or a Chin Hin question at the pitch.

## D-13 — How the allocation rule is implemented (2026-10-08, P0 Tasks 6–7)

**Decision:** `src/core` implements the rule from context `03` §2 with these precise meanings:
1. **Value at stake = RM lost by deferring a request one more week.** Internal: `slipCostRM(card, 7)` — days of handover slip beyond *deadline + buffer*, times (price × 10% ÷ 365 + idle site cost). External: contribution margin + loss risk. The context example compared "RM82k per day" with "RM18k total"; pricing both as the cost of one more week makes them comparable (the example still holds: ≈RM575k vs RM18k).
2. **Schedule sensitivity (0–1)** is the days of handover slip caused by one day of material delay; delay cost applies only to the part of the slip that crosses deadline + buffer. This implements the "labelled upper bound" decision in D-12: RM82k/day is what you get at sensitivity 1 with the whole block past its deadline.
3. **Close call:** `abs(a − b) ≤ 10% × max(a, b)`. The group of requests within the band *of the current highest value* is ranked by earliest confirmation date, then id. A pairwise banded comparison is not transitive (A≈B, B≈C, A≉C) and would make results depend on sort internals.
4. **Weekly, whole-request, work-conserving:** weeks are processed earliest first; committed capacity (firm orders + active reservations) is never taken back; a request that does not fit carries into the next week and competes again (move before refuse; "unplaced" only if no week in the horizon has room); if the top-ranked request does not fit, a smaller lower-ranked one may still be served so capacity is not left idle. Requests are never split.
5. **Reservations** lapse after their release date unless the call-off is confirmed; a confirmed call-off is a firm order, so it is not also counted as a reservation.
6. **Pre-build** (AAC only, caller decides) fills short weeks from the nearest earlier spare without ever holding more than a stock cap at the end of any week.
7. **Weeks are ISO labels** (`"2026-W43"`), compared as strings; dates are ISO `YYYY-MM-DD`, computed in UTC.

**Why:** each choice removes an ambiguity that would otherwise be decided silently in code; all are covered by tests, and five deliberately planted bugs were each caught by the suite (boundary off-by-one, close-call band, delay-cost start day, reservation lapse, committed capacity ignored).
**Trade-offs / rejected:**
- *External value = full margin* is pessimistic: if the customer merely waits a week, the margin is not lost. It biases the rule slightly toward outside orders, i.e. toward the plant's commercial side, and the deck's example is unaffected. Alternative (probability-weighted loss) needs data we do not have. **ASSUMED** until a better basis exists.
- *Splitting requests* across weeks: more realistic for divisible product, but ranks and prices get ambiguous; rejected for the demo (rule 8).
- *Strict priority (never serve a lower-ranked request first)*: can strand capacity; rejected in favour of work-conserving.
- *Weekly granularity*: ready-mix is dispatched daily and precast by mould slot; the same code can run on days or slots by changing the label, but only weekly AAC is shown.

## D-14 — No trained model for demo data; seeded synthetic generator calibrated to public series (2026-10-08, P0 Task 4)

**Decision:** The demo's order stream and cards are produced by a plain, seeded, config-driven generator (`synthetic`), calibrated to the public series in `data/public/`. No model is trained and `pipeline/` is not created. The `model-generated` data kind stays legal in the manifest for a future case.
**Why:** The OQ-11 gate (D-06) required a defensible public training source. Task 4 found none: no public plant-, order- or utilisation-level data exists (see the manifest's "Searched and not found" table), and the public series that do exist are aggregates — 46 quarterly points of construction GDP and about 390 monthly points of one price index. A model trained on 46 points would add a Python toolchain and a model card while adding no information a seeded generator with documented parameters does not already carry, and it would be harder to explain to a panel. Rule 8: prefer the cheaper option.
**Trade-offs:** The generator's demand dynamics are assumptions anchored to public aggregates (scale, regional split, seasonality, price trend), not learned from data; the pitch says so. Revisit only if a genuine order-level public dataset appears.
**OQ-10 verdict:** order-level data is not findable. **OQ-11 verdict:** a trained model is not justified.

## D-15 — How the board is built and what it will and will not show (2026-10-08, P1)

**Decision:**
1. **View-model + dumb component.** `src/data/board.ts` computes and formats everything; `src/app/board.tsx` only lays out strings from it and does no arithmetic. Every number is produced through a `Figures` registry that records it, and a test renders the page to HTML and fails if any figure a reader can see or hear (text, tooltips, aria labels) is missing from the registry. This is hard constraint #1 made mechanical in the UI. It was checked by planting a typed-in `RM246,000` and a computed number in the component; both were caught.
2. **Only KPIs with a real source today.** Weeks short, decisions waiting and largest shortage are shown. The deck's "protected this month" and "orders to check" tiles are **left out**, not stubbed with zeros: they need the ledger (P3) and intake (P2) and would otherwise be invented numbers.
3. **Approve and Change are inert**, visibly disabled with the reason beside them. Writing the ledger is a later phase and must be human-gated (D-04); a live-looking button that does nothing would mislead.
4. **Pre-build is a shown alternative, not hidden and not the default answer.** The card leads with the rule's decision given today's capacity and then shows what building ahead (within a stock limit) would change. The stock limit is an **assumed, visible parameter** (`planner.stockCapM3` = 1,000 m3). Measured on the committed scenario: below 500 m3 Contractor B is still pushed out; from 500 m3 B is served but two other requests are pushed instead (building ahead changes who loses, not only whether someone does); at 2,000 m3 or more the week-43 contest disappears. The cap is set where the contest remains, and this is stated on screen.
5. **A hand-written SVG chart, no chart library.** A diverging bar (spare above the line, short below) per the dataviz skill: two poles validated with the skill's script in light and dark (CVD separation ΔE about 19 to 22), bars at most 24px with rounded data ends, hairline solid grid, direct labels only on short weeks and the largest spare week, a legend, and a table twin. Short versus spare differs by direction and label, not colour alone. Text never wears a series colour (a small red label failed contrast at 3.85:1 in light mode and was changed to a text token with a red dot).
6. **Static page.** `/` is prerendered at build from the committed scenario through the manifest-enforcing loader; no runtime file reads.

**Why:** the pitch's promises are "numbers come from the calculator" and "people make the call"; each choice above keeps the screen from quietly breaking one of them, and the plan's own risk table named the pre-build question as the thing most likely to make the demo dishonest.
**Trade-offs / rejected:** a chart library (more weight, harder to verify); a client-side week selector (the page would stop being static and the honesty check would need a browser); showing pre-build's stock cost in ringgit (needs a placeholder price and a low-authority carrying rate, so it would overstate precision); stubbing the two missing KPIs (fabrication). The phone layout scrolls the chart sideways (with a hint) rather than shrinking text to unreadable size.

---

## Working assumptions (`ASSUMED:`)

Not decisions — guesses made to keep moving. Each one must be confirmed or killed before anything load-bearing is built on it. When one is resolved, delete it here and write a real ADR above.

1. **ASSUMED: team of 5 (Azim as lead); roles and skills unknown.** Module ownership waits on this (PRD OQ-02).
2. **ASSUMED: LLM provider is Anthropic** (D-08); budget figure unknown (OQ-05).
3. **ASSUMED: hosted LLM APIs may see any project data.** The user said so earlier; it is now low-stakes because the project holds only public, model-generated and synthetic data.
4. **ASSUMED: the web-app MVP satisfies the panel** although the deck promises Power Apps (OQ-04).
5. **ASSUMED: Node (current LTS or later) and npm are installable on all five machines** (OQ-09). Confirmed only on the lead's: Node 24.11.0, npm 11.6.1.
6. **ASSUMED: no auth, multi-tenancy or database needed** — demo scope (D-11).
7. **ASSUMED: the 6 Oct pre-interview was passed and the team is formed** (user: "passed, I have a team"); Kabel's next dates are unknown and deliberately not planned around.
8. **ASSUMED: platform deliverables (proposal PDF + 3–5 min video, 16 Oct) are still not required** (context D14, pre-interview); unconfirmed now (OQ-03).
9. **ASSUMED: ordinary laptops, no GPU.** If a trained model is built (D-06) it must be small enough to train on CPU or on a free notebook tier.
10. ~~ASSUMED: a defensible public training source may not exist.~~ **Resolved by D-14:** none exists; plain synthetic data it is.
11. **ASSUMED: external order value = contribution margin + loss risk (full margin treated as at risk when deferred).** Pessimistic; see D-13.
12. **ASSUMED: a stock limit of 1,000 m3 for pre-build** (about a third of a day of nominal output). It decides whether the week-43 contest survives, and it is shown on screen. See D-15.
