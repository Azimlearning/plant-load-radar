// Finance's monthly view of the decision ledger. A synchronous server component: it lays out strings from the view-model.
// The month filter is a plain GET form, so there is no client code.

import type { FinanceModel } from "@/data/finance";
import { Shell, type NavCounts } from "../shell";

export function Finance({ model, counts }: { model: FinanceModel; counts?: NavCounts }) {
  return (
    <Shell counts={counts} current="/finance" banner={model.banner} title={model.title} kicker="Group finance" lede={<p>{model.intro}</p>}>
      <section aria-label="Headline figures" className="kpis">
        {model.tiles.map((t) => (
          <div key={t.id} className={`kpi ${t.id === "credit" ? "kpi-good" : ""}`}>
            <div className="kpi-label">{t.label}</div>
            <div className="kpi-value">{t.value}</div>
            <div className="kpi-note">{t.note}</div>
          </div>
        ))}
      </section>

      <p className={model.flag.tone === "watch" ? "flag" : "muted"} role="status">
        {model.flag.text}
      </p>

      <section className="card" aria-labelledby="rows-title">
        <h2 id="rows-title" className="card-title">
          Decisions
        </h2>
        <form className="form" method="get" action="/finance">
          <div className="row">
            <label>
              Month
              <select name="month" defaultValue={model.months.find((m) => m.selected)?.value ?? "all"}>
                {model.months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="actions">
            <button type="submit">Show</button>
            <a className="button secondary" href={model.exportHref}>
              Download as CSV
            </a>
          </div>
        </form>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Decided</th>
                <th scope="col">Week</th>
                <th scope="col">Served first</th>
                <th scope="col">Side</th>
                <th scope="col">At stake</th>
                <th scope="col">Pushed back</th>
                <th scope="col">At stake</th>
                <th scope="col">Approved by</th>
                <th scope="col">Source</th>
              </tr>
            </thead>
            <tbody>
              {model.rows.map((r) => (
                <tr key={r.decidedOn + r.week + r.served}>
                  <th scope="row">{r.decidedOn}</th>
                  <td>{r.week}</td>
                  <td className="wrap">{r.served}</td>
                  <td>{r.side}</td>
                  <td>{r.servedValue}</td>
                  <td className="wrap">{r.pushed}</td>
                  <td>{r.pushedValue}</td>
                  <td>{r.approvedBy}</td>
                  <td>{r.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="footer">
        <p>{model.note}</p>
      </footer>
    </Shell>
  );
}
