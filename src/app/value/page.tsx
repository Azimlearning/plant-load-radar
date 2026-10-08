import { loadValue } from "@/data/value";
import { Value } from "./value";

// A server component: inputs are read through the manifest-enforcing loader, the calculator runs, and the page
// receives a finished model. Prerendered; nothing is written and nothing is sent.
export default function ValuePage() {
  return <Value model={loadValue()} />;
}
