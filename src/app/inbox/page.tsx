import { buildInbox, loadCapture } from "@/data/inbox";
import { Inbox } from "./inbox";

// A server component: samples and scenario are read through the manifest-enforcing loader, run through the
// capture pipeline, and handed to the layout as a finished model. Prerendered; nothing is written.
export default function InboxPage() {
  const { result, known } = loadCapture();
  return <Inbox model={buildInbox(result, known)} />;
}
