import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Every page, at desktop and at phone width: no console errors, no sideways scroll of the whole page, and no
// accessibility violations that axe can detect (labels, names, contrast, landmarks). Axe cannot judge everything;
// keyboard order and reduced motion are checked by hand and recorded in the changelog.

const ROUTES = [
  "/",
  "/board",
  "/board?weeks=all",
  "/inbox",
  "/inbox/try",
  "/inbox/try?chat=sample",
  "/inbox/try?csv=sample",
  "/decisions",
  "/huddle",
  "/ask",
  "/calloffs",
  "/outbox",
  "/ledger",
  "/finance",
  "/value",
  "/pilot",
  "/sources",
];

for (const route of ROUTES) {
  test(`${route}: loads clean, fits the screen, and passes axe`, async ({ page }) => {
    const problems: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") problems.push(`console: ${m.text()}`);
    });
    page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
    page.on("response", (r) => {
      if (r.status() >= 400) problems.push(`${r.status()} ${r.url()}`);
    });

    await page.goto(route);
    await expect(page.locator("main, [role=main]").first()).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, "the page scrolls sideways").toBeLessThanOrEqual(0);

    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    const found = axe.violations.map((v) => `${v.id} (${v.impact}): ${v.help} — ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
    expect(found, "accessibility violations").toEqual([]);
    expect(problems).toEqual([]);
  });
}

test("keyboard only: the first Tab stop is the skip link, and it lands in the page content", async ({ page }) => {
  await page.goto("/board");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to the page content" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.locator("main#content")).toBeFocused();
  await page.keyboard.press("Tab");
  const next = await page.evaluate(() => document.activeElement?.closest("main") !== null);
  expect(next, "focus moves on inside the page content, not back into the navigation").toBe(true);
});

test("keyboard only: the decision form can be completed and submitted without a mouse", async ({ page }) => {
  await page.goto("/decisions");
  await page.getByLabel("Your name (required)").focus();
  await page.keyboard.type("Keyboard user");
  await page.getByRole("button", { name: "Record decision only" }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/ledger$/);
  await expect(page.getByText("Keyboard user").first()).toBeVisible();
});
