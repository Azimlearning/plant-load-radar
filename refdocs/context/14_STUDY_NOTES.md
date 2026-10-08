# 14 — Chin Hin Pitch: Complete Study Notes

*Plant Load Radar · Kabel YEI 3.0 · Prepared 4 October 2026*

## 1. The one-minute summary

Chin Hin's plants make AAC blocks, precast concrete and ready-mix concrete for two kinds of customer: outside contractors who pay market price, and Chin Hin's own construction and property projects. When capacity is tight, there is no clear rule for who gets served first, so it is decided informally, deal by deal. Demand is also planned separately at each plant in spreadsheets, which leaves excess stock in one place and missed orders in another.

Your pitch is called **Plant Load Radar**: one rule, one owner, one board.

1. **The rule.** When capacity is short, serve whichever request has more ringgit at stake: the internal project's cost of delay, or the outside order's margin.
2. **The owner.** The plant scheduler applies the rule every week. Disputes go to a fixed 30-minute huddle using the same calculation, so nothing is escalated upwards.
3. **The board.** All committed demand, internal and external, shown against capacity, built in tools the plant already uses (Excel, SharePoint, Power Apps).
4. **An agentic AI layer.** Four agents read orders, match them, test options against capacity and draft messages with generative AI. A calculator does the maths and the scheduler approves everything.

You prove it with a pilot of about three months at one plant, measured only in ringgit and days: cash released from excess stock, outside margin no longer lost, and project delay days avoided.

## 2. What you signed up for

You are in Kabel's **YEI 3.0 (Youth Innovation Sandbox)**, which matches graduating students with real company problems so employers can see their work. You chose **Chin Hin Group's Capacity & Demand Intelligence** challenge as an individual.

| Stage | What happens | Status |
| --- | --- | --- |
| Pick | Choose one company problem | Done |
| Pre-interview | Online session with Kabel (Aleef, Widad); present your slides | Tue 6 Oct, time to be confirmed |
| Team-Up | If you pass, Kabel places you in a team of 2 to 5 | Around 8 to 9 Oct |
| Build | The team builds an MVP (working first version) | Team-Up to pitch day |
| Pitch | Present to Chin Hin; one week's notice | Likely early November |
| Get hired | Company-paid interview (RM300 attendance support), chance of a job offer | After the pitch |

**Money, per team:** RM1,000 if shortlisted to pitch, plus RM2,000 more if Chin Hin takes the solution forward. The job chance is the real prize.

**Watch out:** an early-November pitch day could clash with MCAIT in Madinah (3 to 5 Nov). Tell Aleef early.

## 3. Chin Hin 101

Chin Hin is a Malaysian integrated builder: it makes building materials, builds, develops property and fits out homes, so its own projects are also one of its biggest customers. It started in 1974 as a family hardware stall in Alor Setar and listed on Bursa Malaysia in 2016.

| Division | What it does | Latest figure |
| --- | --- | --- |
| Building Materials | AAC, precast, ready-mix, wire mesh, roofing, distribution | RM542.1m revenue, Q2 FY26 (Apr to Jun 2026), up 13.5% |
| Property Development | Own housing projects (e.g. Ayanna, Dawn, Botanica Hills) | RM487.2m revenue, 1H FY26, up 31.2% |
| Construction Engineering | Builds group projects and outside contracts | RM427.9m revenue, 1H FY26, up 22.0% |
| Home & Living | Kitchens, wardrobes, interior fit-out | RM189.6m revenue, Q2 FY26 |

- Group revenue was RM1.05bn in Q2 FY26; the combined order book, unbilled sales and backlog is about RM5.4bn.
- The chairman calls the group a waterfall: property feeds construction, which feeds building materials. He put trade between building materials and construction at about RM200m in one year (2024 interview).
- Its factories supply welded wire, precast and AAC blocks to both internal projects and outside customers. That shared supply is where the brief's conflict comes from.
- AAC capacity: the third Serendah plant (about RM80m) takes total AAC capacity to about 2.2 million m³ a year, from about 1.2 million.
- In early 2025 building materials faced weaker demand, rising costs and more competition.
- Chin Hin uses Microsoft (Copilot, Azure AI Foundry) and ran a 2026 student AI hackathon on Microsoft Foundry.

Sources: The Sun and EdgeProp (Aug 2026), The Edge (2024, 2025), The Capital Journal.

## 4. Industry basics

| Product | What it is | Can it be stored? | Where allocation happens |
| --- | --- | --- | --- |
| AAC blocks | Lightweight concrete wall blocks, steam-cured in an autoclave | Yes, on pallets | Production plan and stock |
| Precast concrete | Beams, slabs, wall panels made to order in moulds | Briefly, in the yard | Mould and production slots |
| Ready-mix concrete | Wet concrete delivered by truck | No, poured within hours | Daily truck dispatch |

- **Utilisation is the profit lever.** AAC plants are capital-heavy, so idle capacity is expensive. At 2.2 million m³, every 1 percentage point of utilisation equals 22,000 m³.
- **Chin Hin has been hurt before.** At the end of 2019, its new 600,000 m³ Kota Tinggi AAC line ran at about 30% utilisation because of excess supply and a weak property market, which sparked a price war (Annual Report 2019).
- **The market is growing, but more slowly.** Construction work done was RM47.8bn in Q2 2026, up 8.8%; 1H 2026 growth cooled to 8.7% from 14.7% (DOSM).
- **Late homes have a legal price tag.** Under the Housing Development Act, a developer pays buyers 10% a year of the purchase price, counted daily, for late handover. Deadlines are 24 months (landed) and 36 months (strata).

## 5. The problem statement, decoded

**Problem 1: allocation.** When capacity is tight, the plant must choose between outside customers and Chin Hin's own projects. The plant manager focuses on volume and margin; the group may prioritise internal projects because delays push back schedules. Both are reasonable, but there is no consistent rule, so it is decided deal by deal.

**Problem 2: planning.** Each plant forecasts alone using spreadsheets and judgement, causing excess inventory in some places and missed orders in others. There is no single view of committed demand.

| The brief asks you to | What it really wants |
| --- | --- |
| Propose how allocation decisions are made, and by whom | A rule plus decision rights |
| Quantify the cost of today's setup, showing working | Working capital, lost margin, project delay days, in ringgit |
| Show internal and external demand together | One view of committed demand |
| Say where AI helps and where it is premature | Judgement about messy data |
| Build something a scheduler uses daily | Simple and practical |

**Constraints:** no new ERP, no consultant, no transfer-pricing policy from head office, a short timeframe, and no escalating to someone senior to impose a rule.

**Success:** real business outcomes (behaviour or cash), not logins, satisfaction scores or adoption.

**Traps:** a forecasting dashboard, an AI that decides, "head office should set a rule", and success measured by usage.

## 6. Key concepts in plain words

| Term | Plain meaning |
| --- | --- |
| Capacity allocation | Deciding who gets the plant's limited output |
| Utilisation | Share of capacity actually used |
| Contribution margin | Selling price minus the variable cost of making it |
| Cost of delay | What it costs per day when a project waits for materials |
| LAD | Damages a developer owes buyers for late handover: 10% a year of the price |
| Working capital | Cash tied up in day-to-day operations, including stock |
| Carrying cost | Yearly cost of holding stock, typically 20 to 30% of its value |
| Transfer pricing | The internal price one division charges another |
| Shadow price | What one more unit of scarce capacity is worth right now |
| Call-off | A project's firm request for delivery on a date |
| Protected capacity | Capacity reserved for high-value requests, like airline seats held back |
| Firm / likely / possible | Demand tiers by how certain an order is |
| Lumpy demand | Orders that arrive in irregular, large chunks |
| S&OP | Sales and operations planning: matching demand to supply regularly |
| ERP | Enterprise software such as SAP (ruled out by the brief) |
| MVP | The smallest working version of a product |
| RAG | AI that answers from given sources (how VERA works) |

## 7. What other companies did

| Who | What they did | Lesson |
| --- | --- | --- |
| Etex (lightweight building materials) | Integrated business planning in Anaplan | Reported 5 to 10% better forecast accuracy, 20% less inventory |
| Saint-Gobain | Moved demand planning from Excel to SAP | Spreadsheets break at scale |
| Holcim | Sensors and machine learning on 150+ concrete trucks | AI works best on clean data |
| o9 Solutions | One knowledge graph for demand, supply, inventory, finance | Powerful but a big platform |
| Kinaxis | Agents that run what-if scenarios | Scenarios are a proven AI use |
| Microsoft | Unified data first, then 100+ supply chain agents | Data first, AI second |
| Chin Hin (2026 hackathon) | Students built a procurement planning agent | Your idea must differ: allocation, not purchasing |
| Construction research (2025) | WhatsApp-native AI turned site chats into records | AI is useful for capture |

Big players used large platforms needing clean data and an ERP. The brief rules that out, so fix the decision and the data capture first.

## 8. Your solution: Plant Load Radar

### Part 1: the rule

When capacity is short, serve whichever request has **more ringgit at stake**:

- **Internal request:** the project's cost of delay (LAD exposure if handover would slip, plus idle site cost).
- **Outside request:** the order's contribution margin, plus the risk of losing the customer.

**Keeping it fair:**

- **Plan ahead, get protected.** Projects that confirm call-offs early get reserved capacity; unused slots are released.
- **Promises are kept.** Confirmed orders are never bumped; the rule only decides new requests.
- **Close call, first confirmed wins.** Within about 10%, the earlier confirmed request goes first.
- **Fill the quiet weeks.** AAC can be stocked, so quiet weeks pre-build for busy ones, within a stock limit.
- **Move before you refuse.** Offer the losing order the next free week rather than turning it away.

This works as an internal price for scarce capacity (a "shadow price"), so no transfer-pricing policy is needed.

### Part 2: who decides

| Who | Role | When |
| --- | --- | --- |
| Project planners and sales | Confirm orders and call-offs early | As they come in |
| Plant scheduler | Updates the board, applies the rule | Every week |
| Plant manager + project director | Settle exceptions in a 30-minute huddle | Every week |
| Group finance | Reviews the ringgit saved and lost | Every month |

Nothing goes up the chain: the plant manager owns every decision made within the rule.

### Part 3: the board

Weekly flow: orders arrive (WhatsApp, paper, Excel) → AI captures them and a person confirms anything unclear → board shows capacity against firm, likely and possible demand → short weeks are flagged with both sides' ringgit → the scheduler decides and a ledger records the result.

**The dashboard (one screen, built in Power Apps):** a sidebar (Board, Orders inbox, Decisions, Ledger, Ask the board); four headline numbers (weeks short, orders to check, decisions waiting, ringgit protected this month); a six-week chart of spare or short capacity; the planner agent's recommendation card with Approve and Change buttons; and the orders inbox showing what the intake agent read from WhatsApp and paper, with uncertain items flagged.

Practical touches: a **delay-cost card** set once per project (units, prices, handover deadline, buffer days) and a **margin card** per outside customer, so the board calculates the ringgit automatically. Built on Excel or SharePoint with Power Apps; no new ERP.

### Part 4: the AI layer (agentic + generative)

An agentic pipeline of four agents with one human checkpoint:

| Agent | What it does | Tools it calls |
| --- | --- | --- |
| 1. Intake | Reads WhatsApp messages, photos of paper delivery orders and Excel into order lines | Vision/OCR, schema check |
| 2. Matching | Links orders to projects and customers, removes duplicates, tags firm / likely / possible | Project list, order history |
| 3. Planner | Finds short weeks and tests serve, move or pre-build | Capacity check, rule calculator |
| 4. Writer (generative AI) | Drafts the huddle brief, customer replies and ledger notes | Language model |
| Checkpoint | The scheduler approves; nothing is sent or committed without a person | |

**Generative AI examples (on the slides):** a weekly huddle brief for the plant manager; a WhatsApp reply offering Contractor B the next free week, waiting for "Approve and send"; and "Ask the board", where the scheduler asks in plain language ("Can we take 800 m³ for Johor next week?") and the agent answers by running the calculator.

**Guardrails:** numbers always come from tools, never from the model; every field shows its source and confidence; nothing goes out without approval. Orchestrated with LangGraph or Microsoft Foundry, triggered from Power Automate, so it fits Chin Hin's Microsoft stack.

**Still premature:** forecasting models (data too messy) and letting AI make the allocation decision (someone must stay accountable). Both come later, once a few months of clean data exist.

**How to say it in one line:** "Agents do the legwork, a calculator does the maths, and people make the call."

### One rule, three levers

Stock for AAC, mould slots for precast, daily truck dispatch for ready-mix.

### Parked ideas

Discounts to move orders (no pricing authority), AI allocating automatically (accountability), and a group-wide forecasting model (data not ready).

### Roll-out plan (about three months, one plant)

| Month | Focus | What happens | By the end |
| --- | --- | --- | --- |
| 1 | Understand and build | Sit with the scheduler; rebuild recent decisions from WhatsApp and paper and price them; build the dashboard and agents | A working dashboard with the plant's real orders |
| 2 | Agree and go live | Agree the rule with the plant manager and a project director; start the weekly huddle; log every decision | The plant decides by the rule every week |
| 3 | Measure and decide | Compare cash, margin and delays with before; fix what didn't work; decide on precast and ready-mix | A ringgit result and a go or no-go |

**Success measures:** cash released from excess stock, outside margin no longer lost, project delay days avoided.

## 9. How to quantify the cost

All example numbers are illustrative, not Chin Hin data.

**1. Working capital in excess stock:** carrying cost per year = excess inventory value × carrying rate (20 to 30%). Example: RM5m excess × 25% = about RM1.25m a year.

**2. Margin lost on missed orders:** lost margin = missed outside volume (m³) × contribution margin per m³. Needs Chin Hin's data.

**3. Project delay days:** delay cost per day = (purchase price of affected units × 10%) ÷ 365, plus idle site cost. Only applies once handover passes its deadline. Example: a RM300m block past deadline = RM300m × 10% ÷ 365 = about RM82,000 a day.

**Decision test:** if the internal delay cost for the days it would wait is bigger than the outside order's margin, serve the internal request first, and the reverse otherwise.

**Data to ask Chin Hin for:** recent orders and allocation decisions (even WhatsApp or paper), weekly output and downtime, stock levels by plant, margin per m³ by product and customer, and projects' handover deadlines and buffers.

## 10. Why this solution won the debate

| Idea | Verdict | Why |
| --- | --- | --- |
| Forecast dashboard | Rejected as headline | Ignores the conflict; data too messy |
| Knowledge graph copilot | Deferred | Premature with paper and WhatsApp data |
| Firm / likely / possible demand | Kept inside the board | Honest about uncertainty |
| Order-promising agent | Reduced to capture | Planners trust AI that tidies data, not AI that decides |
| Pricing and demand shaping | Dropped | Needs a transfer-price policy |
| Rule + owner + board + light AI | **Winner** | Answers every ask; no ERP or escalation; moves cash |

## 11. Your story: why you, and your gaps

| Your experience | How it maps |
| --- | --- |
| Technical Lead, System Automations, UTP Career Development Office: 14 undocumented Power Automate flows | Low-code tools for non-technical staff; no ERP |
| Corporate Finance, Investment, International Financial Management | The working-capital and margin maths |
| VERA AI at PETRONAS (RAG assistant) | Capture that shows its sources |
| Arcana (final-year project, multi-agent LangGraph pipeline) and Synapse (adaptive agentic platform) | Same agentic pattern as the proposed AI layer |
| Dean's List three semesters; IEEE paper at MCAIT 2026; HACKaSTONE 2026 Grand Final; Codex Community Day; esports gold twice; leadership roles (esports club, LEADX, GDSC, Seoul outreach) | Proof you deliver and lead |

**Gaps:** no factory experience (that's why the pilot starts by shadowing the plant); no Chin Hin data yet (the logic accepts real numbers directly); solo for now (the design splits cleanly across a team).

## 12. Likely interview questions

**"Why this project?"** It sits where my data, finance and automation work meet, and it's a real business decision, not just a technical problem.

**"Why not just forecast better?"** Forecasting doesn't decide who gets served, and the data is on paper and WhatsApp. Fix the decision and capture first; forecasting comes after a few months of clean data.

**"Why would a plant manager follow a rule that hurts his own margin?"** Because the ledger records the ringgit he gave up for the group, so finance can credit his plant for it, and the huddle gives him a voice on exceptions. The rule also protects his margin whenever outside orders are worth more.

**"Who makes the call?"** The scheduler applies the rule; the plant manager owns it; exceptions go to a 30-minute huddle with the project director.

**"How do you price internal demand without a transfer price?"** Use the cost of delay; for property, the law sets 10% a year of the purchase price per day late.

**"Where does AI actually help?"** Four agents do the legwork: intake, matching, planning and writing. The planner calls a calculator for every number, and the scheduler approves before anything is sent. Forecasting and letting AI decide are premature.

**"Isn't an agent pipeline overkill for a plant on WhatsApp?"** It meets the plant where it already is: orders keep arriving by WhatsApp, and the agents turn them into data instead of asking staff to change tools. Each agent is small and can be switched off without breaking the board.

**"What if there isn't much data?"** The first phase rebuilds recent decisions from chats and paper; that is the baseline.

**"How will you know it worked?"** Cash released, margin recovered, delay days avoided.

**"How would you work with a new team?"** Split into capture, board, rule calculator and ledger; agree the data format on day one; demo every few days.

## 13. Numbers cheat sheet

| Number | What it is |
| --- | --- |
| 10% a year, daily | LAD for late handover (Housing Development Act) |
| About RM82,000 a day | LAD on a RM300m block past deadline (illustrative) |
| 20 to 30% a year | Typical inventory carrying cost |
| 2.2 million m³ a year | Chin Hin AAC capacity with third Serendah plant |
| 22,000 m³ | One percentage point of AAC utilisation |
| 30% | Kota Tinggi AAC line utilisation, end 2019 |
| RM5.4bn | Combined order book, unbilled sales and backlog |
| RM1.05bn | Group revenue, Q2 FY26 |
| +31.2% / +22.0% | Property / construction revenue growth, 1H FY26 |
| About RM200m | Yearly trade between building materials and construction (2024) |
| RM47.8bn, +8.8% | Malaysia construction work done, Q2 2026 |

## 14. What not to say

- "AI will optimise your supply chain" (too vague).
- "Head office should set a policy" (ruled out).
- "AI cuts forecast errors by 30 to 50%" (vendor marketing).
- "We'll measure adoption and logins" (rejected by the brief).
- "The plant managers are doing it wrong" (both sides are reasonable).
- Presenting illustrative numbers as Chin Hin's.
- Overselling Arcana or knowledge graphs.
