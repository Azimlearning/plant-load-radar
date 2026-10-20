import { connection } from "next/server";
import { loadNavCounts } from "@/ledger/nav-session";
import { buildDecisions, refusalText } from "@/data/decisions";
import { loadScenario } from "@/ledger/scenario-session";
import { ledgerMode, loadRows } from "@/ledger/session";
import { getProvider } from "@/llm";
import { refineDrafts } from "@/llm/drafts";
import { huddleFlagStore } from "@/ledger/visitor";
import { decide, sendToHuddle, startAgain } from "./actions";
import { Decisions } from "./decisions";

// Rendered per request: it reads the ledger, which changes when a person decides.
export default async function DecisionsPage({ searchParams }: PageProps<"/decisions">) {
  await connection();
  const { error } = await searchParams;
  const scenario = await loadScenario();
  const model = buildDecisions(scenario, await loadRows(scenario), refusalText(typeof error === "string" ? error : undefined), undefined, await huddleFlagStore.read());

  // With the model writer on, polish each draft; every text is checked to add no number of its own, else the template stays.
  const provider = getProvider();
  if (provider && model.pending.length > 0) {
    let byModel = 0;
    let total = 0;
    for (const p of model.pending) {
      const r = await refineDrafts(provider, p.drafts);
      p.drafts = r.drafts;
      byModel += r.byModel;
      total += r.total;
    }
    model.draftNote = `${byModel} of ${total} drafts were reworded by a language model (${provider.name}); each was checked to add no number the calculator did not give, and a text that failed the check stayed as the template. Nothing is sent: this demo has no WhatsApp or email connection. A person edits, approves and sends.`;
  }
  return <Decisions counts={await loadNavCounts()} model={model} action={decide} huddleAction={sendToHuddle} resetAction={ledgerMode() === "cookie" ? startAgain : undefined} />;
}
