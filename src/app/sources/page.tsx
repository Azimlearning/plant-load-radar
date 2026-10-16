import { connection } from "next/server";
import { loadSources } from "@/data/sources";
import { loadNavCounts } from "@/ledger/nav-session";
import { Sources } from "./sources";

export default async function SourcesPage() {
  await connection();
  return <Sources counts={await loadNavCounts()} model={loadSources()} />;
}
