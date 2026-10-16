import { connection } from "next/server";
import { loadNavCounts } from "@/ledger/nav-session";
import { buildInbox, loadCapture } from "@/data/inbox";
import { Inbox } from "./inbox";

// A server component: samples and scenario are read through the manifest-enforcing loader, run through the
// capture pipeline, and handed to the layout as a finished model. Prerendered; nothing is written.
export default async function InboxPage() {
  await connection();
  const { result, known } = loadCapture();
  return <Inbox counts={await loadNavCounts()} model={buildInbox(result, known)} />;
}
