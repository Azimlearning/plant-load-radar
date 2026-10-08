// "Ask the board". A synchronous, hook-free component. The form is a plain GET: the page reads the question from
// the address and answers it server-side with the calculator. No client code, no free-text understanding.

import type { AskModel } from "@/data/ask";
import { Nav } from "../nav";

export function Ask({ model }: { model: AskModel }) {
  return (
    <div className="board">
      <div className="banner" role="note">
        {model.banner}
      </div>
      <Nav current="/ask" />
      <header className="header">
        <h1 className="title">{model.title}</h1>
        <p className="muted">{model.intro}</p>
      </header>

      <section className="card" aria-labelledby="ask-form">
        <h2 id="ask-form" className="card-title">
          Can we take this volume in this week?
        </h2>
        <form className="form" method="get" action="/ask">
          <div className="row">
            <label>
              Week
              <select name="week" defaultValue={model.form.week} required>
                <option value="">Choose a week</option>
                {model.weekOptions.map((w) => (
                  <option key={w.value} value={w.value}>
                    {w.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Volume, in cubic metres
              <input type="number" name="volume" min={1} step={1} defaultValue={model.form.volume} required inputMode="numeric" />
            </label>
          </div>
          <div className="actions">
            <button type="submit">Ask</button>
          </div>
        </form>
      </section>

      {model.error ? (
        <p className="error" role="alert">
          {model.error}
        </p>
      ) : null}

      {model.answer ? (
        <section className={`card answer ${model.answer.tone === "no" ? "no" : ""}`} aria-labelledby="answer-title" role="status">
          <h2 id="answer-title" className="card-title">
            {model.answer.headline}
          </h2>
          <ul className="reasons">
            {model.answer.detail.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <footer className="footer">
        <p>{model.note}</p>
      </footer>
    </div>
  );
}
