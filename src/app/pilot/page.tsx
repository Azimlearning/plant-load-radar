import { connection } from "next/server";
import { loadHistory } from "@/data/history";
import { buildPilot } from "@/data/pilot";
import { loadNavCounts } from "@/ledger/nav-session";
import { loadScenario } from "@/ledger/scenario-session";
import { loadRows } from "@/ledger/session";
import { Pilot } from "./pilot";

// Rendered per request: the demo column includes this visitor's own decisions.
export default async function PilotPage() {
  await connection();
  const scenario = await loadScenario();
  return <Pilot counts={await loadNavCounts()} model={buildPilot(scenario, loadHistory(), await loadRows(scenario))} />;
}
