import { connection } from "next/server";
import { buildLanding, loadFacts } from "@/data/landing";
import { loadNavCounts } from "@/ledger/nav-session";
import { loadScenario } from "@/ledger/scenario-session";
import { Landing } from "./landing";

// Rendered per request: the nav counts depend on this visitor's decisions.
export default async function Home() {
  await connection();
  return <Landing counts={await loadNavCounts()} model={buildLanding(await loadScenario(), loadFacts())} />;
}
