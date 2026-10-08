// The orders inbox. A synchronous, hook-free component: it receives a finished InboxModel and only lays it out.
// It performs no arithmetic and formats no numbers; the quoted message words and every figure are strings from
// src/data/inbox.ts, which records them (see inbox.test.tsx).

import { Shell } from "../shell";
import type { Chip, InboxModel, LineView, MessageView } from "@/data/inbox";

function ChipItem({ chip }: { chip: Chip }) {
  const ok = chip.state === "confirmed";
  return (
    <li className={`chip ${ok ? "chip-ok" : "chip-warn"}`}>
      <div className="chip-field">{chip.field}</div>
      <div className="chip-value">{chip.value}</div>
      <div className="chip-state">
        <span className="icon" aria-hidden="true">
          {chip.icon}
        </span>
        {chip.stateLabel}
        {chip.reason ? <> · {chip.reason}</> : null}
      </div>
    </li>
  );
}

function Order({ line }: { line: LineView }) {
  return (
    <div className="order">
      <ul className="chips" aria-label="What was read from the message">
        {line.chips.map((c) => (
          <ChipItem key={c.field} chip={c} />
        ))}
      </ul>
      <p className="tierline">
        <span className="tag">{line.tier}</span>
        <span>{line.tierReason}</span>
        <span className="muted">· Matched to: {line.party}</span>
        {line.relation ? <span className="muted">· {line.relation}</span> : null}
      </p>
      {line.needsPerson ? (
        <div>
          <p className="check">Needs a person to check</p>
          <ul className="reasons">
            {line.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="muted">Nothing to check: every field is confirmed and a reference is given.</p>
      )}
    </div>
  );
}

function Message({ m }: { m: MessageView }) {
  return (
    <article className="card msg" aria-label={`Message from ${m.sender}`}>
      <div className="msg-head">
        <span className="tag">{m.channel}</span>
        <span>{m.sender}</span>
        <span>· {m.received}</span>
      </div>
      <blockquote className="msg-text">
        {m.segments.map((s, i) => (s.field ? <mark key={i} title={`Read as: ${s.field}`}>{s.text}</mark> : <span key={i}>{s.text}</span>))}
      </blockquote>
      {m.flags.map((f) => (
        <p key={f} className="flag" role="note">
          {f}
        </p>
      ))}
      {m.ignored ? <p className="muted">No order in this message, so nothing is added to the board.</p> : null}
      {m.lines.map((l, i) => (
        <Order key={i} line={l} />
      ))}
    </article>
  );
}

export function Inbox({ model }: { model: InboxModel }) {
  return (
    <Shell current="/inbox" banner={model.banner} title={model.title} lede={<>
        <p>{model.summary}</p>
        <p>{model.readerNote}</p>
      </>}>
      {model.messages.map((m) => (
        <Message key={m.key} m={m} />
      ))}
    </Shell>
  );
}
