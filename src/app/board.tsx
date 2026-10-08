// The board screen. A synchronous, hook-free component: it receives a finished BoardModel and only lays it out.
// It performs no arithmetic and formats no numbers; every figure it prints is a string from src/data/board.ts,
// which records them (see board.test.tsx, the "every figure comes from the model" check).

import type { Bar, BoardModel, Chart, Line, RecommendationView } from "@/data/board";

// ---- chart geometry (pixels in the SVG's own coordinate system; not data) ----------------------------
const VIEW_W = 760;
const VIEW_H = 288;
const MARGIN = { left: 56, right: 12, top: 28, bottom: 52 };
const MAX_BAR = 24; // dataviz spec: bars are at most 24px thick
const BAR_FILL = 0.55; // share of a slot a bar may occupy
const CORNER = 4; // rounded data end, square at the baseline

function barPath(x: number, w: number, y0: number, yTip: number): string {
  const up = yTip < y0;
  const h = Math.abs(y0 - yTip);
  const r = Math.min(CORNER, h / 2);
  if (h === 0) return "";
  return up
    ? `M${x},${y0} L${x},${yTip + r} Q${x},${yTip} ${x + r},${yTip} L${x + w - r},${yTip} Q${x + w},${yTip} ${x + w},${yTip + r} L${x + w},${y0} Z`
    : `M${x},${y0} L${x},${yTip - r} Q${x},${yTip} ${x + r},${yTip} L${x + w - r},${yTip} Q${x + w},${yTip} ${x + w},${yTip - r} L${x + w},${y0} Z`;
}

function ChartSvg({ chart }: { chart: Chart }) {
  const plotW = VIEW_W - MARGIN.left - MARGIN.right;
  const plotH = VIEW_H - MARGIN.top - MARGIN.bottom;
  const yFor = (m3: number) => MARGIN.top + ((chart.extentM3 - m3) / (2 * chart.extentM3)) * plotH;
  const y0 = yFor(0);
  const slot = plotW / chart.bars.length;
  const barW = Math.min(MAX_BAR, slot * BAR_FILL);

  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="img" aria-label={chart.summary} className="chart-svg">
      <title>{chart.summary}</title>

      {chart.ticks.map((t) => (
        <g key={t.m3}>
          <line x1={MARGIN.left} x2={VIEW_W - MARGIN.right} y1={yFor(t.m3)} y2={yFor(t.m3)} className={t.m3 === 0 ? "axis-zero" : "grid"} />
          <text x={MARGIN.left - 8} y={yFor(t.m3) + 4} textAnchor="end" className="tick">
            {t.label}
          </text>
        </g>
      ))}

      {chart.bars.map((b: Bar, i) => {
        const cx = MARGIN.left + slot * i + slot / 2;
        const x = cx - barW / 2;
        const tip = yFor(b.spareM3);
        const labelY = b.spareM3 < 0 ? tip + 16 : tip - 6;
        return (
          <g key={b.week}>
            {b.contested && <rect x={MARGIN.left + slot * i + 2} y={MARGIN.top} width={slot - 4} height={plotH} className="wash" />}
            <path d={barPath(x, barW, y0, tip)} className={b.kind === "short" ? "bar-short" : "bar-spare"}>
              <title>{b.aria}</title>
            </path>
            {b.label && (
              <text x={cx} y={labelY} textAnchor="middle" className="value-label">
                {b.label}
              </text>
            )}
            <text x={cx} y={VIEW_H - MARGIN.bottom + 18} textAnchor="middle" className="tick">
              {b.short}
            </text>
            {b.contested && (
              <text x={Math.min(Math.max(cx, 52), VIEW_W - 52)} y={VIEW_H - 10} textAnchor="middle" className="decision-tag">
                Decision needed
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function Legend() {
  return (
    <ul className="legend" aria-label="Legend">
      <li>
        <span className="swatch swatch-spare" aria-hidden="true" /> Spare capacity (above the line)
      </li>
      <li>
        <span className="swatch swatch-short" aria-hidden="true" /> Short (below the line)
      </li>
    </ul>
  );
}

function LineItem({ line }: { line: Line }) {
  return (
    <li className="line-item">
      <div className="line-main">
        <span className="line-who">{line.who}</span>
        <span className="tag">{line.side === "internal" ? "Internal" : "Outside"}</span>
      </div>
      <div className="line-sub">
        {line.volume}
        {line.to ? <> · moves to {line.to}</> : null}
      </div>
      <div className="line-value">
        <span className="rm">{line.value}</span> <span className="meaning">{line.valueMeaning}</span>
      </div>
    </li>
  );
}

function Recommendation({ rec, actionsNote }: { rec: RecommendationView; actionsNote: string }) {
  const p = rec.prebuild;
  return (
    <section className="card" aria-labelledby={`rec-${rec.week}`}>
      <p className="eyebrow">Decision needed</p>
      <h2 id={`rec-${rec.week}`} className="card-title">
        {rec.headline}
      </h2>
      <p className="muted">
        {rec.freeText} · {rec.wantedText}
      </p>

      <div className="two-col">
        <div>
          <h3 className="col-title">Serve this week</h3>
          <ul className="lines">{rec.served.map((l) => <LineItem key={l.who + l.volume} line={l} />)}</ul>
        </div>
        <div>
          <h3 className="col-title">Move to the next free week</h3>
          <ul className="lines">{rec.moved.map((l) => <LineItem key={l.who + l.volume} line={l} />)}</ul>
        </div>
      </div>

      <p className="rule-note">
        The rule serves whichever request has more ringgit at stake. Nothing confirmed is bumped, and a request that
        loses is offered the next week with room rather than refused.
      </p>

      <div className="actions">
        <button type="button" disabled aria-describedby="not-built">
          Approve
        </button>
        <button type="button" disabled aria-describedby="not-built">
          Change
        </button>
        <span className="actions-note">{actionsNote}</span>
      </div>

      <div className="alt">
        <h3 className="col-title">Alternative: build ahead</h3>
        {p.possible ? (
          <>
            <p className="muted">
              AAC can be stocked. With a stock limit of {p.stockCap}, the quiet weeks before this one can cover {p.covers};{" "}
              {p.dissolves ? "that removes the shortage." : `${p.stillShort} would still be short, so the rule still has to choose.`}
            </p>
            <ul className="moves">{p.moves.map((m) => <li key={m}>{m}</li>)}</ul>
            {!p.dissolves && (
              <div className="two-col">
                <div>
                  <h4 className="sub-title">Then served</h4>
                  <ul className="lines">{p.served.map((l) => <LineItem key={l.who + l.volume} line={l} />)}</ul>
                </div>
                <div>
                  <h4 className="sub-title">Then moved</h4>
                  <ul className="lines">{p.moved.map((l) => <LineItem key={l.who + l.volume} line={l} />)}</ul>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="muted">No earlier week has spare capacity to build ahead.</p>
        )}
        <p className="rule-note">
          The stock limit is an assumption, set by the team: a larger limit can make the shortage disappear, and stock
          ties up cash. It is shown here so the choice is visible.
        </p>
      </div>
    </section>
  );
}

export function Board({ model }: { model: BoardModel }) {
  return (
    <div className="board">
      <div className="banner" role="note">
        {model.banner}
      </div>

      <header className="header">
        <h1 className="title">{model.title}</h1>
        <p className="muted">
          {model.plant} · {model.product} · {model.range}
        </p>
      </header>

      <section aria-label="Headline figures" className="kpis">
        {model.kpis.map((k) => (
          <div key={k.id} className="kpi">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-note">{k.note}</div>
          </div>
        ))}
      </section>

      <section className="card" aria-labelledby="chart-title">
        <h2 id="chart-title" className="card-title">
          Spare or short capacity, by week
        </h2>
        <p className="muted">Cubic metres left after confirmed orders and this week&apos;s new requests.</p>
        <Legend />
        <p className="scroll-hint">Narrow screen: scroll the chart sideways to see every week, or open the table below.</p>
        <div className="chart-scroll">
          <ChartSvg chart={model.chart} />
        </div>
        <details className="twin">
          <summary>Show as a table</summary>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th scope="col">Week</th>
                  <th scope="col">Capacity</th>
                  <th scope="col">Committed</th>
                  <th scope="col">Free</th>
                  <th scope="col">New requests</th>
                  <th scope="col">Spare or short</th>
                </tr>
              </thead>
              <tbody>
                {model.weekTable.map((r) => (
                  <tr key={r.week}>
                    <th scope="row">{r.week}</th>
                    <td>{r.capacity}</td>
                    <td>{r.committed}</td>
                    <td>{r.free}</td>
                    <td>{r.wanted}</td>
                    <td>{r.spare}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      {model.recommendations.length === 0 ? (
        <section className="card">
          <h2 className="card-title">No week needs a decision</h2>
          <p className="muted">Every request fits in the capacity left after confirmed orders.</p>
        </section>
      ) : (
        model.recommendations.map((rec) => <Recommendation key={rec.week} rec={rec} actionsNote={model.actionsNote} />)
      )}

      {model.focus && (
        <section className="card" aria-labelledby="focus-title">
          <h2 id="focus-title" className="card-title">
            Requests competing in {model.focus.weekName}
          </h2>
          <p className="muted">{model.focus.committed}</p>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th scope="col">Who</th>
                  <th scope="col">Side</th>
                  <th scope="col">Volume</th>
                  <th scope="col">Confirmed</th>
                </tr>
              </thead>
              <tbody>
                {model.focus.rows.map((r) => (
                  <tr key={r.who + r.volume + r.detail}>
                    <th scope="row">{r.who}</th>
                    <td>{r.side}</td>
                    <td>{r.volume}</td>
                    <td>{r.detail.replace("confirmed ", "")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <footer className="footer">
        <p id="not-built">{model.notBuilt}</p>
      </footer>
    </div>
  );
}
