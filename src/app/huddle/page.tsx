import { connection } from "next/server";
import { loadNavCounts } from "@/ledger/nav-session";
import { loadCapture } from "@/data/inbox";
import { buildHuddle } from "@/data/huddle";
import { loadScenario } from "@/ledger/scenario-session";
import { loadRows } from "@/ledger/session";
import { callOffStore, huddleFlagStore } from "@/ledger/visitor";
import { Huddle } from "./huddle";

// Rendered per request: what is open depends on this visitor's decisions and call-offs.
export default async function HuddlePage() {
  await connection();
  const scenario = await loadScenario();
  const { result } = loadCapture();
  const model = buildHuddle(scenario, await loadRows(scenario), { needsPerson: result.counts.needsPerson, lines: result.counts.lines }, await callOffStore.read(), await huddleFlagStore.read());
  return <Huddle counts={await loadNavCounts()} model={model} minutes={scenario.huddle?.minutes ?? 30} />;
}
