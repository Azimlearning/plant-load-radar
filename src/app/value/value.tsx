// The business-case page. A synchronous, hook-free component: it receives a finished ValueModel and only lays it out.
// It performs no arithmetic and formats no numbers; every figure is a string from src/data/value.ts, which records
// them (see value.test.tsx, the "every figure comes from the model" check).

import { Shell } from "../shell";
import type { LineView, ValueModel } from "@/data/value";

function Line({ line }: { line: LineView }) {
  return (
    <section className="card" aria-labelledby={`line-${line.id}`}>
      <h2 id={`line-${line.id}`} className="card-title">
        {line.title}
      </h2>
      <p className="muted">{line.formula}</p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">Step</th>
              <th scope="col">Low</th>
              <th scope="col">Base</th>
              <th scope="col">High</th>
              <th scope="col">Where it comes from</th>
            </tr>
          </thead>
          <tbody>
            {line.steps.map((s) => (
              <tr key={s.label} className={s.result ? "result-row" : undefined}>
                <th scope="row">{s.label}</th>
                <td>{s.low}</td>
                <td>{s.base}</td>
                <td>{s.high}</td>
                <td>{s.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function Value({ model }: { model: ValueModel }) {
  return (
    <Shell current="/value" banner={model.banner} title={model.title} lede={<>
        <p>{model.intro}</p>
        <p className="scroll-hint">{model.scrollHint}</p>
      </>}>

      <section className="card" aria-labelledby="total-title">
        <h2 id="total-title" className="card-title">
          Worked example, per year
        </h2>
        <div className="kpis">
          <div className="kpi">
            <div className="kpi-label">Low</div>
            <div className="kpi-value">{model.total.low}</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Base</div>
            <div className="kpi-value">{model.total.base}</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">High</div>
            <div className="kpi-value">{model.total.high}</div>
          </div>
        </div>
        <p className="muted">{model.total.note}</p>
      </section>

      {model.lines.map((l) => (
        <Line key={l.id} line={l} />
      ))}

      <section className="card" aria-labelledby="units-title">
        <h2 id="units-title" className="card-title">
          Per unit, without the invented counts
        </h2>
        <p className="muted">Multiply these by Chin Hin&apos;s own counts. This is the part to replace first.</p>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Unit cost</th>
                <th scope="col">Low</th>
                <th scope="col">Base</th>
                <th scope="col">High</th>
                <th scope="col">Where it comes from</th>
              </tr>
            </thead>
            <tbody>
              {model.units.map((u) => (
                <tr key={u.label}>
                  <th scope="row">{u.label}</th>
                  <td>{u.low}</td>
                  <td>{u.base}</td>
                  <td>{u.high}</td>
                  <td>{u.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card" aria-labelledby="reading-title">
        <h2 id="reading-title" className="card-title">
          How to read this
        </h2>
        <ul className="reasons">
          {model.reading.map((r) => (
            <li key={r}>{r}</li>
          ))}
          <li>{model.carryingSource}</li>
        </ul>
      </section>

      <section className="card" aria-labelledby="assume-title">
        <h2 id="assume-title" className="card-title">
          What each assumption stands in for
        </h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Assumed</th>
                <th scope="col">Range</th>
                <th scope="col">Why this range</th>
                <th scope="col">Real data that replaces it</th>
              </tr>
            </thead>
            <tbody>
              {model.assumptions.map((a) => (
                <tr key={a.what}>
                  <th scope="row">{a.what}</th>
                  <td>{a.range}</td>
                  <td className="wrap">{a.why}</td>
                  <td className="wrap">{a.replaceWith}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card" aria-labelledby="pilot-title">
        <h2 id="pilot-title" className="card-title">
          What a pilot would measure instead
        </h2>
        <ul className="reasons">
          {model.pilot.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <p className="muted">{model.doNotSay}</p>
      </section>

      <footer className="footer">
        <p>{model.footnote}</p>
      </footer>
    </Shell>
  );
}
