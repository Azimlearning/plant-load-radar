# 01 — The problem statement, researched

> Companion to `refdocs/context/02_PROBLEM_STATEMENT.md` (the brief as received). Labels: ✅ primary source seen · 🟡 reputable secondary · 🔶 vendor/self-reported · ❓ inference or unverified. Researched 2026-10-08.

## 1. What the brief really tests

Five asks (allocation + decision rights; quantify today's cost with working; one view of internal + external demand; where AI helps and where it is premature; build something a scheduler could use) under four constraints (no new ERP, no consultant, no handed-down transfer price, no escalation, 12 weeks) and one success rule (a behaviour or cash change, not usage). The traps are in the context file. Two further observations from the research:

- **The brief was written by people who already run a big ERP programme** (see 02 §5). "No new ERP" is not hostility to software; it is a boundary: *don't make us re-platform for this*. Our answer should add a layer beside the ERP, never ask to replace anything.
- **"Quantify what the current arrangement costs the business … show your working"** is the one ask we cannot answer with Chin Hin numbers. What we can show is a *method with sourced parameters* and a sensitivity band (§4–5). That is a legitimate and honest answer for a team with no data.

## 2. The central tension: "capacity is tight" versus what Chin Hin is building

| Period | What the sources say | Label |
|---|---|---|
| 2016 | Serendah AAC plant "operating 24 hours a day"; analyst note cites **lead times of four to five months** because of plant limits (The Edge, Sept 2016) | 🟡 |
| FY2017 | Serendah "running at its full capacity"; Kota Tinggi 600,000 m³ plant due mid-Q2 2018 "to address the bottleneck"; about half of Kota Tinggi for wall panels, "approximately 1.5 times better margin than AAC blocks"; panels popular with Singapore's HDB (Annual report MD&A) | ✅ |
| End-2019 | Kota Tinggi ran at about 30% utilisation (excess supply, weak property market, price war) — from the Annual Report 2019, quoted in context `04`; **not re-verified this round** | ❓ |
| 2025–26 | Third Serendah AAC plant (RM80m, "world's largest single AAC production line", +1,000,000 m³) takes capacity from ~1.2M to ~2.2M m³/yr. MOU (Jun 2025): full production by **31 May 2026**; Feb 2026 results: commissioning by **July 2026**; priority "ramping up new AAC capacity". **No confirmation of commissioning found.** | ✅ (plans) / ❓ (status) |
| Mid-2026 | Property market soft: Rehda 1H2026 — 59% of 181 surveyed developers hold unsold completed units; 63% have no 2H launch plans; average construction cost +13% (Mar–Jun) 🟡. Construction work done +8.8% in Q2 but cooling from +14.7% in 1H 2025 ✅ | ✅🟡 |

**So what.** The history is boom → bust → boom of capacity relative to demand. In 2026 Chin Hin is adding capacity into a soft market while its internal property and construction arms grow strongly (property +31.2%, construction +22.0% in 1H FY26 ✅). A sharp judge will say: *you built a third plant; where is the shortage?* Three honest framings (pick one with the team; none is Chin Hin data):

1. **Scarcity is local, not national.** Capacity binds by plant, product and week: precast moulds, ready-mix truck dispatch, panel lines versus block lines, a single plant's output versus a site's call-off. Total nameplate hides these. (The brief itself names AAC, precast *and* ready-mix.) ❓
2. **The ramp-up window.** New lines ramp over months; during ramp, effective capacity trails nameplate while internal call-offs are growing. ❓
3. **The rule is also a utilisation tool.** When capacity is abundant the same ringgit comparison decides what to do with spare capacity (pre-build, take marginal orders) — protecting against the 2019 pattern. This is the "fill the quiet weeks" rule already in the design. ❓

Do not claim Chin Hin has a shortage today. Say: *"when capacity binds — and it will in specific plants, products and weeks — here is how the decision is made."* → PRD **OQ-13**.

## 3. The cost-of-delay number, examined (LAD)

**What the law says** ✅ (statutory contract text via the National House Buyers Association, and PropertyGuru):

- Schedule G (landed): vacant possession within **24 months** of the agreement. Schedule H (strata, i.e. subdivided): **36 months**.
- If late, the developer pays liquidated damages "calculated from day to day at the rate of **ten per centum (10%) per annum of the purchase price**" from the expiry of the period until the purchaser takes vacant possession.
- Common facilities: if late, 10% p.a. of the **last 20%** of the purchase price.
- The Federal Court in *PJD Regency Sdn Bhd v Tribunal Tuntutan Pembeli Rumah* (19 Jan 2021) held the period runs from the date the **booking fee** was paid, not the date printed on the SPA 🟡 (Federal Court summary and law-firm notes).

**Arithmetic, re-checked** ✅: RM300,000,000 × 10% ÷ 365 = **RM82,191.78/day**. A single RM500,000 unit 30 days late: RM4,109.59. PropertyGuru's worked example (RM100,000, 139 days) gives RM3,808.22 ✅ — it matches the formula.

**Why the headline number is fragile** (❓ reasoning, flagged for an ADR in P0):

- LAD is owed **per purchaser**, **only after that unit's own deadline**. "RM300m ⇒ RM82k/day" is correct only if *every unit in the block* is already past its deadline and every day of material delay adds a day of slip to every unit. In practice a late delivery of *some* m³ shifts only the critical-path trades, and may be absorbed by float.
- **Scale check:** if Chin Hin's *entire* RM2.18bn unbilled property sales were simultaneously late, LAD would be 2.18bn × 10% ÷ 365 ≈ RM597k/day. RM82k/day is about 14% of that — plausible for one large launch, but it is an upper-envelope, not a typical day.
- **Intra-group wrinkle:** if the group's own construction company is the main contractor, any contractor-level LAD to the developer nets out at group level; the buyer-facing LAD is the real cash cost. The group-level view is what the rule needs, but the pitch should not double-count.
- **Not verified:** whether materials shortages are a recognised ground for *extension of time* under the statutory contract. If they are, delay cost is lower; if they are not, the developer bears it. → PRD **OQ-16**; needs a legal read.

**Design implication (recommended, not yet decided):** add a *schedule-sensitivity factor* (0–1: the share of a project's handover that actually slips per day of material delay) and a *float/buffer* to the delay-cost card; keep RM82k/day as the **upper-bound illustration** and label it so. The plan already carries `buffer days`; the factor is new.

## 4. The other cost buckets

| Bucket | Formula (from context `03` §9) | Public parameters found | Gap |
|---|---|---|---|
| Working capital in excess stock | excess inventory value × carrying rate | Carrying cost is commonly quoted at **20–30%** of inventory value per year, built from capital (≈6–15%), storage/handling (≈2–10%), insurance (≈1–3%), obsolescence/shrinkage (≈2–12%) 🔶 (calculator sites citing APICS/CSCMP-type benchmarks; no primary source) | AAC is durable and low-obsolescence, so the true rate is probably at the low end ❓; Chin Hin's own finance cost is in filings (finance costs RM47.6m in 1H FY26 ✅) but net debt was not retrieved |
| Lost margin | missed external m³ × contribution margin/m³ | Segment PBT margins ✅ (Q2 FY26): AAC + precast **10.8%** (PBT RM19.59m on revenue RM180.97m); ready-mix **10.3%** (RM8.16m on RM79.55m). These are PBT margins, so contribution margins are higher ❓ | **No public AAC or precast RM/m³ selling price or variable cost.** Needs synthetic parameters with a sensitivity band |
| Delay cost | §3 above | LAD terms ✅ | Idle site cost: no public source (PRD OQ-07) |
| Utilisation value | 1 pp × 2.2M m³ = 22,000 m³ | ✅ arithmetic | Needs a price/m³ and margin to become ringgit; nameplate status unconfirmed |

## 5. Public data inventory — what exists and what does not

| Item | Found | Source | Use |
|---|---|---|---|
| Construction work done, Q2 2026: RM47.8bn, +8.8% YoY; 1H RM94.3bn, +8.7%; private 65.8%; Selangor RM12.2bn (25.5%), Johor RM9.4bn (19.6%); residential RM10.9bn (22.8%) | ✅ | DOSM release 13 Aug 2026 | Calibrate synthetic demand scale and regional split |
| Building-material prices: OPC RM25.80/50 kg (Aug 2026); steel RM3,484.20/t (Aug 2026) | ✅ | DOSM special release 10 Sep 2026 | Cost-side context |
| Ready-mix Grade 30: RM413.73/m³ (CIDB CONVINCE, July 2026); RM402/m³, up 15% (MBAM/PKBM via FMT, Aug 2026) | ✅🟡 | CIDB; Free Malaysia Today | Ready-mix price anchor (two sources disagree by ~3%) |
| Rehda 1H2026 survey | 🟡 | Rehda via The Star, Malay Mail, EdgeProp | Demand softness; cost inflation |
| Chin Hin segment revenue/PBT, Q2 and 1H FY26; group eliminations RM173.6m (Q2), RM336.5m (1H) — all inter-segment, not just materials→construction | ✅ | Bursa quarterly report (Insage) | Margin anchors; evidence that inter-segment flows exist |
| Chin Hin AAC / precast / drymix capacity statements | ✅ | Company releases, AR2024 MD&A, FY2025 AR excerpts | Capacity anchors (precast "6 plants, 600,000 t/yr" ✅ per FY2025 AR excerpt) |
| AAC price per **piece** RM1.50–3.50 (and "RM4.16–5.00" elsewhere) | 🔶 | Vendor blogs | **Do not use** — unit mismatch, inconsistent, vendor-written |
| Export shipment-level records for Starken AAC to Singapore/Philippines | 🔶❓ | A paid customs-data aggregator | Licence unclear; **do not ingest**; shows that shipment-level data exists commercially but not openly |
| **AAC RM/m³ price, plant orders, utilisation by plant, stock levels** | ✗ not found | — | Synthetic, with sensitivity bands (PRD OQ-10) |

## 6. What this means for the build (feeds P0)

- Parameterise **everything** in §3–4 with low/base/high values and a source tag; never a single literal.
- Keep RM82k/day as the pitch's *illustrative upper bound*; compute the demo from the sensitivity-adjusted card.
- Synthetic demand scale can be anchored to DOSM state shares (Selangor/Johor ≈ 45% of national work done ✅) and to Chin Hin's capacity statements; label it `synthetic`, calibrated to those rows.
- The week-43 story survives all of this as a *worked example of the logic*; the pitch must say it is illustrative.

## 7. Sources

- Chin Hin Q2 FY26 interim report (Bursa): <https://insage.com.my/ir/cmn/downloading.aspx?sCompanyCode=CHINHIN&sFileName=26239000069303&sReportType=QR>
- EdgeProp, Chin Hin Q2 FY26: <https://www.edgeprop.my/content/1917262/chin-hin-quarterly-revenue-tops-rm1b-stronger-property-construction-contributions>
- The Edge, Chin Hin 2Q net profit −64%: <https://theedgemalaysia.com/node/816053>
- Chin Hin FY2025 results release: <https://www.chinhingroup.com/news/chin-hin-group-revenue-surges-25-past-rm4-billion-as-gp-jumps-47-and-pbt-ri/>
- Chin Hin third AAC plant MOU: <https://www.chinhingroup.com/news/chin-hin-to-procure-aac-machinery-from-shanghai-listed-jiangsu-teeyer-intelligent-for-its-third-manufacturing-plant/>
- Chin Hin MD&A (FY2017 text on capacity and panels): <https://www.insage.com.my/ir/cmn/downloading.aspx?sCompanyCode=CHINHIN&sFileName=135933&sReportType=OR>
- The Edge (Sept 2016, lead times): <https://theedgemalaysia.com/article/chin-hin%E2%80%99s-expansion-plans-track-land-purchase> (page metadata shows a crawl date; content is 2016)
- Schedule H text (NHBA): <https://www.hba.org.my/laws/housing_reg/2002/schedule_h.htm>
- *PJD Regency* Federal Court summary: <https://www.kehakiman.gov.my/sites/default/files/documents/Ringkasan_Media/2021/Re%20PJD%20Regency%20Sdn%20Bhd%20and%20Tribunal%20Tuntutan%20Pembeli%20Rumah%20%26%20Anor%20and%20other%20appeals.pdf>
- Thomas Philip on the LAD start date: <https://www.thomasphilip.com.my/articles/recent-development-calculation-of-liquidated-ascertained-damages-for-the-late-delivery-of-vacant-possession/>
- PropertyGuru LAD worked example: <https://www.propertyguru.com.my/property-guides/how-much-lad-can-i-claim-and-how-to-calculate-16823>
- DOSM Construction Statistics Q2 2026: <https://www.dosm.gov.my/portal-main/release-content/construction-statistics-q22026>
- DOSM building-materials price releases: <https://www.dosm.gov.my/uploads/release-content/file_20260910090830.pdf>, <https://www.dosm.gov.my/uploads/release-content/file_20260709083400.pdf>
- CIDB CONVINCE material prices: <https://convince.cidb.gov.my/>
- FMT on MBAM/PKBM cost pressures: <https://www.freemalaysiatoday.com/category/nation/2026/08/17/rising-costs-hitting-sector-harder-than-data-suggests-works-minister-told>
- Rehda 1H2026 (The Star): <https://www.thestar.com.my/business/business-news/2026/09/24/real-estate-market-eyes-1h27-turnaround>; (Malay Mail): <https://www.malaymail.com/news/money/2026/09/23/malaysias-property-market-stays-soft-in-1h-2026-with-nearly-60pc-of-developers-reporting-unsold-units-rehda-survey-finds/236219>
- Carrying-cost ranges (calculator sites, low authority): <https://supplychainmath.com/en/carrying-cost-impact.html>, <https://aislestock.com/carrying-cost>
