import { connection } from "next/server";
import { loadNavCounts } from "@/ledger/nav-session";
import { buildBoard } from "@/data/board";
import { loadHistory, summariseHistory } from "@/data/history";
import { loadCapture } from "@/data/inbox";
import { loadScenario } from "@/ledger/scenario-session";
import { loadRows } from "@/ledger/session";
import { callOffStore } from "@/ledger/visitor";
import { Board } from "../board";

const PREVIEW_ROWS = 4; // how many lines to check the board shows before pointing to the inbox

// A server component. It reads the committed scenario through the manifest-enforcing loader (no manifest row, no
// data) and the ledger file, builds the view-model, and hands a finished model to the layout. Rendered per request
// because the ledger changes when a person decides.
export default async function Home({ searchParams }: PageProps<"/board">) {
  await connection();
  const q = await searchParams;
  const scenario = await loadScenario();
  const { result } = loadCapture();
  const preview = result.messages
    .flatMap((m) => m.lines)
    .filter((l) => l.needsPerson)
    .slice(0, PREVIEW_ROWS)
    .map((l) => ({ who: l.line.customer.value, product: l.line.product.value, volumeM3: l.line.volumeM3.value, tier: l.line.tier, why: l.reasons[0] ?? "" }));
  const history = summariseHistory(loadHistory(), scenario);
  return <Board counts={await loadNavCounts()} model={buildBoard(scenario, { needsPerson: result.counts.needsPerson, lines: result.counts.lines, preview }, await loadRows(scenario), history, { allWeeks: q.weeks === "all", callOffs: await callOffStore.read() })} />;
}
