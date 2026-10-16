// "Ask the board". A synchronous, hook-free component. The form is a plain GET: the page reads the question from
// the address and answers it server-side with the calculator. No client code, no free-text understanding.

import type { AskModel } from "@/data/ask";
import { Shell, type NavCounts } from "../shell";

export function Ask({ model, counts }: { model: AskModel; counts?: NavCounts }) {
  return (
    <Shell counts={counts} current="/ask" banner={model.banner} title={model.title} kicker="Sales executive" lede={<>
        <p>{model.intro}</p>
      </>}>

      <section className="card" aria-labelledby="ask-words">
        <h2 id="ask-words" className="card-title">
          Ask in your own words
        </h2>
        <form className="form" method="get" action="/ask">
          <label>
            Your question
            <input type="text" name="q" defaultValue={model.question} maxLength={model.example.maxChars} placeholder={model.example.text} />
          </label>
          <div className="actions">
            <button type="submit">Ask</button>
          </div>
        </form>
      </section>

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
          {model.reply ? (
            <>
              <h3 className="col-title">Draft reply for the customer</h3>
              <pre className="draft">{model.reply}</pre>
              <p className="muted">Words only. Nothing is sent; a person copies it or sends it from the decisions page after approving.</p>
            </>
          ) : null}
        </section>
      ) : null}

      <footer className="footer">
        <p>{model.note}</p>
      </footer>
    </Shell>
  );
}
