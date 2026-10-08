# 10 — Deck (auto-extracted from the live slides, v6)

Link: https://claude.ai/artifact/Lk6uDTQUg93tBcvbGFQh1v · Font: Plus Jakarta Sans · Accent #1F6B45


## Slide 1 — Plant Load Radar

*File id: `cover`*

- Chin Hin Group · Capacity & Demand Intelligence · Kabel YEI 3.0
- Who gets the capacity when there isn't enough, decided by what's at stake in ringgit
- Fakhrul Azim Bin Ahmed Mardzukie
- Final-year Computer Science (Data Analytics) · Universiti Teknologi PETRONAS
- 6 October 2026

**Speaker notes:** Hi, I'm Azim, a final-year Computer Science student majoring in Data Analytics at UTP. I'm pitching Plant Load Radar for Chin Hin's Capacity and Demand Intelligence challenge. In one sentence: when a plant can't serve everyone, it should decide who goes first by what's actually at stake in ringgit, and it should do that every week, with a clear owner, in tools it already has. I'll spend one slide on the problem, then go straight into the solution.


## Slide 2 — Two fair priorities, and no shared rule

*File id: `why-now`*

- Outside contractors
- Want reliable supply at market price
- ←
- Chin Hin plant
- AAC blocks, precast, ready-mix
- →
- Chin Hin's own projects
- Property +31%, construction +22% in 1H FY26
- When capacity is tight: who goes first?
- Today, it's decided deal by deal
- The plant chases volume and margin. The group wants its projects on schedule. Both are reasonable.
- And planning is blind
- Each plant forecasts alone in spreadsheets: excess stock in one place, missed orders in another.
- The brief rules out a new ERP, a consultant, a transfer-pricing policy, and escalating upwards.
- Sources: Chin Hin problem statement (Kabel); The Sun, Aug 2026

**Speaker notes:** Here's the problem on one page. Chin Hin's plants make AAC blocks, precast and ready-mix for two customers: outside contractors, and Chin Hin's own projects, which are growing fast. Property revenue grew 31 percent and construction 22 percent in the first half of this financial year. When capacity is tight, the plant naturally chases volume and margin, while the group wants its own projects on schedule. Both are reasonable, but there's no shared rule, so it's decided deal by deal. On top of that, each plant forecasts on its own in spreadsheets, so there's excess stock in one place and missed orders in another. And the brief rules out the easy answers: no new ERP, no consultant, no transfer-pricing policy, and no escalating it upwards.


## Slide 3 — Plant Load Radar: one rule, one owner, one board

*File id: `challenge`*

- Every week, the plant knows who gets the capacity, and why, in ringgit.
- 1
- **The rule**
- Serve the request with more ringgit at stake: a project's cost of delay, or an order's margin.
- 2
- **The owner**
- The plant scheduler applies it every week. Exceptions go to a 30-minute huddle, never upwards.
- 3
- **The board**
- One view of all committed demand against capacity, built in Excel and Power Apps.
- An agentic AI layer does the legwork: reading orders, testing options and drafting messages. People make the call.

**Speaker notes:** So here's my answer: Plant Load Radar. It's three things. One, a rule: when capacity is short, serve whichever request has more ringgit at stake, the internal project's cost of delay or the outside order's margin. Two, an owner: the plant scheduler applies that rule every week, and anything the rule can't settle goes to a 30-minute huddle, not up the chain. Three, a board: one view of all committed demand against capacity, built in Excel and Power Apps, which the plant can actually run. Underneath, an agentic AI layer does the legwork: it reads messy WhatsApp and paper orders, tests the options against capacity, and drafts the messages. But the maths comes from a calculator, and people make the call. Let me take each part in turn.


## Slide 4 — More ringgit at stake wins

*File id: `lesson`*

- Part 1 · The rule
- Example: week 43 is 2,000 m³ short
- Project A (Chin Hin's own)
- RM82,000 a day
- if its handover slips past the deadline
- Contractor B (outside)
- RM18,000
- margin on this order
- Serve Project A. Offer Contractor B the next free week.
- **Keeping it fair**
- Plan ahead, get protected
- Projects that confirm call-offs early get reserved capacity. Unused slots are released.
- Promises are kept
- Confirmed orders are never bumped. The rule only decides new requests.
- Close call? First confirmed wins
- If both sides are within about 10%, the earlier confirmed request goes first.
- Fill the quiet weeks
- AAC can be stocked, so quiet weeks pre-build for busy ones, within a stock limit.
- Illustrative numbers. Delay cost uses the Housing Development Act late-handover rate: 10% a year of the purchase price, per day.

**Speaker notes:** Part one, the rule. When capacity is short, the request with more ringgit at stake goes first. Here's an example. Week 43 is 2,000 cubic metres short. Project A is one of Chin Hin's own developments. If its handover slips past the legal deadline, the Housing Development Act makes the developer pay buyers 10 percent a year of the purchase price, day by day. For a 300 million ringgit block, that's about 82,000 ringgit a day. Contractor B's order is worth about 18,000 ringgit in margin. So Project A goes first, and Contractor B is offered the next free week instead of being turned away. To keep it fair, there are four rules of thumb. Projects that confirm call-offs early get protected capacity, but unused slots are released. Confirmed orders are never bumped, so the rule only decides new requests. If it's a close call, the earlier confirmed request wins. And because AAC can be stocked, quiet weeks pre-build for busy ones, within a stock limit so we don't tie up cash. These numbers are illustrative; the real ones come from Chin Hin's data.


## Slide 5 — Who decides, and when

*File id: `proposal`*

- Part 2 · The owner
- 1
- Project planners and sales
- Confirm orders and call-offs early
- As they come in
- 2
- Plant scheduler
- Updates the board and applies the rule
- Every week
- 3
- Plant manager and project director
- Settle anything the rule can't, in a 30-minute huddle
- Every week
- 4
- Group finance
- Reviews the ringgit saved and lost
- Every month
- Nothing goes up the chain. The rule settles it.
- The plant manager owns every decision made within the rule.

**Speaker notes:** Part two, the owner. A rule only works if someone clearly applies it. Project planners and sales confirm orders and call-offs as early as they can, because early confirmation earns protected capacity. The plant scheduler updates the board every week and applies the rule. If something genuinely doesn't fit, the plant manager and the project director settle it in a fixed 30-minute weekly huddle, using the same ringgit comparison. And group finance reviews the ringgit saved and lost once a month. The key point: nothing goes up the chain. The brief rules out escalation, and this design doesn't need it, because the plant manager owns every decision made within the rule.


## Slide 6 — How Plant Load Radar works, every week

*File id: `signals`*

- Part 3 · The board
- 1
- Orders arrive
- WhatsApp messages, paper delivery orders, Excel
- →
- 2
- Captured
- An intake agent reads each one; a person confirms anything unclear
- →
- 3
- On the board
- Capacity against firm, likely and possible demand, by week
- →
- 4
- Flagged
- A planner agent finds short weeks and tests serve, move or pre-build
- →
- 5
- Decided and logged
- The scheduler approves; GenAI drafts the replies and the ledger note
- Runs on Excel or SharePoint with a Power Apps front end. No new ERP.
- Agents do the legwork. A calculator does the maths. People make the call.

**Speaker notes:** Part three, the board, and how the whole thing runs in a normal week. One: orders arrive the way they do today, by WhatsApp, on paper delivery orders, or in Excel. Two: an intake agent reads each one and turns it into a clean order line, and a person confirms anything it isn't sure about. Three: everything lands on one board, capacity against firm, likely and possible demand, week by week, internal and external together. Four: a planner agent finds the short weeks and tests the options, serve, move to another week, or pre-build stock, using the rule calculator. Five: the scheduler approves, and generative AI drafts the replies to customers and the ledger note. It all runs on Excel or SharePoint with a Power Apps front end, so there's no new ERP. Agents do the legwork, a calculator does the maths, and people make the call. Next, the AI layer itself.


## Slide 7 — Four agents, one human checkpoint

*File id: `agents`*

- The AI layer
- Agent 1
- Intake
- Reads WhatsApp, photos of delivery orders and Excel into order lines
- Uses: vision, schema check
- →
- Agent 2
- Matching
- Links orders to projects and customers, removes duplicates, tags firm, likely or possible
- Uses: project list, order history
- →
- Agent 3
- Planner
- Finds short weeks and tests serve, move or pre-build
- Uses: capacity check, rule calculator
- →
- Agent 4
- Writer
- Drafts the huddle brief, customer replies and ledger notes
- Uses: generative AI
- →
- Checkpoint
- Scheduler approves
- Nothing is sent or committed without a person
- Numbers come from tools, never from the model
- Every field shows its source and how sure the agent is
- Orchestrated with LangGraph or Microsoft Foundry, triggered from Power Automate
- Still premature: forecasting models and letting AI decide. Both come later, once the data is clean.

**Speaker notes:** Here's the AI layer itself, and this is where my background comes in. It's an agentic pipeline of four agents with one human checkpoint. Agent one, intake, reads WhatsApp messages, photos of paper delivery orders and Excel files, and turns them into structured order lines. Agent two, matching, links each order to the right project or customer, removes duplicates, and tags it firm, likely or possible. Agent three, the planner, finds short weeks and tests the options, serve, move to another week, or pre-build stock, by calling the capacity check and the rule calculator as tools. Agent four, the writer, uses generative AI to draft the huddle brief, the customer replies and the ledger notes. Then the scheduler approves; nothing is sent or committed without a person. Three guardrails make it trustworthy: the numbers always come from tools, never from the model; every field shows its source and how confident the agent is; and it's orchestrated with LangGraph or Microsoft Foundry, triggered from Power Automate, so it fits Chin Hin's Microsoft stack. What's still premature is forecasting models and letting AI decide; those come later, once the data is clean.


## Slide 8 — From a WhatsApp message to a clean order

*File id: `roadmap`*

- Intake agent up close
- What actually arrives
- Boss, Project A site need 1,500 m3 AAC 100mm by Tue 20 Oct. Can confirm ya
- 9:42 AM
- →
- What the board receives
- Customer
- Project A (internal)
- Confirmed
- Product
- AAC block, 100 mm
- Confirmed
- Volume
- 1,500 m³
- Confirmed
- Needed by
- Tue 20 Oct
- Confirmed
- Firm or likely?
- Likely: no call-off yet
- Check
- If the AI isn't sure, it asks a person. It never guesses.
- Illustrative message. Same source-first approach as VERA AI, the knowledge assistant I built at PETRONAS.

**Speaker notes:** Here's the intake agent up close, because this is where AI genuinely earns its place first. On the left is what an order really looks like at a plant: a WhatsApp message, short, informal, half in shorthand. On the right is what the board receives: customer, product, volume, date, each marked confirmed. The last field is the interesting one. The message says "can confirm" but there's no formal call-off yet, so the AI marks it as likely, not firm, and flags it for a person to check. That's the design principle: if the AI isn't sure, it asks; it never guesses. It's the same source-first approach I used for VERA, the knowledge assistant I built during my PETRONAS internship.


## Slide 9 — The dashboard: Plant Load Radar in one screen

*File id: `mvp`*

- Plant Load Radar
- Board
- Orders inbox (3)
- Decisions
- Ledger
- Ask the board
- Plant S · AAC blocks · weeks 41 to 46
- Updated 9:42 AM · 3 new orders read by the intake agent
- Weeks short
- 2
- Orders to check
- 3
- Decisions waiting
- 1
- Protected this month
- RM246k
- Spare (+) or short (−) capacity, m³
- +1,200
- Wk 41
- −700
- Wk 42
- −2,000
- Wk 43
- +4,100
- Wk 44
- +2,500
- Wk 45
- +1,000
- Wk 46
- Week 43 · 2,000 m³ short
- Project A call-off: RM82k a day delay risk
- Contractor B order: RM18k margin
- Serve Project A. Move B to week 44.
- Approve
- Change
- Orders inbox
- WhatsApp
- Project A · 1,500 m³ AAC 100 mm · Tue 20 Oct
- Likely · check
- Paper
- Contractor C · 600 m³ AAC 150 mm · Thu 29 Oct
- Firm · confirmed

**Speaker notes:** This is what the scheduler would actually use: Plant Load Radar in one screen. On the left, simple navigation: the board, the orders inbox, decisions, the ledger, and "ask the board". At the top, four numbers: two weeks are short, three new orders need checking, one decision is waiting, and the plant has protected about 246,000 ringgit this month. The chart shows spare or short capacity for the next six weeks, so you can see at a glance that week 43 is 2,000 cubic metres short and week 44 has 4,100 spare. The red card on the right is the planner agent's recommendation, with the ringgit on both sides, and the scheduler just taps approve or change. At the bottom is the orders inbox: everything the intake agent read this morning, from WhatsApp and paper, with anything uncertain marked for checking. It's built in Power Apps on top of Excel or SharePoint, so the plant doesn't need a new system. All numbers are illustrative.


## Slide 10 — Generative AI does the writing, people send it

*File id: `genai`*

- Writer agent output
- Huddle brief, drafted for the plant manager
- Plant S · this week's decisions
- Week 43 is 2,000 m³ short. Recommended: serve Project A (about RM82,000 a day of delay risk) and move Contractor B to week 44.
- Week 42 is 700 m³ short. Covered by AAC pre-built in week 41.
- Needs your call: one decision, week 43.
- Reply to Contractor B, waiting for approval
- Hi, thanks for your order of 1,500 m³ AAC 100 mm. Week 43 is fully booked, but we can deliver from Mon 26 Oct. Shall I lock that in for you?
- Approve and send
- Edit
- Ask the board
- Scheduler: "Can we take 800 m³ for Johor next week?" Agent: "Yes in week 44, which has 4,100 m³ free. Week 43 would go 2,800 m³ short."
- Illustrative outputs. The numbers come from the rule calculator; the model only writes the words.

**Speaker notes:** This is where generative AI earns its keep: the writing that eats a scheduler's time. On the left, the writer agent drafts the weekly huddle brief for the plant manager: what's short, what's recommended and why in ringgit, and the one decision that actually needs his call. On the right, it drafts the WhatsApp reply to Contractor B, offering the next free week instead of a flat no. It waits for approval; the scheduler taps approve or edits it first. And at the bottom, the scheduler can simply ask the board a question in plain language, like whether we can take 800 cubic metres for Johor next week, and the agent answers by running the calculator, not by guessing. All the numbers come from the rule calculator; the model only writes the words.


## Slide 11 — Rolling it out: about three months at one plant

*File id: `pilot`*

- Month 1
- **Understand and build**
- Sit with the plant scheduler
- Rebuild recent decisions from WhatsApp and paper, and price them
- Build the dashboard and the agents
- By the end: a working dashboard with the plant's real orders
- Month 2
- **Agree and go live**
- Agree the rule with the plant manager and a project director
- Start the weekly 30-minute huddle
- Log every decision with its ringgit
- By the end: the plant decides by the rule every week
- Month 3
- **Measure and decide**
- Compare cash, margin and delays with before
- Fix what didn't work
- Decide whether to roll out to precast and ready-mix
- By the end: a ringgit result and a go or no-go
- It worked if we see
- Cash released from excess stock
- Outside margin no longer lost
- Fewer project delay days

**Speaker notes:** Here's how we'd roll it out, at one plant first, over about three months. Month one is understand and build: sit with the scheduler, rebuild recent decisions from WhatsApp and paper so we know what today actually costs, and build the dashboard and the agents. By the end of month one, the plant has a working dashboard with its real orders. Month two is agree and go live: agree the rule with the plant manager and a project director, start the weekly 30-minute huddle, and log every decision with its ringgit. By the end, the plant is deciding by the rule every week. Month three is measure and decide: compare cash, margin and delays with before, fix what didn't work, and decide whether to roll it out to precast and ready-mix. We'll know it worked if we see cash released from excess stock, outside margin no longer lost, and fewer project delay days.


## Slide 12 — About me

*File id: `why-me`*

- Fakhrul Azim · Final-year Computer Science, Data Analytics, Universiti Teknologi PETRONAS
- I build agentic and generative AI that people actually use, and I can show the working.
- Achievements
- Dean's List, three semesters
- Universiti Teknologi PETRONAS
- IEEE paper accepted, MCAIT 2026
- Graph-grounded generative interfaces; presenting in Madinah
- HACKaSTONE 2026 Grand Final
- Qualified for Amsterdam with Team EduNova
- Codex Community Day presenter
- Presented Synapse with Team EduNova
- Esports gold, twice
- SUKIPT and Hotlink MLBB Unilegends; team went on to represent Malaysia in Singapore, 2024
- Projects and experience
- VERA AI · PETRONAS internship
- RAG knowledge assistant with strong benchmark results
- Technical Lead, System Automations
- UTP Career Development Office: 14 undocumented Power Automate flows rebuilt
- Arcana · final-year project
- Multi-agent pipeline on LangGraph, GraphRAG and Neo4j
- Synapse · founder, PocketLab
- Adaptive, agentic science learning for SPM students
- OmniX and Axiom · side projects
- Local-first AI creative suite; generative-UI learning platform
- Leadership
- Project Director, Griffin Esports Club
- Led UTP's esports club and ran a 16-team tournament
- LEADX 2.0 Symposium
- Sponsorship and Collaboration committee
- GDSC-UTP
- Ceremony and Protocol
- Korea outreach programme, Seoul
- Coordinated cultural performances and a food showcase

**Speaker notes:** A bit about me. On achievements: I've been on the Dean's List three times, I have an IEEE paper accepted at MCAIT 2026, which I'll present in Madinah, my team EduNova qualified for the HACKaSTONE 2026 Grand Final in Amsterdam, and we presented Synapse at Codex Community Day. Outside tech, I led UTP's esports club, and our team won gold twice and went on to represent Malaysia in Singapore. On projects: I built VERA, a RAG knowledge assistant, during my PETRONAS internship; I'm the technical lead for system automations at UTP's Career Development Office, where I rebuilt 14 undocumented Power Automate flows; my final-year project Arcana is a multi-agent pipeline on LangGraph, the same pattern as the agent layer I'm proposing; and I founded PocketLab to take Synapse further. I've also led and organised: the esports club, the LEADX symposium sponsorship committee, GDSC, and an outreach programme in Seoul. The common thread: I build agentic and generative AI that people actually use, and I can show the working.


## Slide 13 — Thank you

*File id: `questions`*

- Plant Load Radar · a proposal for Chin Hin Group
- One rule, one owner, one board, and agents doing the legwork.
- Fakhrul Azim Bin Ahmed Mardzukie
- fakhrulazim.am@gmail.com

**Speaker notes:** To sum up: one rule, one owner, one board, with agents doing the legwork and people making the call. Thank you for your time, and I'm happy to take any questions.
