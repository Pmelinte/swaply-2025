import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for public route auditing.
 * Separate from the main playwright.config.ts (which targets e2e/).
 *
 * Usage:
 *   BASE_URL=https://www.swaply.world npx playwright test --config playwright.audit.config.ts
 */
export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: [["list"], ["json", { outputFile: "audit-results/report.json" }]],

  use: {
    baseURL: process.env.BASE_URL,
    screenshot: "off", // we take manual full-page screenshots
    trace: "off",
    video: "off",
  },

  projects: [
    {
      name: "audit-chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // No webServer — we audit a live deployment via BASE_URL
});
