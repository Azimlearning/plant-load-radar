# Plan — Deck parity and the road to TRL 3

> Written 2026-10-16 from the revised pitch deck (`KABEL_Plant_Load_Radar.pdf`, 15 slides, "Revised pitch · October 2026") compared with the running prototype (P0–P3 + P4a, 318 tests). Execution docs are written per phase, when a phase is approved; none exist yet. Planning is by order and exit criteria, no dates (D-11).

## Why this exists

The deck was revised after the prototype was built. It now promises things the prototype does not do (a call-off form with reserved slots, a weekly huddle view, photo and spreadsheet intake, a live four-agent layer, editable "Approve and send" drafts, finance audit views), and three of its headline numbers differ from the prototype's. The user wants one prototype that *is* the deck: every slide-9 and slide-10 screen clickable, themed like the slides, at roughly **TRL 3** (proof of concept: each key function demonstrated end to end on representative, labelled data; not yet validated against a real plant).

"TLR 2 or 3" is read here as **TRL** (technology readiness level). ASSUMED; confirm.

| Level | Meaning here | Where we are |
|---|---|---|
| TRL 2 | Concept formulated, parts exist on paper | Agent layer (rules reader only, no model has run) |
| **TRL 3** | Each deck feature demonstrated in a working analogue, on synthetic or public data, with an eval | **Target** |
| TRL 4 | Components validated together in a lab with realistic data | Out of reach without Chin Hin data (pilot's job) |

## What's already covered (no work needed)

Calculator and rule (ringgit at stake, float, 10% close call, confirmed never bumped, move-before-refuse, reservations lapse in the core), planner with build-ahead, board with chart and decision card, orders inbox with a rules reader (confirmed / inferred / missing / conflicting, grounding, matching, duplicates, prompt-injection flagged, Bahasa Malaysia samples), approve-or-change with a server-recomputed ledger, templated huddle brief and reply, capacity-only "ask the board", a labelled cost-of-today page, synthetic-banner honesty tests, Vercel deployment with a per-browser ledger.

## Gap analysis, slide by slide

Legend: ✅ matches · 🔶 partly · ❌ missing · ⚠️ contradicts the deck.

### A. Numbers that contradict the deck (surface first; CLAUDE.md says do not resolve silently)

| Where in deck | Deck says | Prototype shows | Cause |
|---|---|---|---|
| Slides 3, 7, 9, 10 Project A | **RM145k a day** (Avantro RM530m GDV × 10% ÷ 365 = RM145,205), 3 days slip = **RM435k** | RM82,192 a day (RM300m), one more week = **RM575,342** | Scenario uses RM300m and a 7-day slip |
| Slides 3, 7, 9 Contractor B | **RM18k** (10.8% × an illustrative RM167k order) | **RM30,705** | Placeholder margin per m³ |
| Slide 9 chart | Weeks 41–46: +1,200 · −700 · −2,000 · +4,100 · +2,500 · +1,000; two short weeks, W42 covered by pre-build | 12 weeks; one short week; W42 +1,859; W44 +3,279 | Generated scenario |
| Slide 9 tile | "Delay cost avoided, Oct **RM246k**" | Removed on purpose (nothing measured) | Honesty rule 7 |
| Slide 10 reply | "...we can deliver from **Mon 26 Oct**" | "We can offer Week 44" | Template has no calendar date |
| Slide 7 example 2 | Same week, Project A has **20 days of float** → cost RM0 → serve Contractor B | Float case shown only for Projects C and D | No what-if control |

Note the deck rounds: RM145,205 × 3 = RM435,616, shown as "RM435k" (145,000 × 3). The prototype must pick one and say which.

### B. Feature gaps

| Slide | Deck promise | Status | Gap |
|---|---|---|---|
| 6 Scheduler | Board, daily | ✅ | — |
| 6 Plant manager | Huddle brief, weekly | 🔶 | Brief is a text block on `/decisions`; no huddle page, agenda, 30-minute frame |
| 6 Sales executive | Ask the board, drafted replies | 🔶 | Ask is a week+volume form (capacity only); deck asks in plain words ("800 m³ for Johor next week") and answers with where there is room and what breaks |
| 6 Project director | **Call-off form, reserved slots** | ❌ | Core supports reservations; no form, no data entry, no board display |
| 6 Group finance | Decision ledger, monthly | 🔶 | Ledger exists; no monthly view, filter, export, audit flags, or "credit to the plant" line |
| 7 Guardrails | Reserved slots 4 weeks ahead; unused released; close call → first confirmed | 🔶 | Logic yes; nothing on screen shows a reservation, its expiry, or why a close call went one way |
| 7 | Fill quiet weeks (pre-build within stock limit) | ✅ | Deck W42 case (700 covered) not in the scenario |
| 8 Sources | WhatsApp text | ✅ | Static samples only; no "a message arrives" |
| 8 Sources | **Photos of paper DOs** | ❌ | No vision path, no sample images |
| 8 Sources | **Kingdee sales orders**, programmes, capacity | ❌ | No spreadsheet/CSV import |
| 8 Agents | Intake (vision + schema check), Matching, Planner, **Writer (generative AI)** | 🔶 | Rules reader, rules matcher, planner ✅; **no LLM code, no `src/llm/`, no Writer model**; no agent trace |
| 8 Guardrails | Every field shows source and **confidence score** | 🔶 | Four states with reasons, no score; fine if we say "state", better with a visible source span plus score |
| 8 Checkpoint | Approve / change / send to huddle | 🔶 | Approve and Change ✅; **"send to the huddle" ❌**; Edit of drafts ❌ |
| 8 Outputs | Replies via WhatsApp/Teams · Write-back to Kingdee | ❌ | By design no send; need a simulated outbox and a write-back preview file |
| 9 Board | Left nav with counts, 4 tiles, chart + card, inbox strip with channel chips and Firm/Likely tags, "Updated 9:42 · 3 new orders read" | 🔶 | Layout is close; counts, channel chips, status line and the deck's tile set differ |
| 10 Step 2 | Clean order card with Sure / Check chips | ✅ | Wording differs (Confirmed/Inferred) |
| 10 Step 3 | Huddle brief + reply + **Approve and send / Edit**, ledger saved | 🔶 | Single "Record decision"; no editable drafts, no outbox |
| 10 "Unsure?" | Asks the project planner to confirm | ❌ | No clarification draft |
| 11 Pilot | Baseline vs result: delay days, bumped orders (zero), stock days, huddle minutes | ❌ | `/value` is cost-of-today only; no scorecard shell |
| 12 Risks | Finance audits ledger monthly; served group orders credited | 🔶 | See finance row |
| 15 Appendix | Sources and assumptions behind every number | 🔶 | Spread across `/value` and data manifest; no in-app page |
| Theme | Dark-green gradient title, white cards, mint tints, "Label: **title**" headings, Arial | 🔶 | App is light shell with brand green; no hero, different type |

### C. Things the deck should not claim and we should not build (unchanged)

Forecasting, AI choosing allocation (D19/D20), real WhatsApp/Power Automate/Kingdee connections, multi-plant, auth. Power Apps / Power BI / Foundry stay "production path"; the web app is the MVP (D-05).

## Brainstorm: ideas worth the effort (ranked by demo value per cost)

1. **"A message arrives" simulator** — paste or pick a WhatsApp message; watch it become an order card; the sidebar badge and the "3 new orders read" line update. It is slide 10 made live. Cheap: the pipeline exists.
2. **Agent trace panel** — for any message, show the four steps (Intake → Matching → Planner → Writer), each with its input, output, source span, confidence and which tool did the maths. Makes "four agents" visible without an orchestration framework.
3. **Float what-if** — a control on Project A: "float: 0 / 20 days". At 0, serve A; at 20, A costs RM0 and B is served (slide 7's second example). The strongest 20 seconds of the demo.
4. **Huddle mode** — one page for the plant manager: agenda built from open exceptions, a 30-minute timer, decisions recorded as they are made. Proves "under 30 minutes".
5. **Call-off form → reserved slot** — a project director confirms 1,500 m³ four weeks ahead; the board shows a reserved band; an unused reservation visibly lapses. Proves the incentive to plan ahead.
6. **Editable drafts with Approve and send → outbox** — nothing leaves; "sent" goes to an outbox page (a Teams/WhatsApp mock), still human-approved (hard constraint 2).
7. **Plain-words Ask the board** — "800 m³ for Johor next week": rules parser first, model second; answer from the calculator (slide 10 wording: "Yes in week 44 (4,100 m³ free). Week 43 would go 2,800 m³ short").
8. **Finance month view** — filter by month and side, "ringgit at stake" per decision, CSV export, a flag when one side wins repeatedly (answers the "internal always wins" judge question).
9. **Pilot scorecard shell** — the four slide-11 metrics, baseline column empty by design ("measured in month 1"), so the page proves the measurement plan without claiming a result.
10. **Policy replay (optional, label heavily)** — replay the same synthetic weeks under "first come", "internal first" and "ringgit at stake"; show ringgit at stake on each. Strong TRL 3 evidence; **risk:** reads as a benefit claim, so it must say it is a synthetic world and the result depends on invented inputs.
11. **Paper-DO photo and Kingdee CSV intake** — synthetic images (we generate them) and a sample export; vision model reads, grounding checks against the image text.
12. **Source and assumption page** — slide 15 as a page, generated from `MANIFEST.md` and the value inputs, so it cannot drift.

## Scope

**In (ordered phases; each ends with exit criteria):**

| Phase | Goal | Exit criteria (observable) |
|---|---|---|
| **P5 Deck-story scenario** | The live board shows the deck's numbers | A "deck story" scenario preset (weeks 41–46 exactly as slide 9; Project A priced from RM530m GDV, 3-day slip; Contractor B from the RM167k order at the segment margin; W42 covered by pre-build; W44 +4,100). A test pins every slide-7/9/10 figure. The float what-if works. Reply carries "Mon 26 Oct". ADR D-20 records the rounding choice and supersedes the demo-notes mismatch table. The general generator stays for stress tests. |
| **P6 Slide theme** | The site looks like the deck | Title/landing page with the dark-green gradient hero; headings in "Label: **title**" style; mint tint cards, green pills, nav with counts; the four slide-9 tiles; channel chips; "Updated … · N new orders read" line. Side-by-side with slide 9 at 1440 px and 390 px passes the `ui-reviewer`. Contrast re-computed. Chart colours decided (see Decisions). |
| **P7 Persona views** | Each of slide 6's five people has a route | Scheduler: board. Plant manager: huddle mode. Sales: plain-words ask + editable drafts + outbox. Project director: call-off form + reserved slots shown on the board. Finance: monthly ledger view + export. A walk-through script touches all five in under five minutes. |
| **P8 Live capture** | Slide 10 step 1→2 happens in front of the judge | Message simulator and agent trace panel; spreadsheet (Kingdee-style CSV) import; clarification draft to the project planner; "send to huddle" outcome on the checkpoint. |
| **P9 Model layer** | The four agents are real, behind the same guards | `src/llm/` provider interface (server only, key from env); model Intake and Writer on the 22 samples; grounding check still runs on every model output; **test that every number in model output is a subset of calculator output** (promised for P3, unbuilt because no model ran); record/replay fixtures so the demo works without a key; cost cap and kill switch; eval table (field accuracy, ungrounded-value rate) in the repo. Photo-DO vision here if the key and budget allow. |
| **P10 Pilot scorecard + sources** | Slides 11, 12, 15 exist in the app | Scorecard shell with the four metrics and empty baselines; sources/assumptions page generated from the manifest; optional policy replay behind a "synthetic world" label. |
| **P11 Pitch-ready** | Rehearsed and recoverable | Demo script rewritten against the new deck; end-to-end smoke test (Playwright) of the five-persona path; reset works; backup video or screenshots; deployed and viewed on a phone; STATUS and changelog reconciled. |

Minimum for a credible TRL 3: P5, P6, P7, the simulator and trace part of P8, and a minimal P9 (model Intake + Writer with replay). Everything else is "should" or "could".

**Out (with reasons):** forecasting and AI-decided allocation (D19/D20); real WhatsApp, Power Automate, Teams, Kingdee, Power BI connections (no access; the constraint "nothing is sent without a person" is easier to prove on a mock); auth and multi-tenancy (D-11); rebuilding in Power Apps (D-05).

## Approach

- One cheap change at a time, tests first. New scenario is a **preset beside** the generator, not a replacement, so the 318 tests and the stress cases survive.
- Every new figure comes from `src/core/`; every new data file gets a manifest row (kind `synthetic`); `check:literals` stays green.
- Reservations, close-call and float already live in the core: P7 mostly adds forms and views, not rules.
- Orchestration stays a plain typed pipeline unless the user wants LangGraph.js literally (cheaper, easier to read; deck's own slide 8 says "LangGraph **or** Microsoft Foundry").
- Model choice: cheapest workable (Haiku-class) first; one provider interface; cached responses for the demo.

## Risks & unknowns

| Risk | Confidence | Mitigation |
|---|---|---|
| Aligning to the deck's RM435k hides that it uses an upper-bound GDV | High | Keep the "upper bound" label from slide 3/7 footers on screen; same footnote text as the deck |
| Changing the scenario breaks many committed-scenario tests | High | Preset beside the generator; pin the new numbers with a new test file |
| Green/red chart fails colour-blind check (measured ΔE 5.8 under protanopia, ADR D-19) | High (measured) | Keep blue/red, or green/red with value labels, direction arrows and a pattern on short bars; re-validate |
| A model call can return a number we then display | High | Existing hard constraint; the subset test plus grounding; server ignores form figures |
| No API key or budget yet | Unknown | P9 comes last among must-haves; record/replay means P5–P8 never wait for it |
| Policy replay read as a benefit claim | Medium | Optional; labelled; CEO-advisor review before showing |
| DO-photo vision is the costliest, least certain piece | Medium | Synthetic generated images first; skip for TRL 3 if budget is tight |

## Definition of done (whole plan)

- Every slide-9 and slide-10 screen can be reproduced by clicking, with the deck's numbers on screen and the same footnotes.
- Each of the five personas has a working route and a stated deliverable from slide 6.
- A pasted message becomes an order card, a priced decision, an approved draft in an outbox, and a ledger row, with a visible agent trace.
- With a key, the model Intake and Writer run on the sample set and an eval table is committed; without a key, the same demo runs from recorded fixtures.
- `npm test`, lint, typecheck, `check:literals`, build all pass; the changelog's **Verified** line names the commands.
- Nothing in the app implies Chin Hin's data or a measured benefit.

## Decisions (answered by the user 2026-10-16)

1. **Align to the revised deck's numbers: yes.** Done in P5 (ADR D-20).
2. **TRL target: left to us ("maybe, what do you think, since it's for pitching").** Recommendation: **TRL 3, stated plainly** ("each part demonstrated end to end on synthetic and public data, with tests and an eval"), because a pitch gains nothing from claiming TRL 4 without Chin Hin's data and a judge can puncture it with one question. The eval table (P9) and the end-to-end test (P11) are the evidence. ASSUMED until the user confirms.
3. **LLM key: the user can provide one; small pay-per-use is fine.** Needed only for P9. The key goes in the host's environment variables and `.env`, never in chat or git (`env_setup.md`).
4. **Chart colours: the answer was "yes" to an either/or question.** Read as "follow the slides" (green and red), but not applied: P6 will render both versions side by side and re-run the colour-blind check, and the user picks. ASSUMED.
5. **Capture scope: include paper-DO photos and the Kingdee-style CSV.** Both go into P8/P9; photos last (they need the key).
6. **RM246k tile: seeded or simulated history is fine.** Built in P7 (finance view) as a clearly labelled, seeded demo history, never as a measured result.

## Outcome (2026-10-16)

P5 to P11 were built in one session, in order, each ending with the full checks. Deviations from this plan: the Kingdee-style intake is a CSV the user pastes or the sample file, mapped by column name (the real export layout is unknown); the photo path reads two invented, drawn delivery orders and is capped at "inferred"; call-offs can only reserve a week four or more weeks ahead, which in the six-week horizon is Week 46; the policy comparison is one synthetic week, labelled; "send to the huddle" is a link, not a stored state; the live model path is built but unrun. Chart colours: deck green with a hatched coral (ADR D-21), not the deck's red, to keep the colour-blind check passing.
