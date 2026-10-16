// The sources and assumptions page (slide 15), built from the manifest. A synchronous server component.

import type { SourcesModel } from "@/data/sources";
import { Shell, type NavCounts } from "../shell";

export function Sources({ model, counts }: { model: SourcesModel; counts?: NavCounts }) {
  return (
    <Shell counts={counts} current="/sources" banner={model.banner} title={model.title} kicker="Appendix" lede={<p>{model.intro}</p>}>
      <section className="kpis" aria-label="Kinds of data">
        {model.kinds.map((k) => (
          <div key={k.kind} className="kpi">
            <div className="kpi-label">{k.kind}</div>
            <div className="kpi-value">{k.count}</div>
            <div className="kpi-note">{k.meaning}</div>
          </div>
        ))}
      </section>

      <section className="card" aria-labelledby="refs-title">
        <h2 id="refs-title" className="card-title">
          References cited in the pitch
        </h2>
        <ol className="refs">
          {model.references.map((r) => (
            <li key={r.id} value={Number(r.id)}>
              {r.citation}
            </li>
          ))}
        </ol>
        <h3 className="col-title">Assumptions</h3>
        <dl className="assumptions">
          {model.assumptions.map((a) => (
            <div key={a.title}>
              <dt>{a.title}</dt>
              <dd>{a.text}</dd>
            </div>
          ))}
        </dl>
        <p className="rule-note">{model.note}</p>
      </section>

      <section className="card" aria-labelledby="files-title">
        <h2 id="files-title" className="card-title">
          Every data file the app can load
        </h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">File</th>
                <th scope="col">Kind</th>
                <th scope="col">Source</th>
                <th scope="col">Licence</th>
                <th scope="col">Retrieved or seed</th>
                <th scope="col">What it is</th>
              </tr>
            </thead>
            <tbody>
              {model.files.map((f) => (
                <tr key={f.file}>
                  <th scope="row">{f.file}</th>
                  <td>{f.kind}</td>
                  <td className="wrap">{f.source}</td>
                  <td className="wrap">{f.licence}</td>
                  <td className="wrap">{f.when}</td>
                  <td className="wrap">{f.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="facts-title" className="stack">
        <h2 id="facts-title" className="section-title">
          The public facts behind the figures
        </h2>
        {model.factGroups.map((g) => (
          <details key={g.file} className="card twin">
            <summary>
              {g.title} ({g.count})
            </summary>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Fact</th>
                    <th scope="col">Value</th>
                    <th scope="col">Period</th>
                    <th scope="col">Source</th>
                    <th scope="col">Reliability</th>
                  </tr>
                </thead>
                <tbody>
                  {g.facts.map((f) => (
                    <tr key={f.label + f.period + f.value}>
                      <th scope="row">{f.label}</th>
                      <td>
                        {f.value} <span className="muted">{f.unit}</span>
                      </td>
                      <td>{f.period}</td>
                      <td className="wrap">
                        <a href={f.url} rel="noreferrer noopener" target="_blank">
                          {f.source}
                        </a>
                      </td>
                      <td>{f.reliability}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        ))}
      </section>
    </Shell>
  );
}
