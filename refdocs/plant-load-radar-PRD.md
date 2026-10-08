# Plant Load Radar — Product Requirements Document (PRD)

> Plant Load Radar is a demo/MVP, built to pitch Chin Hin Group's "Capacity & Demand Intelligence" challenge in Kabel's YEI 3.0 programme. When a Chin Hin building-materials plant (AAC, precast, ready-mix) can't serve every request, it decides who goes first by the ringgit at stake — an internal project's cost of delay versus an outside order's margin — applied weekly by the plant scheduler, on one board that shows all committed demand against capacity. A 4-agent AI layer (Intake, Matching, Planner, Writer) does the legwork; a deterministic calculator does the maths; people make the call.

- **Owner:** Fakhrul Azim Bin Ahmed Mardzukie (Azim) — team lead
- **Users:** In the story: the plant scheduler / plant supervisor (daily), the plant manager and project director (weekly huddle), group finance (monthly review). In reality: the pitch audience (Kabel screeners and Chin Hin's panel) watching a demo. Build team: 5 including Azim (roles and skills `ASSUMED:` not yet known).
- **Status:** Scaffolded 2026-10-08, revised the same day — pre-implementation
- **Last updated:** 2026-10-08
- **Source of record:** [plant-load-radar-sources.md](plant-load-radar-sources.md)
- **Founding context:** `refdocs/context/00_README.md` … `15_ARTIFACTS_AND_FILES.md` (16 files; the pitch pack as of 5 Oct 2026). Most load-bearing: `02_PROBLEM_STATEMENT.md` (the brief), `03_PROJECT_PLANT_LOAD_RADAR.md` (the solution), `04_RESEARCH.md`, `05_DECISIONS.md`. Secondary research: `refdocs/research/`.

---

## 1. Context & Hard Constraints

These are confirmed from the Chin Hin brief (`context/02_PROBLEM_STATEMENT.md`), the solution spec (`context/03`), and the user's answers of 2026-10-08, and they drive every downstream decision.

| Constraint | Value | Consequence |
|---|---|---|
| No new ERP | Brief | The board runs on plain files; no system of record is introduced |
| No consultant | Brief | Everything must be operable by the plant scheduler without outside help |
| No head-office transfer-pricing policy | Brief | The weekly ringgit comparison acts as the shadow price of capacity; no internal price list |
| No escalation to impose a rule | Brief | The scheduler owns decisions within the rule; exceptions go to a 30-min huddle, not upwards |
| Brief's timeframe | 12 weeks (brief); about 3 months at one plant (rollout) | The pitched rollout shows one plant, AAC first; precast / ready-mix are a go/no-go after the pilot |
| Success measure | Cash released from excess stock, outside margin no longer lost, project delay days avoided | Never logins, satisfaction or adoption; the ledger records ringgit |
| Data | **Chin Hin has provided no data and none is assumed** (user, 2026-10-08). Only `public`, `model-generated` and `synthetic` data are used. | Demo proves the *logic*, not the numbers; the pitch says so plainly; the schema still accepts real data later with no logic change |
| Scope | Demo/MVP for the pitch itself (user) | No production concerns; see §5 |
| Timing | Rolling and flexible (user) | No target dates anywhere; phases have order and exit criteria only |
| Privacy | `ASSUMED:` hosted LLM APIs may see any project data — low-stakes, because the project holds no Chin Hin data | No private-data folder or handling needed |
| Cost model | Small pay-per-use budget | Cheapest workable model first; no subscriptions; spend logged |
| Hardware | Not stated | `ASSUMED:` ordinary laptops, no GPU; any trained model must be CPU-sized |
| Stack | Unrestricted; not tied to Power Apps; a web-app stack preferred as simpler (user) | Decided D-05: Next.js + TypeScript |
| Team | 5 members including Azim as lead | Modules must be parallelisable; schema agreed first |
| Prize | Per team: RM1,000 if shortlisted + RM2,000 if Chin Hin takes it forward (platform); poster says RM3,000 / RM1,000. Sources conflict. | The job opportunity is the real prize |

---

## 2. Product Principles

1. **Decision first, forecast later.** The product answers "who gets the next 500 m³?" — not "what will demand be?". Forecasting waits for clean data.
2. **Agents do the legwork, a calculator does the maths, people make the call.**
3. **If the AI isn't sure, it asks.** Every extracted field carries its source and a confidence state: confirmed / inferred / missing / conflicting.
4. **Meet the plant where it is.** Orders keep arriving by WhatsApp, paper and Excel; the product turns them into data instead of asking staff to switch tools.
5. **Promises are kept.** Confirmed orders are never bumped; the rule decides only new requests.
6. **Honest numbers, honest data.** Illustrative figures are labelled illustrative; sourced figures carry sources; the demo never claims to run on Chin Hin's data.
7. **Ringgit and days, not clicks.** If a feature can't be tied to cash, margin or delay days, it's not in the MVP.
8. **Built to be shown.** Optimise for a clear, convincing, honest walk-through of one story (week 43), not for completeness.

---

## 3. Architecture

Deterministic core at the centre; LLM agents on the edges; a human checkpoint before anything leaves the system.

```
 WhatsApp text / photo of paper DO / Excel   (demo inputs: model-generated or synthetic samples)
              │
        [Intake agent] ── vision/OCR + schema check ──┐
              │                                        │ low confidence → person confirms
        [Matching agent] ── project list, order history┘
              │
        orders table (firm / likely / possible)
              │
   capacity table ──►  CORE: capacity check + rule calculator   ◄── delay-cost cards, margin cards
              │
        [Planner agent] calls core as tools → serve / move / pre-build options
              │
        [Writer agent] drafts huddle brief, customer reply, ledger note  (words only)
              │
        ✓ CHECKPOINT: scheduler approves  ──►  ledger (append-only)
              │
        Web board: capacity vs demand by week, inbox, decisions, ledger, ask-the-board
```

### 3.1 Components

| Component | Responsibility | Notes |
|---|---|---|
| `src/core/` | Delay-cost, margin, capacity check, rule comparator (+ fairness rules), ledger maths | Pure TypeScript. No LLM, no network, no framework. The only source of displayed numbers. |
| `src/data/` | zod schemas, loaders, manifest enforcement, synthetic generator | Refuses a dataset with no `MANIFEST.md` row |
| `src/agents/` | Intake, Matching, Planner, Writer | Agents call `core/` as tools; the model never computes a figure. Orchestration library chosen in P2. |
| `src/llm/` | One provider interface; model chosen by env | Cheapest workable default; server-side only |
| `src/app/` (Next.js) | Dashboard and server routes | Mirrors context `10_DECK.md` slides 9 and 10 |
| `pipeline/` (optional) | Python + uv offline tool to train a demand-shaping model on public data | Exists only if research supports it (D-06); emits files into `data/` with manifest rows; never imported by the app |

### 3.2 Data & state

| Table | Key fields | Origin |
|---|---|---|
| `capacity` | plant, product, week, capacity_m3 | `public`-calibrated; `synthetic` or `model-generated` values (labelled) |
| `orders` | id, customer/project, product, volume_m3, needed_by, tier (firm/likely/possible), source (whatsapp/paper/excel), confidence per field | Intake + Matching output over demo samples |
| `projects` (delay-cost card) | project, units, purchase price, handover deadline, buffer days, idle site cost | `public`-calibrated; `synthetic` |
| `customers` (margin card) | customer, price, variable cost, key-account flag | As above |
| `ledger` | timestamp, decision, ringgit on each side, who approved, note | Append-only file; persistence on a hosted deploy is an open caveat (D-05) |

Plant S, AAC, 20,000 m³/week and the weekly demand figures in context `03` §6 are **illustrative deck numbers**, not data. They may seed the synthetic generator's config; they must not appear as literals in code.

---

## 4. Modules / Feature Areas

Four modules from context `03` §10, built in dependency order, parallelisable once the schema is agreed (P0).

| # | Module | What it does | Phase |
|---|---|---|---|
| M2 | Data model + provenance | Schemas, loaders, manifest, public-data research, synthetic generator (and optionally a trained model) | P0 |
| M3a | Rule calculator | Cost of delay, margin, comparator, fairness rules | P0 |
| M3b | Planner | Finds short weeks; tests serve / move / pre-build | P1 |
| M4a | Board | Capacity vs firm/likely/possible by week; KPI tiles; recommendation card | P1 |
| M1 | Intake + Matching agents, orders inbox | WhatsApp/paper/Excel samples → structured order lines with confidence | P2 |
| M4b | Writer, ledger, ask-the-board, approval | Drafts, decisions logged with ringgit, plain-language Q&A backed by the calculator | P3 |

The rule (from context `03` §2): **serve whichever request has more ringgit at stake.** Internal = cost of delay (LAD exposure + idle site cost, per day waiting); external = contribution margin + risk of losing the customer. Fairness: plan ahead get protected; promises kept; close call (within ~10%) first confirmed wins; fill the quiet weeks (pre-build AAC within a stock limit); move before you refuse. One rule, three levers: stock (AAC), mould slots (precast), daily truck dispatch (ready-mix).

Cost formulas (context `03` §9, all example figures illustrative): working capital = excess inventory value × carrying rate (20–30%/yr); lost margin = missed external m³ × contribution margin per m³; delay cost/day = (Σ purchase price of affected units × 10%) ÷ 365 + idle site cost, only once handover passes its deadline (RM300m → ≈ RM82,192/day).

---

## 5. Non-Goals

Explicitly out of scope. Revisit only by adding an ADR that says why.

- A forecasting model, or a group-wide forecasting dashboard as the headline (premature: data too messy — D-02). A model that merely *generates realistic demo data* is allowed (D-06) and is never shown as a forecast.
- AI deciding allocation automatically (accountability stays with a person — D-02, D-04).
- Discounts or pricing moves to shift orders (no pricing authority).
- A cross-division knowledge graph (later phase).
- Any new ERP, system of record, or consultant-dependent setup (brief).
- Production concerns: authentication, multi-tenancy, rate limiting, real WhatsApp / Power Automate / SharePoint integration, multi-plant, hardening (D-11).
- Measuring logins, satisfaction or adoption.
- Precast and ready-mix as built features in the MVP — AAC first; the other two are shown as the same rule on different levers.
- Date-driven planning (D-11).

---

## 6. Build Roadmap

No dates, by design (D-11). Order and exit criteria are what matter.

| Phase | Scope | Exit criteria |
|---|---|---|
| P0 Foundation | Next.js + TypeScript skeleton, zod schemas, `data/` + MANIFEST + loaders, deep public-data research, synthetic generator (trained model only if justified), delay-cost / margin / rule comparator with tests | `npm test` green; worked example (RM300m block vs RM18k margin) passes; loader refuses unmanifested files; same seed → same synthetic data; manifest records every source and every "not findable" |
| P1 Board | Capacity check, planner (serve / move / pre-build), web board with KPI tiles, six-week chart, recommendation card | Walk-through on the dashboard reproduces the deck's week-43 example from data, not literals |
| P2 Capture | LLM interface, Intake + Matching agents, orders inbox, confidence states | Real-looking WhatsApp / photo / Excel samples become order lines; uncertain fields are flagged, not guessed |
| P3 Decide & write | Writer agent, human approval checkpoint, ledger, ask-the-board | Approve → ledger row with ringgit on both sides; displayed numbers ⊆ calculator output (tested) |
| P4 Pitch-ready | Data realism pass, end-to-end demo script, backup recorded demo, deploy-target decision, rehearsal | Full demo runs from a clean clone; pitch Q&A rehearsed with `ceo-pitch-advisor` |

---

## 7. Decision Log

Canonical one-line list. Load-bearing entries are expanded as ADRs in `changelog/DECISIONS.md` under the same id. Pitch-phase decisions D01–D24 live in `context/05_DECISIONS.md`; the active ones that bind the build are re-stated here under project ids.

| # | Decision | Why |
|---|---|---|
| D-01 | The solution is Plant Load Radar 2.0: rule + decision rights + board + 4-agent AI layer (context D13, D18, D20) | Real brief is about allocation, decision rights, messy data, cash outcomes |
| D-02 | Forecasting models and AI-decides allocation are out of scope until data is clean (context D19, D20) | Data too messy; accountability must stay with a person |
| D-03 | Only the deterministic calculator produces displayed numbers; LLMs write words only (context D20) | Trust; the brief warns AI may be premature |
| D-04 | Human checkpoint: nothing is sent or committed without scheduler approval (context D20) | Accountability; guardrail the pitch promised |
| D-05 | MVP stack (confirmed): Next.js + TypeScript web app, pure-TS core, file-based data; Power Apps remains the production path | User unsure; told Claude to use the most suitable; nothing tied to Power Apps; web app seen as simpler |
| D-06 | Data policy: Chin Hin gives no data; only `public`, `model-generated`, `synthetic`; no hard-coded data; manifest enforced | User: "everything we will use will be public information, data from a model we trained, or synthetic" |
| D-07 | One repo, one surface; the unzipped pitch pack lives in `refdocs/context/` as read-only founding context | User asked to unzip the docs into the project |
| D-08 | LLM behind one server-side provider interface; cheapest workable model default; provider `ASSUMED:` Anthropic | Small pay-per-use budget; provider not stated |
| D-09 | Deploy target deferred: build first, keep the app locally runnable, decide in P4 | User: "decide later, build first" |
| D-10 | Seven subagents: doc-keeper, feature-planner, test-runner, ui-reviewer, data-steward, ceo-pitch-advisor, idea-catalyst | User requested the last three beyond the standard set |
| D-11 | Demo/MVP for the pitch only; plan by order and exit criteria, never dates | User: "just a demo/MVP for the pitching itself"; "rolling and flexible, don't focus on timing" |
| D-12 | Pitch framing defaults: no "shortage today" claim; product sits beside the ERP; third plant not claimed as running; RM82k/day is a labelled upper bound; adopt the autonomy-ladder framing (demo builds Stage 1 only) | Team could not answer OQ-13/14/16/17; research shows these are the safest honest readings |
| D-13 | Rule implementation semantics: value = RM lost by one more week of deferral; schedule-sensitivity factor; close-call band relative to the current maximum; weekly, whole-request, work-conserving; reservations lapse | Removes ambiguities in the context example; all tested (P0 Tasks 6–7) |
| D-14 | No trained model for demo data; seeded synthetic generator calibrated to public series | P0 Task 4 found no order-level or other defensible public training data; only aggregates exist (resolves OQ-10, OQ-11) |
| D-15 | Board design: view-model with a figure registry and a rendered-HTML honesty test; only sourced KPIs; inert Approve/Change; pre-build shown as a labelled alternative with an assumed visible stock cap; hand SVG chart | Keeps the screen from breaking hard constraints 1 and 2 (P1) |

---

## 8. Open Questions

Unresolved. Anything marked `ASSUMED:` is a working assumption, not a confirmed fact — it may be wrong, and it must be confirmed before anything load-bearing is built on it.

*Resolved 2026-10-08: pitch date and timing (OQ-01 → D-11: not planned by date); whether Chin Hin will share data (OQ-06 → D-06: it will not; none assumed).*

- **OQ-02 Team roles and skills.** 5 members incl. Azim as lead; the rest unknown. Affects module ownership.
- **OQ-03 Platform deliverables.** Context D14 said ignore the proposal PDF + 3–5 min video (16 Oct). Now that the interview is passed and a team exists — still true?
- **OQ-04 Deck says Power Apps; MVP is a web app (D-05).** Will the Chin Hin panel expect Power Apps specifically? The deck's slides 3 and 9 promise "built in Excel and Power Apps". Recommendation: say plainly that the demo is a web prototype and Power Apps is the production path.
- **OQ-05 LLM provider and budget amount.** `ASSUMED:` Anthropic; the figure for "small pay-per-use" is unknown.
- **OQ-07 Idle site cost and carrying rate.** Carrying rate 20–30% (Fishbowl citing ISM/APQC) is public; idle site cost has no source yet. See `refdocs/research/`.
- **OQ-08 Surname spelling.** Slides use "Mardzukie", the Kabel form says "Mardukie" (context D24). Verify against IC.
- **OQ-09 Toolchain across the team.** `ASSUMED:` Node and npm installable on all five machines; confirmed only on the lead's (Node 24.11.0, npm 11.6.1).
- **OQ-12 Ledger persistence on a hosted deploy.** Serverless filesystems are ephemeral; decide with the deploy target (D-09).
*Resolved 2026-10-08 by D-14 (P0 Task 4): OQ-10 — order-level public data is not findable; OQ-11 — a trained model is not justified.*

*Defaulted 2026-10-08 by D-12 (team unsure): OQ-13 (capacity story), OQ-14 (ERP positioning), OQ-17 (autonomy ladder) — adopted; override by superseding D-12.*

- **OQ-15 Is the third Serendah AAC plant commissioned?** A fact. Targets moved from 31 May to July 2026; no confirmation found. Until known, the pitch does not claim 2.2M m³ is running (D-12). `data-steward` to check company releases and the next Bursa quarterly report.
- **OQ-16 Do material shortages extend a developer's LAD period?** A fact, not verified. Until known, the pitch says materials delay *can* contribute to LAD, never that it causes it (D-12). Needs a short legal read, or a question to Chin Hin at the pitch. Schedule-sensitivity factor on the delay-cost card is a P0 task.

---

## 9. Glossary

| Term | Meaning |
|---|---|
| AAC | Autoclaved aerated concrete blocks; can be stocked on pallets |
| Call-off | A project's firm request for delivery on a date |
| Capacity allocation | Deciding who gets a plant's limited output |
| Contribution margin | Selling price minus variable cost |
| Cost of delay | What a project loses per day it waits for materials (LAD exposure + idle site cost) |
| Firm / likely / possible | Demand tiers by certainty of the order |
| LAD | Liquidated ascertained damages: 10% a year of purchase price, daily, for late vacant possession (Housing Development Act) |
| Ledger | Append-only record of each allocation decision and the ringgit on both sides |
| Shadow price | Value of one more unit of scarce capacity right now — what the weekly comparison produces |
| Huddle | Weekly 30-minute meeting: plant manager + project director settle exceptions using the same ringgit test |
| Delay-cost card / margin card | Per-project / per-customer input sheets so ringgit is computed automatically |
| `public` / `model-generated` / `synthetic` | The only three data kinds in this project (D-06) |
| YEI 3.0 | Kabel's Youth Innovation Sandbox; the programme this MVP is for |
