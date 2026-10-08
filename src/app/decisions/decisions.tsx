// The decisions page. A synchronous, hook-free server component: it lays out a finished DecisionsModel and a plain
// <form> that posts to a server action passed in by the page. It performs no arithmetic and formats no numbers.
// The form carries text fields only (week, mode, chosen request, name, note): no figure is ever sent to the server.

import type { Line } from "@/data/board";
import type { DecisionsModel, PendingView } from "@/data/decisions";
import { MAX_NAME, MAX_NOTE } from "@/ledger/decide";
import { Shell } from "../shell";

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

function Pending({ p, action, approverNote }: { p: PendingView; action: (formData: FormData) => void | Promise<void>; approverNote: string }) {
  return (
    <section className="card" aria-labelledby={`pending-${p.week}`}>
      <p className="eyebrow">Decision needed</p>
      <h2 id={`pending-${p.week}`} className="card-title">
        {p.headline}
      </h2>
      <p className="muted">
        {p.freeText} · {p.wantedText}
      </p>
      <div className="two-col">
        <div>
          <h3 className="col-title">The rule serves this week</h3>
          <ul className="lines">{p.served.map((l) => <LineItem key={l.who + l.volume} line={l} />)}</ul>
        </div>
        <div>
          <h3 className="col-title">The rule moves to the next free week</h3>
          <ul className="lines">{p.moved.map((l) => <LineItem key={l.who + l.volume} line={l} />)}</ul>
        </div>
      </div>

      <form className="form" action={action}>
        <input type="hidden" name="week" value={p.week} />
        <fieldset className="form" style={{ border: 0, padding: 0 }}>
          <legend className="col-title">Your decision</legend>
          <label>
            <span>
              <input type="radio" name="mode" value="approve" defaultChecked /> Approve the rule&apos;s recommendation
            </span>
          </label>
          <label>
            <span>
              <input type="radio" name="mode" value="change" /> Change: serve a different request first
            </span>
          </label>
          {p.changeOptions.length > 0 ? (
            <label>
              Serve this request first (only used with Change)
              <select name="chosenRequestId" defaultValue="">
                <option value="">Choose a request</option>
                {p.changeOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p className="muted">No pushed-back request fits this week&apos;s free capacity, so there is nothing to change to.</p>
          )}
        </fieldset>
        <div className="row">
          <label>
            Your name (required)
            <input type="text" name="approvedBy" required maxLength={MAX_NAME} autoComplete="name" />
          </label>
          <label>
            Note (optional)
            <input type="text" name="note" maxLength={MAX_NOTE} />
          </label>
        </div>
        <p className="muted">{approverNote}</p>
        <div className="actions">
          <button type="submit">Record decision</button>
        </div>
      </form>

      <div className="alt">
        <h3 className="col-title">Drafts for this decision</h3>
        <h4 className="sub-title">Huddle brief for the plant manager</h4>
        <pre className="draft">{p.drafts.brief}</pre>
        {p.drafts.replies.map((r) => (
          <div key={r.to}>
            <h4 className="sub-title">Reply to {r.to}</h4>
            <pre className="draft">{r.text}</pre>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Decisions({ model, action, resetAction }: { model: DecisionsModel; action: (formData: FormData) => void | Promise<void>; resetAction?: () => void | Promise<void> }) {
  return (
    <Shell current="/decisions" banner={model.banner} title={model.title} lede={<>
        <p>{model.intro}</p>
      </>}>
      {model.error ? (
        <p className="error" role="alert">
          {model.error}
        </p>
      ) : null}
      {model.pending.length === 0 ? (
        <section className="card">
          <p className="muted">{model.emptyNote}</p>
        </section>
      ) : (
        model.pending.map((p) => <Pending key={p.week} p={p} action={action} approverNote={model.approverNote} />)
      )}
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
      <footer className="footer">
        <p>{model.draftNote}</p>
      </footer>
    </Shell>
  );
}
