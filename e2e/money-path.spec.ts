import { expect, test } from "@playwright/test";

// The money path: a scheduler decides week 43, edits the reply, approves and sends; the outbox, the finance view and the
// board all show it. Each test is a fresh visitor (cookie mode), so nothing leaks between them.

const EDITED_REPLY = "Hi Contractor B, sorry about the wait. We can do Mon 26 Oct instead. Please confirm. (edited in the e2e test)";

test("approve and send: ledger, outbox, finance and the board agree", async ({ page }) => {
  await page.goto("/board");
  const waiting = page.locator(".kpi", { hasText: "Decisions waiting" });
  await expect(waiting.locator(".kpi-value")).toHaveText("1");

  await page.goto("/decisions");
  await expect(page.getByRole("heading", { name: /Week 43 is 2,000 m³ short/ })).toBeVisible();
  await page.getByLabel("Your name (required)").fill("Siti (e2e)");
  const reply = page.getByLabel(/^Reply to Contractor B/);
  await reply.fill(EDITED_REPLY);
  await page.getByRole("button", { name: "Approve and send" }).click();

  await expect(page).toHaveURL(/\/outbox$/);
  await expect(page.getByText(EDITED_REPLY)).toBeVisible();
  await expect(page.getByText("Siti (e2e)").first()).toBeVisible();

  await page.goto("/finance");
  await expect(page.getByText("Week 43").first()).toBeVisible();
  await expect(page.getByText("RM435,616").first()).toBeVisible();

  await page.goto("/ledger");
  await expect(page.getByText("Siti (e2e)").first()).toBeVisible();

  await page.goto("/board");
  await expect(waiting.locator(".kpi-value")).toHaveText("0");
  await expect(page.getByText(/Decided by Siti \(e2e\)/)).toBeVisible();
});

test("a decision needs a named person: the form will not submit without one", async ({ page }) => {
  await page.goto("/decisions");
  const posts: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST") posts.push(r.url());
  });
  await page.getByRole("button", { name: "Record decision only" }).click();
  // The browser itself refuses: the name field is invalid and no request is sent.
  expect(await page.getByLabel("Your name (required)").evaluate((el) => (el as HTMLInputElement).validity.valueMissing)).toBe(true);
  expect(posts).toEqual([]);
  await page.goto("/board");
  await expect(page.locator(".kpi", { hasText: "Decisions waiting" }).locator(".kpi-value")).toHaveText("1");
});

test("send to the huddle: a marker on the open decision, nothing decided", async ({ page }) => {
  await page.goto("/decisions");
  await page.getByLabel("Your name (required)").fill("Hakim (e2e)");
  await page.getByRole("button", { name: "Send to the huddle" }).click();

  await expect(page).toHaveURL(/\/huddle#week-2026-W43$/);
  await expect(page.getByText(/Sent here by Hakim \(e2e\)/)).toBeVisible();

  await page.goto("/decisions");
  await expect(page.getByText(/Sent to the huddle by Hakim \(e2e\)/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Approve and send" })).toBeVisible(); // still open
  await page.goto("/board");
  await expect(page.locator(".kpi", { hasText: "Decisions waiting" }).locator(".kpi-value")).toHaveText("1");

  // Deciding it spends the flag: the huddle's list is empty again.
  await page.goto("/decisions");
  await page.getByLabel("Your name (required)").fill("Hakim (e2e)");
  await page.getByRole("button", { name: "Record decision only" }).click();
  await expect(page).toHaveURL(/\/ledger$/); // wait for the redirect before leaving the page
  await page.goto("/huddle");
  await expect(page.getByText("No week is waiting for a decision.")).toBeVisible();
});

test("a call-off reaches beyond week 46, shows on the board, and leaves the week-43 decision alone", async ({ page }) => {
  await page.goto("/calloffs");
  const weeks = page.getByLabel("Week");
  await expect(weeks.locator("option")).toHaveCount(8); // the prompt plus weeks 46 to 52
  await page.getByLabel("Project").selectOption({ label: "Project D (fictional)" });
  await weeks.selectOption("2026-W50");
  await page.getByLabel("Volume, in cubic metres").fill("400");
  await page.getByLabel("Your name (required)").fill("Aina (e2e)");
  await page.getByRole("button", { name: "Reserve the slot" }).click();
  await expect(page.getByText(/Slot reserved/)).toBeVisible();

  await page.goto("/board");
  const slots = page.getByRole("region", { name: "Reserved slots" });
  await expect(slots.getByText("Your call-off")).toBeVisible();
  await expect(slots.getByText("Week 50")).toBeVisible();
  await expect(page.locator(".kpi", { hasText: "Decisions waiting" }).locator(".kpi-value")).toHaveText("1");
  await expect(page.getByRole("heading", { name: /Week 43 is 2,000 m³ short/ }).first()).toBeVisible();
});

test("the board shows slide 9's six weeks, and twelve on request", async ({ page }) => {
  await page.goto("/board");
  const bars = page.locator("svg.chart-svg path.bar-short, svg.chart-svg path.bar-spare");
  await expect(bars).toHaveCount(6);
  await page.getByRole("link", { name: "Show 6 more weeks" }).click();
  await expect(page).toHaveURL(/weeks=all/);
  await expect(bars).toHaveCount(12);
  await page.getByRole("link", { name: "Show the first weeks only" }).click();
  await expect(bars).toHaveCount(6);
});

test("try it: a pasted WhatsApp chat export becomes one result per order message", async ({ page }) => {
  await page.goto("/inbox/try");
  await page.getByRole("link", { name: "Read a sample WhatsApp chat export" }).click();
  await expect(page.getByText(/Read 4 messages from a WhatsApp chat export/)).toBeVisible();
  await expect(page.getByText("Hakim (Project D)").first()).toBeVisible();
  await expect(page.getByText(/quantity written in words/).first()).toBeVisible();
});
