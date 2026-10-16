import { connection } from "next/server";
import { loadNavCounts } from "@/ledger/nav-session";
import { buildFinance } from "@/data/finance";
import { loadHistory } from "@/data/history";
import { loadScenario } from "@/ledger/scenario-session";
import { loadRows } from "@/ledger/session";
import { Finance } from "./finance";

// Rendered per request: the table includes this visitor's own decisions.
export default async function FinancePage({ searchParams }: PageProps<"/finance">) {
  await connection();
  const q = await searchParams;
  const scenario = await loadScenario();
  return <Finance counts={await loadNavCounts()} model={buildFinance(scenario, loadHistory(), await loadRows(scenario), typeof q.month === "string" ? q.month : undefined)} />;
}
