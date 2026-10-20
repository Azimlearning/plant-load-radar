// The pilot scorecard: slide 11's plan, its measures with empty baselines, and slide 12's risks. A synchronous server component.

import Link from "next/link";
import type { PilotModel } from "@/data/pilot";
import { Shell, type NavCounts } from "../shell";

export function Pilot({ model, counts }: { model: PilotModel; counts?: NavCounts }) {
  return (
    <Shell counts={counts} current="/pilot" banner={model.banner} title={model.title} kicker="Outcome" lede={<p>{model.intro}</p>}>
      <section aria-labelledby="phases-title" className="stack">
        <h2 id="phases-title" className="section-title">
          A 90-day pilot on the new line
        </h2>
        <div className="people">
          {model.phases.map((p) => (
            <article key={p.id} className="card person">
              <p className="wants-label">{p.label}</p>
              <h3 className="card-title">{p.title}</h3>
              <ul className="reasons">
                {p.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              <p className="rm">{p.milestone}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card" aria-labelledby="measures-title">
        <h2 id="measures-title" className="card-title">
          It worked if we see
        </h2>
        <div className="table-scroll" tabIndex={0} role="group" aria-label="Scrollable table">
          <table>
            <thead>
              <tr>
                <th scope="col">Measure</th>
                <th scope="col">Baseline</th>
                <th scope="col">Target</th>
                <th scope="col">What the demo shows (seeded or illustrative)</th>
              </tr>
            </thead>
            <tbody>
              {model.measures.map((m) => (
                <tr key={m.id}>
                  <th scope="row">
                    {m.label}
                    <div className="muted">{m.how}</div>
                  </th>
                  <td className="wrap">{m.baseline}</td>
                  <td className="wrap">{m.target}</td>
                  <td className="wrap">
                    <strong>{m.demo}</strong>
                    <div className="muted">{m.demoNote}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="policy-title" className="stack">
        <h2 id="policy-title" className="section-title">
          Why a rule: one week, four ways to choose
        </h2>
        <p className="muted">{model.policyIntro}</p>
        {model.sensitivity ? (
          <section className="card" aria-labelledby="sens-title">
            <h3 id="sens-title" className="card-title">
              {model.sensitivity.title}
            </h3>
            {model.sensitivity.lines.map((l) => (
              <p key={l}>{l}</p>
            ))}
          </section>
        ) : null}
        {model.policyCases.map((c) => (
          <section key={c.title} className="card" aria-label={c.title}>
            <h3 className="card-title">{c.title}</h3>
            <div className="table-scroll" tabIndex={0} role="group" aria-label="Scrollable table">
              <table>
                <thead>
                  <tr>
                    <th scope="col">How the plant chooses</th>
                    <th scope="col">Who waits a week</th>
                    <th scope="col">What that wait costs</th>
                  </tr>
                </thead>
                <tbody>
                  {c.rows.map((r) => (
                    <tr key={r.policy}>
                      <th scope="row">
                        {r.policy}
                        <div className="muted">{r.note}</div>
                      </th>
                      <td className="wrap">{r.waits}</td>
                      <td>{r.waitingValue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </section>

      <section className="card" aria-labelledby="risks-title">
        <h2 id="risks-title" className="card-title">
          The risks are known
        </h2>
        <div className="table-scroll" tabIndex={0} role="group" aria-label="Scrollable table">
          <table>
            <thead>
              <tr>
                <th scope="col">Risk</th>
                <th scope="col">How we handle it</th>
                <th scope="col">See it in the demo</th>
              </tr>
            </thead>
            <tbody>
              {model.risks.map((r) => (
                <tr key={r.risk}>
                  <th scope="row">{r.risk}</th>
                  <td className="wrap">{r.how}</td>
                  <td>
                    <Link href={r.href}>{r.where}</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card" aria-labelledby="needs-title">
        <h2 id="needs-title" className="card-title">
          What we need for the pilot: access, not budget
        </h2>
        <ol className="reasons">
          {model.needs.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ol>
        <p className="rm">Next step: {model.nextStep}</p>
      </section>

      <footer className="footer">
        <p>{model.note}</p>
      </footer>
    </Shell>
  );
}
