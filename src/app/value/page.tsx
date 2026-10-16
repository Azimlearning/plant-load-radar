import { connection } from "next/server";
import { loadNavCounts } from "@/ledger/nav-session";
import { loadValue } from "@/data/value";
import { Value } from "./value";

// A server component: inputs are read through the manifest-enforcing loader, the calculator runs, and the page
// receives a finished model. Prerendered; nothing is written and nothing is sent.
export default async function ValuePage() {
  await connection();
  return <Value counts={await loadNavCounts()} model={loadValue()} />;
}
