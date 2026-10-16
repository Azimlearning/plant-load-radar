"use server";

// The only write path for decisions (ADR D-18). A server action is reachable by a direct POST, so it trusts nothing:
// it passes the form's text fields to `recordDecision`, which recomputes every figure itself and refuses an
// unnamed approver, an unknown or already-decided week, or a bad choice. It never reads a number from the form.
//
// "Approve and send" (slide 10) also queues the drafts in the simulated outbox. Recipients come from the server's own
// drafts; the form can change only the words. Nothing leaves the app (hard constraint 2: a person approves, and this demo
// has no WhatsApp or Teams connection).

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buildDecisions } from "@/data/decisions";
import { buildOutboxRows } from "@/ledger/outbox";
import { loadScenario } from "@/ledger/scenario-session";
import { loadRows, resetDemo, saveDecision } from "@/ledger/session";
import { outboxStore } from "@/ledger/visitor";

const PAGES = ["/", "/board", "/decisions", "/ledger", "/outbox", "/huddle", "/finance"] as const;

export async function decide(formData: FormData): Promise<void> {
  const scenario = await loadScenario();
  const before = await loadRows(scenario);
  const out = await saveDecision(scenario, {
    week: formData.get("week"),
    mode: formData.get("mode"),
    chosenRequestId: formData.get("chosenRequestId"),
    approvedBy: formData.get("approvedBy"),
    note: formData.get("note"),
  });
  if (!out.ok) redirect(`/decisions?error=${out.error}`);

  // The drafts describe the rule's recommendation, so only an approval can send them. A change records the decision
  // and sends nothing: the person writes their own replies.
  let queued = 0;
  if (formData.get("send") === "1" && out.row.mode === "recommendation-approved") {
    const pending = buildDecisions(scenario, before, null).pending.find((p) => p.week === out.row.week);
    if (pending) {
      const rows = buildOutboxRows({
        week: out.row.week,
        approvedBy: out.row.approvedBy,
        now: new Date(),
        drafts: pending.drafts,
        edited: { brief: formData.get("draft:brief"), replies: pending.drafts.replies.map((_, i) => formData.get(`draft:reply:${i}`)) },
      });
      for (const row of rows) if (await outboxStore.append(row)) queued += 1;
    }
  }
  for (const path of PAGES) revalidatePath(path);
  redirect(queued > 0 ? "/outbox" : "/ledger");
}

/** "Start the demo again": clears this visitor's own demo state. Does nothing when the file ledger is in use. */
export async function startAgain(): Promise<void> {
  await resetDemo();
  for (const path of PAGES) revalidatePath(path);
  redirect("/decisions");
}
