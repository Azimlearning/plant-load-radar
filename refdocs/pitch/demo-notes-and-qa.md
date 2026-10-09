# Demo notes and Q&A sheet

> For Azim, rehearsing the Plant Load Radar pitch; the team can use it as a second reader. Every number below was read from the running prototype on 2026-10-09 (all synthetic and illustrative: not Chin Hin's). The slides in `refdocs/Docs/` are untouched; where the prototype differs from a slide, this sheet says what to say.

## 1. The three-minute live walk-through

Open the link. The first thing on every page is the yellow notice: **synthetic data, fictional parties, not Chin Hin data.** Say it once, out loud, at the start.

| Step | Click | Say | On screen (check as you go) |
|---|---|---|---|
| 1 | **Board** | "One screen: capacity against demand, internal and outside together." | Week 43 is 2,000 m³ short: 1,800 m³ free after confirmed orders, 3,800 m³ wanted. Chart is blue above the line, red below. |
| 2 | Decision card (right) | "The rule serves whoever has more ringgit at stake." | Serve Project A, 1,500 m³, **RM575,342** (one more week's wait past its handover deadline). Move Contractor B, 600 m³, **RM30,705** margin at risk, to Week 44. Projects D and C move too at **RM0**: they have float. |
| 3 | Build-ahead card | "AAC can be stocked, so we show the alternative." | Stock limit 1,000 m³ (an assumption). It covers 1,000 m³; 1,000 m³ is still short, so the rule still has to choose. |
| 4 | **Orders inbox** | "Orders arrive as WhatsApp. A rules reader turns them into lines and says how sure it is." | 22 messages, 21 order lines, 18 need a person. The deck's own message ("Boss, Project A site need 1,500 m3 AAC 100mm by Tue 20 Oct. Can confirm ya") reads as customer, product, volume and date confirmed, tier **likely** (no PO yet). The prompt-injection message is flagged and ignored. |
| 5 | **Decisions** | "A person decides. The server works out the ringgit itself." | Type a name, **Record decision**. Show the huddle brief and the reply to Contractor B (offers Week 44, no ringgit in it, "nothing has been sent"). |
| 6 | **Ledger** | "Every decision with the ringgit on both sides, who took it, when." | One row, RM575,342 served, RM30,705 pushed back. The total is labelled "at stake, not a saving". |
| 7 | **Ask the board** | "Plain question, calculator answer." | Week 43, 1,800 m³: "only by contesting other requests"; the next week with room is Week 44. |
| 8 | **Cost of today** | "The brief asked for the cost of today's setup with working shown." | Base RM1,559,824 a year: stock RM920,956, margin RM63,525, delay RM575,342. Low RM368,383, high RM3,615,081. Every step tagged public, assumed or placeholder. **No benefit claim.** |
| 9 | Ledger → **Start the demo again** | (only on the hosted version) | Clears your browser's decisions so the next run starts clean. |

If time is short, cut steps 7 and 8 to one sentence each (the script already allows cutting slides 6 and 11).

## 2. What to say plainly (before a judge asks)

- "The intake you see is a **rules reader today**, not a language model. It never marks something confirmed unless the words are in the message. A model reader is the next step and would sit behind the same check."
- "The drafts are **templates**. Nothing is sent: there is no WhatsApp or email connection in this demo."
- "All data is **synthetic or public**. Chin Hin has given us none. Every assumed input on the cost page says what real data replaces it."
- "The deck shows Power Apps on Excel or SharePoint; this prototype is a web app so you can click it. The design is the same; the platform is a delivery choice."
- "A typed name is not a login. It exists so every ledger row names a person."

## 3. Where the prototype and the deck differ

A judge who has read the slides may notice these. Say them first.

| Slide says | Prototype shows | What to say |
|---|---|---|
| Slide 4: Contractor B worth about RM18,000 | RM30,705 | "The slide was a round illustrative figure. The prototype computes it from a margin per m³ that is itself a placeholder, because no public AAC price exists." |
| Slide 4: Project A about RM82,000 a day | RM575,342 for one more week | "Same rule: RM82,192 a day times seven days. The screen shows the week because the decision is a week." |
| Slide 9: chart of six weeks, Week 44 has 4,100 m³ spare | Twelve weeks, Week 44 has 3,279 m³ spare | "The slide was a mock-up. The prototype's numbers come from a generated scenario; the shape of the story, Week 43 short and Week 44 with room, is the same." |
| Slide 9: "3 orders to check" | 18 of 21 lines | "The samples are deliberately hard. Most are 'likely' because no PO number is given, which the design flags on purpose." |
| Slide 9: "RM246k protected this month" | A ledger total labelled "ringgit at stake", not savings | "We removed 'protected' because nothing has been measured yet. A pilot would measure it." |
| Slide 10: Week 42 is 700 m³ short, covered by building ahead | Week 42 has 1,859 m³ spare | "Different generated scenario; the build-ahead idea is shown on Week 43 instead." |
| Slides 3, 6, 7, 9: Power Apps, Foundry, LangGraph, Power Automate | A web app, no orchestration framework | "That is the production path. For the MVP, four typed steps in a function were cheaper to build and to read." |

## 4. The platform's AI review of the submission (91/100) and how we answer it

Scores: clarity 23/25, relevance 24/25, innovation 21/25, feasibility 23/25. Its weaknesses and red flag, checked against the prototype:

| Their point | Is it fair? | What the prototype shows | Honest answer |
|---|---|---|---|
| **Relies on accurate, current schedule and milestone inputs from project planners, which may lag** | Yes | Late-handover cost comes from each project's deadline, projected handover, buffer and price. Those are set once per project and are inputs, not guesses by the system. | "Stale inputs are the main data risk. Month one rebuilds recent decisions from WhatsApp and paper to see how stale they really are, and the weekly huddle re-confirms the projects that are contested. A wrong input shows up in the ledger as a wrong ringgit, where someone can see and correct it." |
| **The 10% tie-breaker could meet resistance from outside clients if internal jobs keep winning** | Partly | Week 43 shows internal winning by a wide margin (RM575,342 against RM30,705) because a legal penalty is far larger than a margin. It also shows internal requests with float costing RM0 to wait, so outside orders go first in that case. The ledger logs both sides. | "Internal wins only when a handover is truly at risk; with float it costs nothing to wait. The 10% band applies only when the two values are nearly equal, and then the **earlier confirmed request goes first**, whoever it is. Confirmed orders are never bumped, and a request that loses is offered the next free week, not refused. Group finance reviews the ledger monthly, so any drift towards one side is visible." |
| **Pre-build limits (yard space, curing cycle) are only touched on, not modelled** | Yes | One stock limit of 1,000 m³, shown on screen and labelled an assumption. The board now also says that yard space and the autoclave's curing cycle are not modelled. | "We model one stock limit on purpose. The plant's real yard and curing constraints replace that single number in the pilot; they are on the data request list." |
| **Red flag: site managers who submit call-offs late could force sudden, high-penalty overrides** | Reasonable | Confirmed orders are never taken back; reservations lapse if unused; a late call-off competes under the same rule as any new request. | "A late call-off cannot bump an order that is already confirmed. Early confirmation earns protected capacity, and unused reservations are released, so the incentive is to confirm early. A late one with a large penalty at stake does win a contested week, which is the intended behaviour, and it shows up in the huddle with its ringgit." |

## 5. Hardest questions and honest one-line answers

1. **Why not just forecast better?** Forecasting does not decide who is served, and the data is on WhatsApp and paper. Fix the decision and the capture first; forecasting comes after a few months of clean data.
2. **What share of RM1.56m do you save?** We do not know and will not guess: those inputs are invented, month one replaces them with your data, and month three measures the saving.
3. **If our plant is short, the site buys AAC from a competitor. Where is RM82k a day?** Then the real delay cost is the extra paid outside; RM82k a day is the ceiling when no substitute arrives in time. The page labels it an upper bound, charged only after the deadline.
4. **Doesn't building ahead raise working capital?** It is capped (1,000 m³ in the demo), only fills a known short week, and the pilot measures stock before and after, so a rise would show.
5. **Why would a plant manager follow a rule that costs his margin?** The ledger records the ringgit he gave up for the group so finance can credit his plant, and the huddle gives him a say on exceptions. The rule also protects his margin whenever an outside order is worth more.
6. **Is the AI deciding?** No. A calculator produces every number, a rules reader (a model later) writes words around them, and a named person approves. The server ignores any figure in a form.
7. **Isn't an agent pipeline overkill for WhatsApp?** It meets the plant where it is: orders keep arriving by WhatsApp and the agents turn them into data. Each step is small and can be switched off without breaking the board.
8. **What if there is not much data?** The first phase rebuilds recent decisions from chats and paper; that is the baseline.
9. **Does a materials shortage extend the legal deadline?** We do not know and the page says so; it is why the delay cost has a low case of zero days.
10. **Why a web app when the deck says Power Apps?** The prototype had to be clickable by anyone with a link. The data model and rule are platform-independent.

## 6. Not built, and what the pilot would do first

- A language-model reader and writer (needs an API key; the interfaces are in place).
- Photos of paper delivery orders (vision/OCR); only text and spreadsheet rows are read.
- WhatsApp and Power Automate connections, real accounts, more than one plant.
- Real yard and curing constraints; a real carrying rate; real margin per m³.
- First data to ask for: recent orders and allocation decisions (even WhatsApp or paper), weekly output and downtime, stock levels by plant, margin per m³ by product and customer, project handover deadlines and buffers.
