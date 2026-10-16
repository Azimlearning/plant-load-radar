/**
 * A smoke test of a running copy of the app: every page answers, shows what the deck promises, and the read-only
 * endpoints behave. Writes nothing and sends nothing.
 *   npm run build && npx next start -p 3111      (in one terminal)
 *   BASE_URL=http://localhost:3111 npm run smoke   (in another)
 * Exit code 1 on the first failed expectation, with what was missing.
 */
const base = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

const pages = [
  ["/", ["Plant Load Radar", "Synthetic demo data", "+83%", "RM435,616", "The rule, on one example", "Group finance"]],
  ["/board", ["Week 43 is 2,000 m³ short", "RM145,205 a day × 3 days of slip", "RM18,073", "Covered by build-ahead", "What if Project A (fictional) had 20 days of float?", "Decisions waiting"]],
  ["/inbox", ["Orders inbox", "22 messages"]],
  ["/inbox/try?sample=msg-01", ["What each step did", "1,800 m³ free after confirmed orders, 3,800 m³ already requested", "Hi project planner"]],
  ["/inbox/try?csv=sample", ["Contractor F", "What each step did"]],
  ["/decisions", ["Approve and send", "Send to the huddle", "Mon 26 Oct"]],
  ["/huddle", ["Weekly huddle", "Start the huddle", "Build-ahead plan to confirm", "Reserved slots"]],
  ["/ask?q=Can+we+take+800+m3+for+Johor+next+week%3F", ["Yes in Week 44 (4,100 m³ free). Week 43 would go 2,800 m³ short.", "Draft reply for the customer"]],
  ["/calloffs", ["Confirm a call-off", "Reserved slots", "Seeded for the demo"]],
  ["/outbox", ["Outbox", "Nothing was sent"]],
  ["/ledger", ["Ledger"]],
  ["/finance", ["Finance: the decision ledger", "Credit to the plant", "Download as CSV"]],
  ["/value", ["What today's arrangement costs", "RM145,205 per day"]],
  ["/pilot", ["Pilot scorecard", "Measured in month 1", "The ringgit-at-stake rule", "access, not budget"]],
  ["/sources", ["Sources and assumptions", "Every data file the app can load", "References cited in the pitch"]],
];

let failed = 0;
const fail = (msg) => {
  failed += 1;
  console.error(`FAIL ${msg}`);
};

for (const [path, needles] of pages) {
  const res = await fetch(base + path, { redirect: "manual" });
  if (res.status !== 200) {
    fail(`${path} answered ${res.status}`);
    continue;
  }
  const html = (await res.text()).replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ");
  const missing = needles.filter((n) => !html.includes(n));
  if (!html.includes("Synthetic demo data")) missing.push("the synthetic-data notice");
  if (missing.length) fail(`${path} is missing: ${missing.join(" | ")}`);
  else console.log(`ok   ${path}`);
}

const csv = await fetch(`${base}/finance/export`);
const csvText = await csv.text();
if (csv.status !== 200 || !csv.headers.get("content-type")?.startsWith("text/csv") || !csvText.startsWith("decided_on,week,served")) fail("/finance/export is not a CSV of decisions");
else console.log("ok   /finance/export");

const img = await fetch(`${base}/do-image/do-01`);
if (img.status !== 200 || img.headers.get("content-type") !== "image/png") fail("/do-image/do-01 is not a PNG");
else console.log("ok   /do-image/do-01");
if ((await fetch(`${base}/do-image/..%2F..%2Fsecret`)).status !== 404) fail("/do-image accepted an id it should refuse");
else console.log("ok   /do-image refuses an unknown id");

const secrets = ["ANTHROPIC_API_KEY", "sk-ant-"];
for (const [path] of pages) {
  const body = await (await fetch(base + path)).text();
  const leaked = secrets.filter((s) => body.includes(s));
  if (leaked.length) fail(`${path} contains ${leaked.join(", ")}`);
}
console.log("ok   no key-shaped text in any page");

if (failed) {
  console.error(`${failed} check(s) failed`);
  process.exit(1);
}
console.log("smoke: all checks passed");
