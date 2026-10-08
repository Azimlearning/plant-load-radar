// The ledger page. A synchronous, hook-free component that lays out a finished LedgerModel. Read-only: there is no
// form, button or action here, so nothing on this page can change a row.

import type { Line } from "@/data/board";
import type { LedgerModel } from "@/data/decisions";
import { Shell } from "../shell";

function Row({ line }: { line: Line }) {
  return (
    <li className="line-item">
      <div className="line-main">
        <span className="line-who">{line.who}</span>
        <span className="tag">{line.side === "internal" ? "Internal" : "Outside"}</span>
      </div>
      <div className="line-sub">
        {line.volume}
        {line.to ? <> · moved to {line.to}</> : null}
      </div>
      <div className="line-value">
        <span className="rm">{line.value}</span> <span className="meaning">{line.valueMeaning}</span>
      </div>
    </li>
  );
}

export function Ledger({ model, resetAction }: { model: LedgerModel; resetAction?: () => void | Promise<void> }) {
  return (
    <Shell current="/ledger" banner={model.banner} title={model.title} lede={<>
        <p>{model.intro}</p>
      </>}>

      {model.summary ? (
        <section aria-label="Totals" className="kpis">
          <div className="kpi">
            <div className="kpi-label">Decisions logged</div>
            <div className="kpi-value">{model.summary.count}</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Ringgit at stake, decided</div>
            <div className="kpi-value">{model.summary.atStake}</div>
            <div className="kpi-note">{model.summary.note}</div>
          </div>
        </section>
      ) : (
        <section className="card">
          <p className="muted">{model.emptyNote}</p>
        </section>
      )}

      {model.rows.map((r) => (
        <section key={r.id} className="card" aria-label={`Decision for ${r.weekName}`}>
          <h2 className="card-title">{r.weekName}</h2>
          <p className="muted">
            {r.mode} · by {r.by} · {r.when}
          </p>
          <div className="two-col">
            <div>
              <h3 className="col-title">Served · {r.servedValue} at stake</h3>
              <ul className="lines">{r.served.map((l) => <Row key={l.who + l.volume} line={l} />)}</ul>
            </div>
            <div>
              <h3 className="col-title">Pushed back · {r.deferredValue} at stake</h3>
              <ul className="lines">{r.deferred.map((l) => <Row key={l.who + l.volume} line={l} />)}</ul>
            </div>
          </div>
          {r.note ? <p className="muted">Note: {r.note}</p> : null}
        </section>
      ))}
      {resetAction ? (
        <form className="form" action={resetAction}>
          <p className="muted">This demo keeps your decisions in this browser only, so nobody else sees them. You can clear them and run it again.</p>
          <div className="actions">
            <button type="submit" className="secondary">
              Start the demo again
            </button>
          </div>
        </form>
      ) : null}
    </Shell>
  );
}
