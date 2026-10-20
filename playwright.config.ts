import { defineConfig, devices } from "@playwright/test";

// End-to-end tests run against the production build (`npm run build` first; `npm run e2e` does both), in the same
// hosted-style cookie mode a judge's browser gets, so every test starts as a fresh visitor with nothing recorded.
// Port 3112 is deliberately not the dev or smoke port: an old `next start` on a shared port serves a stale build.
const PORT = 3112;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } },
    { name: "phone", use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 800 }, hasTouch: true }, testMatch: /layout\.spec\.ts/ },
  ],
  webServer: {
    command: `npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 60_000,
    env: { PLR_LEDGER_MODE: "cookie", PLR_LLM_MODE: "off" },
  },
});
