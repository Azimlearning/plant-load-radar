// The call-off form and the reserved slots. A synchronous, hook-free component: it lays out strings from the view-model.

import { Shell, type NavCounts } from "../shell";
import type { CallOffsModel } from "@/data/calloffs-view";

export function SlotTable({ slots }: { slots: CallOffsModel["slots"] }) {
  return (
    <div className="table-scroll" tabIndex={0} role="group" aria-label="Scrollable table">
      <table>
        <thead>
          <tr>
            <th scope="col">Project</th>
            <th scope="col">Week</th>
            <th scope="col">Reserved</th>
            <th scope="col">Released on</th>
            <th scope="col">Status</th>
            <th scope="col">From</th>
          </tr>
        </thead>
        <tbody>
          {slots.map((s) => (
            <tr key={s.project + s.weekName + s.volume + s.source}>
              <th scope="row">{s.project}</th>
              <td>{s.weekName}</td>
              <td>{s.volume}</td>
              <td>{s.releases}</td>
              <td className="wrap">{s.status}</td>
              <td>{s.source}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CallOffs({ model, action, counts }: { model: CallOffsModel; action: (formData: FormData) => void | Promise<void>; counts?: NavCounts }) {
  return (
    <Shell counts={counts} current="/calloffs" banner={model.banner} title={model.title} lede={<p>{model.intro}</p>}>
      {model.error ? (
        <p className="error" role="alert">
          {model.error}
        </p>
      ) : null}
      {model.confirmed ? (
        <p className="answer card" role="status">
          Slot reserved. It now comes off the free capacity of that week on the board.
        </p>
      ) : null}

      <section className="card" aria-labelledby="calloff-form">
        <h2 id="calloff-form" className="card-title">
          Confirm a call-off
        </h2>
        <p className="muted">{model.policy}</p>
        <form className="form" action={action}>
          <div className="row">
            <label>
              Project
              <select name="projectId" required defaultValue="">
                <option value="">Choose a project</option>
                {model.projectOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Week
              <select name="week" required defaultValue="">
                <option value="">Choose a week</option>
                {model.weekOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Volume, in cubic metres
              <input type="number" name="volumeM3" min={1} step={1} required inputMode="numeric" />
            </label>
            <label>
              Your name (required)
              <input type="text" name="requestedBy" required maxLength={80} autoComplete="name" />
            </label>
          </div>
          <p className="muted">{model.nearWeeksNote}</p>
          <div className="actions">
            <button type="submit">Reserve the slot</button>
          </div>
        </form>
      </section>

      <section className="card" aria-labelledby="slots-title">
        <h2 id="slots-title" className="card-title">
          Reserved slots
        </h2>
        <SlotTable slots={model.slots} />
      </section>

      <footer className="footer">
        <p>{model.note}</p>
      </footer>
    </Shell>
  );
}
