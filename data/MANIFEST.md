# Data manifest

> Every file under `data/` must have a row here. Loaders refuse a file with no row (CLAUDE.md hard constraint 3, ADR D-06). `data-steward` owns this file.
> **Chin Hin has given us no data and none is assumed.** Everything here is public, model-generated or synthetic. There is no `real` kind and no private folder.

## Layout

| Folder | What goes in it |
|---|---|
| `data/public/` | Public information found by research, with a clear licence |
| `data/model/` | Output of a model we trained on public data, plus its model card |
| `data/synthetic/` | Seeded, config-driven generated data and its parameters |

Create a subfolder when its first file arrives; this file, not a placeholder, documents the convention. All of `data/` is committed.

## Kinds

- `public` — public information (government statistics, filings, published rates, press). Needs URL, licence, retrieved date, and what it does *not* measure.
- `model-generated` — produced by a model we trained. Needs: training sources (each itself a `public` row), code path, seed, model card (what it learned, what it cannot claim).
- `synthetic` — generated from a config file with a seed. Needs: seed, config path, and what it was calibrated to.
- Add `illustrative` in the note when a figure comes from the pitch deck rather than a source.

## Rows

One row per file, path relative to `data/`:

| file | kind | source URL / code path | licence | retrieved / seed | note |
|---|---|---|---|---|---|
| public/dosm-gdp-construction-quarterly.json | public | https://storage.dosm.gov.my/gdp/gdp_qtr_real_supply_sub.csv (via scripts/fetch-public-data.mjs) | CC BY 4.0 (data.gov.my); attribution: Department of Statistics Malaysia | 2026-10-08 | Quarterly REAL GDP for construction (p4) and subsectors, 2015 Q1 to 2026 Q2, RM million constant prices, plus yoy growth. Filtered from the raw file (SHA-256 in the file's meta). Measures value added, not value of work done; growth differs from the work-done series. |
| public/dosm-ppi-group239-monthly.json | public | https://storage.dosm.gov.my/ppi/ppi_3d.csv (via scripts/fetch-public-data.mjs) | CC BY 4.0 (data.gov.my); attribution: Department of Statistics Malaysia | 2026-10-08 | Monthly Producer Price Index for group 239 (other non-metallic mineral products, which includes cement and concrete articles), 2010 to Aug 2026. A coarse price-TREND proxy only; it is an index, not a cement or AAC price. |
| public/dosm-construction-q2-2026.json | public | https://www.dosm.gov.my/uploads/release-content/file_20260813095536.pdf | Malaysian Government Open Data Terms of Use 1.0 (reuse incl. commercial, with attribution) | 2026-10-08 | Value of work done Q2 2026 by subsector, owner and state, as published in the DOSM media statement. Hand-curated numeric facts; each carries its source. Checked against the full DOSM PDF on 2026-10-08. |
| public/material-prices-2026.json | public | https://www.dosm.gov.my/uploads/release-content/file_20260910090830.pdf and https://convince.cidb.gov.my/ | DOSM figures: Open Data Terms 1.0. CIDB and press figures: licence not stated; single price facts cited | 2026-10-08 | Cement, steel and ready-mix prices mid-2026. No AAC or precast RM per m3 price exists in public sources. One conflicting cement figure seen in an excerpt was excluded (see the file's caveats). |
| public/lad-terms.json | public | https://www.hba.org.my/laws/housing_reg/2002/schedule_h.htm and the Federal Court PJD Regency summary | Statutory terms and a court holding recorded as facts with citation | 2026-10-08 | 10 percent a year of purchase price, counted daily; 24 and 36 months; common-facilities rule; clock starts at the booking fee. Whether materials shortages extend the period is NOT verified. |
| public/chinhin-segments-q2fy26.json | public | https://insage.com.my/ir/cmn/downloading.aspx?sCompanyCode=CHINHIN&sFileName=26239000069303&sReportType=QR | Company disclosure to Bursa Malaysia; numeric facts cited, no text reproduced | 2026-10-08 | Segment revenue and PBT, Q2 and H1 FY26 with prior-year comparatives, RM thousand. Revenue sub-segments reconcile EXACTLY to the division subtotal in all four periods (tested). Checked against the full Bursa PDF on 2026-10-08. PBT margins, not contribution margins. |
| public/chinhin-capacity-statements.json | public | https://www.chinhingroup.com/news/chin-hin-to-procure-aac-machinery-from-shanghai-listed-jiangsu-teeyer-intelligent-for-its-third-manufacturing-plant/ and the FY2025 results release | Company statements recorded as facts with citation | 2026-10-08 | Nameplate AAC, precast and drymix capacity and the third-plant dates. Commissioning of the third plant is NOT confirmed. Utilisation is not public. |
| public/carrying-cost-range.json | public | https://supplychainmath.com/en/carrying-cost-impact.html and two other calculator sites | Rule-of-thumb ranges; no text reproduced | 2026-10-08 | Generic 20 to 30 percent carrying-cost range and components. LOW authority; carry as a low/base/high band with this tag. Sources disagree on the capital component. |
| synthetic/params.json | synthetic | src/data/synth.ts (configuration for the generator) | MIT (project code and config) | seed 20261054 | Generator configuration. Every parameter has a provenance note (a test enforces it); unsourced values are labelled ASSUMED or illustrative. Not data about any real plant. |
| synthetic/scenario.json | synthetic | src/data/synth.ts via `npm run generate:synthetic`; config synthetic/params.json | MIT (generated) | seed 20261054 | One fictional plant (AAC), 12 weeks from 2026-W41: capacity, 8 projects, 10 customers, firm orders, new requests. Calibrated to public series (capacity, seasonality, growth, project sizing, margin ratio; see meta.calibration). Week 43 is shaped to be 2,000 m3 short, as in the deck. Prices are a placeholder: no public AAC price exists. All parties fictional. |


## Searched and not found

Record what was looked for and where, so nobody repeats the search. Expected: plant- and order-level data is private by nature (PRD OQ-10).

Preliminary results from the 2026-10-08 secondary research (`refdocs/research/`). Files were downloaded afterwards in P0 Task 4; this table records what was searched and not found.

| Item | Searched | Outcome |
|---|---|---|
| Plant-level or order-level data (any public source) | Web search on AAC / precast / ready-mix orders and plant output | **Not found.** Only paid market reports (IndexBox, 6Wresearch — previews only) and a paid customs-data aggregator (licence unclear; do not ingest). |
| AAC selling price per m³ and variable cost | Web search | **Not found.** Only per-piece vendor-blog prices (inconsistent, unit mismatch). |
| Utilisation by plant, stock levels | Web search | **Not found** beyond historic statements (2016–17 full capacity; ~30% at Kota Tinggi end-2019, quoted in context, not re-verified). |
| Ready-mix price per m³ | CIDB CONVINCE; MBAM via FMT | **Found**, two figures: Grade 30 RM413.73 (CIDB, Jul 2026), RM402 (MBAM, Aug 2026). Candidate `public` rows. |
| Construction work done by state and sub-sector | DOSM Q2 2026 | **Found.** Candidate `public` row. |
| Cement and steel prices | DOSM special releases (Jun, Aug 2026) | **Found.** Candidate `public` rows. |
| Chin Hin segment revenue / PBT | Bursa Q2 FY26 interim report | **Found.** Candidate `public` row (pull the PDF). |
| LAD terms | Statute text (Schedule G/H), Federal Court summary | **Found.** Candidate `public` row (text). |
| Carrying-cost range | Calculator sites citing APICS/CSCMP-style benchmarks | **Found, low authority.** Use as a labelled range only. |
| Idle site cost | Web search | **Not found.** |
| A public dataset that could train a model of building-material order streams | DOSM/data.gov.my catalogue (290 datasets listed 2026-10-08), web search | **Not found.** The only relevant public series are aggregates: 46 quarterly construction GDP points and ~390 monthly PPI points per series. See ADR D-14: no trained model. |
| Cement or concrete-products production volumes | data.gov.my catalogue lists Industrial Production Index series (`ipi_3d`, `ipi_5d`) | **Lead, not downloaded.** The catalogue shows them ending in 2024; check whether a cement/concrete-articles line exists and whether it is current. Index only, not m3. |
