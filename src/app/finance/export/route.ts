// CSV of the decision ledger for finance's audit. A read-only GET: the same rows as the page, nothing else.

import { connection } from "next/server";
import { financeCsv } from "@/data/finance";
import { loadHistory } from "@/data/history";
import { loadScenario } from "@/ledger/scenario-session";
import { loadRows } from "@/ledger/session";

export async function GET(request: Request): Promise<Response> {
  await connection();
  const month = new URL(request.url).searchParams.get("month") ?? undefined;
  const scenario = await loadScenario();
  const csv = financeCsv(scenario, loadHistory(), await loadRows(scenario), month);
  return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="plant-load-radar-decisions.csv"', "cache-control": "no-store" } });
}
