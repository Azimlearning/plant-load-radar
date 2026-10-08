# 06 — Council Debates

Method: the llm-council approach (five advisors → anonymous peer review → chairman verdict), **run by one AI playing each role in turn**, not separate models.

## Round 0 — Choosing the problem statement

**1 Oct, first pass (NTT still available):**

| Rank | Project | Reason |
| --- | --- | --- |
| 1 | NTT Data — AI-Powered Audit Lifecycle | Agentic pipeline fit (Arcana pattern); strongest SWE/AI brand |
| 2 | Chin Hin — Capacity & Demand | Data analytics fit; strongest Kabel hiring track record |
| 3 | Glocomp — Employee Culture & Retention | Easiest but most generic |

**1 Oct, after NTT withdrew:**

| Rank | Project | AI fit | Analytics fit | Hiring signal | 2-week feasibility |
| --- | --- | --- | --- | --- | --- |
| 1 | Chin Hin — Capacity & Demand | High | High | Highest | Medium |
| 2 | Chin Hin — Property Booking Conversion | Medium | High | High | High |
| 3 | Glocomp — Commercial ROI | Medium | High | Medium | Medium |
| 4 | Glocomp — Culture & Retention | Low | Medium | Medium | High |

Deep dive: Capacity & Demand won on technical depth (forecast + optimisation + agent), less sensitive data, the new Serendah plant ramp, and the 2019 utilisation lesson. Property Booking was a close second (timely: Rehda loan-rejection data; CHGP RM2.2bn unbilled) but more analytics than engineering and has sensitive buyer data.

## Round 1 — Solution design (before the brief)

Candidates: S1 forecast dashboard · S2 pipeline-driven demand · S3 knowledge-graph copilot (Arcana) · S4 order-promising agent · S5 demand shaping.

| Advisor | Position |
| --- | --- |
| Contrarian | S1 is generic and overlaps Chin Hin's earlier procurement challenge; S3 risks a chatbot guessing numbers. Back S2 + S4. |
| First Principles | Real decisions: how much, which plant, which orders. Demand is lumpy → model from projects (S2). |
| Expansionist | Chin Hin's own pipeline is the moat; S5 answers the 2019 price war. |
| Outsider | Drop jargon: "we tell Chin Hin, months early, which plant will be too busy or too idle." |
| Executor | Only a thin S2 + S4 slice is buildable in 2 weeks. |

**Verdict:** S2 + S4 + constrained S3 agent → **Plant Load Radar v1.5**. S1 = baseline; S3 graph and S5 → roadmap.
Blind spots flagged: audience is Kabel screeners; value in utilisation points (22,000 m³ each); teammates may be business majors; traceability.

## Round 2 — Re-debate against the real brief

| Advisor | Position |
| --- | --- |
| Contrarian | Leading with forecasting fails; brief warns AI may be premature. Lead with allocation. |
| First Principles | Two problems: allocation (rule + decision rights) and visibility (one view). Substitute for transfer price = cost of delay vs contribution margin. |
| Expansionist | Protected capacity for firm call-offs (use it or lose it) changes behaviour — exactly what the brief measures. |
| Outsider | Scheduler's question: "who gets the next 500 m³?" Answer in one line with the RM reason. |
| Executor | Build in Excel/SharePoint + Power Apps + "paste the WhatsApp" box. |

**Verdict:** Plant Load Radar 2.0 — rule, decision rights, board, ledger, AI capture. Keep firm/likely/possible tiers; drop forecasting as headline; defer graph.

## Round 3 — Brainstorm refinements (5 Oct)

Added: promises kept · close call → first confirmed · fill quiet weeks (pre-build AAC within a stock cap) · delay-cost card · margin card · one rule, three levers.
Parked: discounts to move orders · AI auto-allocation · group-wide forecasting · cross-division knowledge graph.

## Round 4 — Agentic/GenAI integration (5 Oct)

Question: how to showcase agentic + GenAI experience without contradicting "where AI is premature".
Answer: a 4-agent pipeline (Intake, Matching, Planner, Writer) where agents do legwork, tools do maths, and a human approves. GenAI limited to writing (briefs, replies, ledger notes) and plain-language Q&A backed by the calculator. Forecasting and AI-decides remain explicitly premature.
