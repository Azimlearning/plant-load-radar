import { connection } from "next/server";
import { loadNavCounts } from "@/ledger/nav-session";
import { buildLedger } from "@/data/decisions";
import { loadScenario } from "@/ledger/scenario-session";
import { ledgerMode, loadRows } from "@/ledger/session";
import { startAgain } from "../decisions/actions";
import { Ledger } from "./ledger";

// Rendered per request: the ledger file changes when a person decides.
export default async function LedgerPage() {
  await connection();
  const scenario = await loadScenario();
  return <Ledger counts={await loadNavCounts()} model={buildLedger(scenario, await loadRows(scenario))} resetAction={ledgerMode() === "cookie" ? startAgain : undefined} />;
}
