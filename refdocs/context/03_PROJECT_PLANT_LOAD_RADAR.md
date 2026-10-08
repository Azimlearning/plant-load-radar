# 03 — Project: Plant Load Radar

> **One line:** Who gets the capacity when there isn't enough, decided by what's at stake in ringgit.
> **Formula:** One rule, one owner, one board — and agents doing the legwork.
> **Safe line if challenged on AI:** "Agents do the legwork, a calculator does the maths, and people make the call."

## 1. Problem it solves

Two fair priorities with no shared rule (plant: volume and margin; group: projects on schedule), so capacity is allocated deal by deal. Each plant also forecasts alone in spreadsheets, causing excess stock in one place and missed orders in another. Data lives on paper, WhatsApp and spreadsheets. No new ERP, consultant, transfer-pricing policy or escalation allowed.

## 2. Part 1 — The rule

When capacity is short, **serve whichever request has more ringgit at stake**:

| Side | Value at stake |
| --- | --- |
| Internal project | **Cost of delay** = LAD exposure if handover slips past its legal deadline + idle site cost, per day of waiting |
| External order | **Contribution margin** + risk of losing the customer |

**Fairness rules:**
1. **Plan ahead, get protected** — projects confirming call-offs early get reserved capacity; unused slots are released (use it or lose it).
2. **Promises are kept** — confirmed orders are never bumped; the rule only decides new requests.
3. **Close call, first confirmed wins** — if both sides are within ~10%, the earlier confirmed request goes first.
4. **Fill the quiet weeks** — AAC can be stocked, so quiet weeks pre-build for busy ones, within a stock limit.
5. **Move before you refuse** — offer the losing order the next free week.

**Why no transfer price is needed:** the weekly comparison acts as the *shadow price* of scarce capacity (the value of one more unit right now), which economics research identifies as the right internal price.

**Worked example (illustrative):** Week 43 is 2,000 m³ short. Project A (internal) ≈ RM82,000/day if handover slips (RM300m block × 10% ÷ 365). Contractor B ≈ RM18,000 margin. → Serve Project A; move Contractor B to week 44 (4,100 m³ free).

## 3. Part 2 — The owner (decision rights)

| Who | Does what | When |
| --- | --- | --- |
| Project planners & sales | Confirm orders and call-offs early | As they come in |
| Plant scheduler | Updates the board, applies the rule | Weekly |
| Plant manager + project director | Settle exceptions in a 30-minute huddle using the same ringgit test | Weekly |
| Group finance | Reviews the ringgit saved and lost (ledger) | Monthly |

Nothing goes up the chain. The plant manager owns every decision made within the rule. (Incentive answer: the ledger records ringgit the plant gave up for the group, so finance can credit the plant.)

## 4. Part 3 — The board (weekly flow)

1. **Orders arrive** — WhatsApp, paper delivery orders, Excel
2. **Captured** — intake agent reads each one; a person confirms anything unclear
3. **On the board** — capacity vs firm / likely / possible demand, by week, internal and external together
4. **Flagged** — planner agent finds short weeks and tests serve / move / pre-build
5. **Decided and logged** — scheduler approves; GenAI drafts replies and the ledger note

Practical setup: **delay-cost card** per internal project (units, prices, handover deadline, buffer days) and **margin card** per outside customer (price, variable cost, key-account flag), so ringgit is computed automatically.

**One rule, three levers:** stock (AAC) · mould slots (precast) · daily truck dispatch (ready-mix).

## 5. The AI layer — agentic pipeline

| # | Agent | Job | Tools it calls |
| --- | --- | --- | --- |
| 1 | Intake | Reads WhatsApp, photos of delivery orders, Excel → structured order lines | Vision/OCR, schema check |
| 2 | Matching | Links orders to projects/customers, de-duplicates, tags firm / likely / possible | Project list, order history |
| 3 | Planner | Finds short weeks; tests serve / move / pre-build | Capacity check, rule calculator |
| 4 | Writer (GenAI) | Drafts huddle brief, customer replies, ledger notes | Language model |
| ✓ | Checkpoint | Scheduler approves; nothing sent or committed without a person | — |

**Guardrails:** numbers always from tools, never the model · every field shows source + confidence (confirmed / inferred / missing / conflicting) · nothing sent without approval · orchestrated with **LangGraph or Microsoft Foundry**, triggered from **Power Automate** (fits Chin Hin's Microsoft stack).

**Still premature:** forecasting models (data too messy) and letting AI decide allocation (accountability). Revisit after a few months of clean captured data.

### GenAI outputs (slide 10 mockups)
- **Huddle brief** for the plant manager: what's short, the recommendation in ringgit, the one decision needed.
- **WhatsApp reply to Contractor B**: "Week 43 is fully booked, but we can deliver from Mon 26 Oct. Shall I lock that in?" → *Approve and send / Edit*.
- **Ask the board**: "Can we take 800 m³ for Johor next week?" → "Yes in week 44 (4,100 m³ free). Week 43 would go 2,800 m³ short."

### Intake example (slide 8)
Message: "Boss, Project A site need 1,500 m3 AAC 100mm by Tue 20 Oct. Can confirm ya" → Customer: Project A (internal) ✓ · Product: AAC block 100 mm ✓ · Volume: 1,500 m³ ✓ · Needed by: Tue 20 Oct ✓ · Firm or likely: *Likely, no call-off yet* → **Check**.

## 6. The dashboard (slide 9 mockup, Power Apps)

- Sidebar: Board · Orders inbox (3) · Decisions · Ledger · Ask the board
- Header: Plant S · AAC blocks · weeks 41–46 · "Updated 9:42 AM · 3 new orders read by the intake agent"
- KPI tiles: Weeks short **2** · Orders to check **3** · Decisions waiting **1** · Protected this month **RM246k**
- Chart: spare (+) / short (−) capacity by week — 41: +1,200 · 42: −700 · 43: −2,000 · 44: +4,100 · 45: +2,500 · 46: +1,000
- Recommendation card (week 43) with **Approve / Change**
- Orders inbox: WhatsApp — Project A, 1,500 m³, Tue 20 Oct (Likely · check); Paper — Contractor C, 600 m³ AAC 150 mm, Thu 29 Oct (Firm · confirmed)

Illustrative weekly data (Plant S, AAC, m³): capacity 20,000/week; firm internal / firm external / likely = W41 6,500 / 9,800 / 2,500 · W42 7,200 / 10,400 / 3,100 · W43 8,900 / 11,300 / 1,800 · W44 5,100 / 8,600 / 2,200.

## 7. Rollout (about three months, one plant)

| Month | Focus | Activities | By the end |
| --- | --- | --- | --- |
| 1 | Understand and build | Sit with the scheduler; rebuild recent decisions from WhatsApp/paper and price them; build dashboard + agents | Working dashboard with real orders |
| 2 | Agree and go live | Agree the rule with plant manager + a project director; start weekly huddle; log every decision | Plant decides by the rule weekly |
| 3 | Measure and decide | Compare cash, margin, delays vs before; fix; decide roll-out to precast/ready-mix | Ringgit result + go/no-go |

Backup (if asked for weeks): ~1–2 learn · 3–4 build · 5–6 agree · 7–10 live · 11–12 measure.

## 8. Success measures

Cash released from excess stock · outside margin no longer lost · project delay days avoided. **Not** logins, satisfaction scores or adoption.

## 9. Cost formulas (show your working)

- **Working capital:** excess inventory value × carrying rate (20–30%/yr). RM5m × 25% ≈ RM1.25m/yr (illustrative).
- **Lost margin:** missed external m³ × contribution margin per m³ (needs Chin Hin data).
- **Delay cost/day:** (Σ purchase price of affected units × 10%) ÷ 365 + idle site cost; only once handover passes deadline. RM300m ≈ RM82,000/day.
- **Scale:** 1 percentage point of utilisation on 2.2M m³ AAC = 22,000 m³.

## 10. Team-phase build plan (if passed)

Split into modules a team of 2–5 can parallelise: (1) intake agent + inbox, (2) matching + data model (Excel/SharePoint), (3) rule calculator + planner agent, (4) dashboard (Power Apps) + writer agent + ledger. Agree the data schema on day one; demo every few days. Demo on realistic synthetic data; swap in real data when shared.

## 11. Data to request from Chin Hin

Recent orders and allocation decisions (even WhatsApp/paper) · weekly output and downtime · stock by plant · margin per m³ by product/customer · project handover deadlines and buffers.

## 12. Parked ideas

Discounts to move orders (no pricing authority) · AI allocating automatically (accountability) · group-wide forecasting model (data not ready) · knowledge graph across divisions (later phase, builds on Arcana).

## 13. Version history of the idea

| Version | Concept | Why it changed |
| --- | --- | --- |
| v0 | NTT Audit Lifecycle (agentic audit pipeline) | NTT withdrew all projects |
| v1 | "Capacity & Demand Copilot" — forecast + capacity + agent | Generic; built before the brief |
| v1.5 | "Plant Load Radar" — pipeline-driven demand + optimiser + thin agent | Council round 1 |
| v2 | Rule + decision rights + board + light AI capture | Brief received; council round 2 |
| v2.1 | + fairness rules (promises kept, first-confirmed, fill quiet weeks) | Second brainstorm |
| v2.2 | + 4-agent pipeline + GenAI writer + dashboard mockup | Azim asked to showcase agentic/GenAI experience |
