// The weekly huddle. A synchronous server component laying out a finished HuddleModel; the only client piece is the timer.

import Link from "next/link";
import type { Line } from "@/data/board";
import type { HuddleModel } from "@/data/huddle";
import { SlotTable } from "../calloffs/calloffs";
import { Shell, type NavCounts } from "../shell";
import { HuddleTimer } from "./huddle-timer";

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

export function Huddle({ model, minutes, counts }: { model: HuddleModel; minutes: number; counts?: NavCounts }) {
  return (
    <Shell counts={counts} current="/huddle" banner={model.banner} title={model.title} kicker="Plant manager" lede={<p>{model.intro}</p>}>
      <section className="card" aria-labelledby="frame-title">
        <h2 id="frame-title" className="card-title">
          {model.frame.minutes} minutes, in four blocks
        </h2>
        <HuddleTimer minutes={minutes} initial={model.frame.clock} />
        <ul className="blocks">
          {model.frame.blocks.map((b) => (
            <li key={b.id}>
              <span className="rm">{b.minutes} min</span> {b.label}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="decisions-title" className="stack">
        <h2 id="decisions-title" className="card-title">
          Decisions waiting
        </h2>
        {model.decisions.length === 0 ? (
          <section className="card">
            <p className="muted">{model.noDecisions}</p>
          </section>
        ) : (
          model.decisions.map((d) => (
            <section key={d.anchor} id={d.anchor} className="card card-alert" aria-label={d.headline}>
              <h3 className="card-title">{d.headline}</h3>
              <p className="muted">
                {d.freeText} · {d.wantedText}
              </p>
              <div className="two-col">
                <div>
                  <h4 className="col-title">Serve this week</h4>
                  <ul className="lines">{d.served.map((l) => <LineItem key={l.who + l.volume} line={l} />)}</ul>
                </div>
                <div>
                  <h4 className="col-title">Move to the next free week</h4>
                  <ul className="lines">{d.moved.map((l) => <LineItem key={l.who + l.volume} line={l} />)}</ul>
                </div>
              </div>
              <div className="actions">
                <Link className="button" href="/decisions">
                  Decide now
                </Link>
              </div>
            </section>
          ))
        )}
      </section>

      {model.covered.length > 0 ? (
        <section className="card" aria-labelledby="covered-title">
          <h2 id="covered-title" className="card-title">
            Build-ahead plan to confirm
          </h2>
          {model.covered.map((c) => (
            <div key={c.headline}>
              <p>{c.headline}</p>
              <ul className="moves">{c.moves.map((m) => <li key={m}>{m}</li>)}</ul>
            </div>
          ))}
          <p className="rule-note">No request has to wait if the plant builds ahead as above. It is a production plan for the huddle to confirm; this page changes nothing.</p>
        </section>
      ) : null}

      <section className="card" aria-labelledby="slots-title">
        <h2 id="slots-title" className="card-title">
          Reserved slots
        </h2>
        <SlotTable slots={model.slots} />
        {model.slots.some((s) => s.lapsesSoon) ? (
          <p className="rule-note">Slots that lapse within two weeks of the as-of date are released if their call-off is not confirmed: ask the project, then release or keep them.</p>
        ) : null}
        <div className="actions">
          <Link className="button secondary" href="/calloffs">
            Open call-offs
          </Link>
        </div>
      </section>

      {model.orders ? (
        <section className="card" aria-labelledby="orders-title">
          <h2 id="orders-title" className="card-title">
            Orders to check
          </h2>
          <p>
            {model.orders.count} of {model.orders.of} order lines read from messages need a person before they reach the board.
          </p>
          <div className="actions">
            <Link className="button secondary" href="/inbox">
              Open the orders inbox
            </Link>
          </div>
        </section>
      ) : null}

      {model.credits.length > 0 ? (
        <section className="card" aria-labelledby="credit-title">
          <h2 id="credit-title" className="card-title">
            Credit to the plant
          </h2>
          <ul className="reasons">{model.credits.map((c) => <li key={c.line}>{c.line}</li>)}</ul>
        </section>
      ) : null}

      <footer className="footer">
        <p>{model.note}</p>
      </footer>
    </Shell>
  );
}
