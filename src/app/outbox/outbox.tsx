import { Shell, type NavCounts } from "../shell";
import type { OutboxModel } from "@/data/outbox-view";

export function Outbox({ model, counts }: { model: OutboxModel; counts?: NavCounts }) {
  return (
    <Shell counts={counts} current="/outbox" banner={model.banner} title={model.title} kicker="Sales and plant manager" lede={<p>{model.intro}</p>}>
      {model.messages.length === 0 ? (
        <section className="card">
          <p className="muted">{model.empty}</p>
        </section>
      ) : (
        model.messages.map((m) => (
          <section key={m.id} className="card" aria-label={`Message to ${m.to}`}>
            <div className="msg-head">
              <span className="tag">{m.channel}</span>
              <span>To {m.to}</span>
              <span>· {m.when}</span>
              <span>· approved by {m.approvedBy}</span>
            </div>
            <pre className="draft">{m.text}</pre>
          </section>
        ))
      )}
      <footer className="footer">
        <p>{model.note}</p>
      </footer>
    </Shell>
  );
}
