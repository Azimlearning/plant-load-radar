// "Try it": paste a message and watch it become order lines, with the four-step trace. A synchronous server component;
// the form is a plain GET, so there is no client code and nothing is stored.

import Link from "next/link";
import type { TryModel } from "@/data/try";
import { Shell, type NavCounts } from "../../shell";
import { Message } from "../inbox";

export function TryIt({ model, counts }: { model: TryModel; counts?: NavCounts }) {
  return (
    <Shell counts={counts} current="/inbox/try" banner={model.banner} title={model.title} kicker="Scheduler" lede={<p>{model.intro}</p>}>
      <section className="card" aria-labelledby="try-form">
        <h2 id="try-form" className="card-title">
          A message arrives
        </h2>
        <form className="form" method="get" action="/inbox/try">
          <label>
            Message
            <textarea name="text" className="draft-edit" rows={4} defaultValue={model.form.text} maxLength={model.example.maxChars} placeholder={model.example.text} />
          </label>
          <div className="row">
            <label>
              Channel
              <select name="channel" defaultValue={model.form.channel}>
                <option value="whatsapp">WhatsApp</option>
                <option value="excel">Spreadsheet row</option>
              </select>
            </label>
            <label>
              Or load a sample message
              <select name="sample" defaultValue={model.form.sample}>
                <option value="">None</option>
                {model.samples.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="row">
            <label>
              Reader
              <select name="reader" defaultValue={model.readerChoice}>
                <option value="rules">Rules reader (always available)</option>
                <option value="model">Model reader (needs a key on the server)</option>
              </select>
            </label>
          </div>
          <p className="muted">{model.modelNote}</p>
          <div className="actions">
            <button type="submit">Read it</button>
            <Link className="button secondary" href="/inbox/try?csv=sample">
              Read the sample sales-order export
            </Link>
          </div>
        </form>
      </section>

      <section className="card" aria-labelledby="photo-title">
        <h2 id="photo-title" className="card-title">
          Or read a photo of a paper delivery order
        </h2>
        <p className="muted">Photos are read by the model reader only; a rules reader cannot read pictures. Whatever it reads is at most Inferred and goes to a person.</p>
        <div className="photos">
          {model.photos.map((p) => (
            <figure key={p.id} className="photo">
              {/* eslint-disable-next-line @next/next/no-img-element -- a small invented sample served by our own route */}
              <img src={p.src} alt={`${p.label}: an invented paper delivery order`} />
              <figcaption>
                {p.label} ·{" "}
                <Link href={`/inbox/try?reader=model&photo=${p.id}`}>Read it with the model reader</Link>
              </figcaption>
            </figure>
          ))}
        </div>
        {model.photoNote ? <p className="flag">{model.photoNote}</p> : null}
      </section>

      {model.error ? (
        <p className="error" role="alert">
          {model.error}
        </p>
      ) : null}
      {model.notes.map((n) => (
        <p key={n} className="flag">
          {n}
        </p>
      ))}

      {model.results.map((r) => (
        <div key={r.message.key} className="stack">
          <Message m={r.message} />
          <section className="card" aria-label={`What each agent did with ${r.message.key}`}>
            <h2 className="card-title">What each step did ({model.readerName})</h2>
            <ol className="trace">
              {r.trace.map((t) => (
                <li key={t.id}>
                  <div className="trace-head">
                    <strong>{t.agent}</strong>
                    <span className="tag">{t.tool}</span>
                  </div>
                  {t.lines.map((l) => (
                    <p key={l} className="trace-line">
                      {l}
                    </p>
                  ))}
                </li>
              ))}
            </ol>
          </section>
        </div>
      ))}

      <footer className="footer">
        <p>{model.note}</p>
      </footer>
    </Shell>
  );
}
