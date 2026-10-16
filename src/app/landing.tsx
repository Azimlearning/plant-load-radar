// The overview page: the deck's story in one screen. A synchronous server component laying out a finished LandingModel.

import Link from "next/link";
import type { LandingModel } from "@/data/landing";
import { Shell, type NavCounts } from "./shell";

export function Landing({ model, counts }: { model: LandingModel; counts?: NavCounts }) {
  return (
    <Shell current="/" banner={model.banner} title={model.title} counts={counts} hero={
      <section className="hero" aria-labelledby="hero-title">
        <p className="hero-kicker">{model.kicker}</p>
        <h1 id="hero-title" className="hero-title">
          Plant Load <span>Radar</span>
        </h1>
        <p className="hero-tagline">{model.tagline}</p>
        <div className="actions">
          <Link className="button light" href="/board">
            Open the board
          </Link>
          <Link className="button ghost" href="/value">
            See what today costs
          </Link>
        </div>
      </section>
    }>
      <section aria-label="Why now" className="kpis">
        {model.stats.map((s) => (
          <div key={s.id} className="kpi kpi-good">
            <div className="kpi-label">{s.label}</div>
            <div className="kpi-value">{s.value}</div>
            <div className="kpi-note">{s.source}</div>
          </div>
        ))}
      </section>

      {model.story ? (
        <section className="card" aria-labelledby="story-title">
          <p className="eyebrow eyebrow-done">The rule, on one example</p>
          <h2 id="story-title" className="card-title">
            {model.story.headline}: serve whichever side has more ringgit at stake
          </h2>
          <div className="two-col">
            <div>
              <h3 className="col-title">Served first</h3>
              <ul className="lines">
                {model.story.served.map((l) => (
                  <li key={l.who + l.volume} className="line-item">
                    <div className="line-main">
                      <span className="line-who">{l.who}</span>
                      <span className="tag">{l.side === "internal" ? "Internal" : "Outside"}</span>
                    </div>
                    <div className="line-value">
                      <span className="rm">{l.value}</span> <span className="meaning">{l.valueMeaning}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="col-title">Moved to the next free week</h3>
              <ul className="lines">
                {model.story.moved.map((l) => (
                  <li key={l.who + l.volume} className="line-item">
                    <div className="line-main">
                      <span className="line-who">{l.who}</span>
                      <span className="tag">{l.side === "internal" ? "Internal" : "Outside"}</span>
                    </div>
                    <div className="line-value">
                      <span className="rm">{l.value}</span> <span className="meaning">{l.valueMeaning}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="rule-note">{model.story.verdict}</p>
        </section>
      ) : null}

      <section aria-labelledby="people-title" className="stack">
        <h2 id="people-title" className="section-title">
          Approach: five people touch each allocation, and want different things
        </h2>
        <div className="people">
          {model.people.map((p) => (
            <article key={p.id} className="card person">
              <h3 className="card-title">{p.role}</h3>
              <p className="muted">{p.where}</p>
              <p className="wants-label">Wants</p>
              <p>{p.wants}</p>
              <p className="wants-label no">Does not want</p>
              <p>{p.doesNotWant}</p>
              <Link className="button secondary" href={p.href}>
                {p.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="card" aria-labelledby="how-title">
        <h2 id="how-title" className="card-title">
          Agents do the legwork, tools do the maths, people decide
        </h2>
        <ol className="steps">
          {model.steps.map((s) => (
            <li key={s.id}>
              <strong>{s.label}</strong>
              <span>{s.text}</span>
            </li>
          ))}
        </ol>
        <ul className="reasons">
          {model.guardrails.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
      </section>

      <footer className="footer">
        <p>{model.note}</p>
      </footer>
    </Shell>
  );
}
