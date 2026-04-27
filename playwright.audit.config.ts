import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 90_000,
  expect: { timeout: 20_000 },
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["json", { outputFile: "audit-results/report.json" }],
  ],

  use: {
    baseURL: process.env.BASE_URL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "off",
  },

  projects: [
    /**
     * Login project — runs tests/auth/setup.ts to generate
     * playwright/.auth/storage.json before the audit.
     * storage.json is always deleted and recreated fresh (never cached).
     */
    {
      name: "login",
      testMatch: /tests\/auth\/setup\.ts$/,
    },

    /**
     * Audit project — runs the actual audit suite.
     * auth/setup.ts is excluded here; audit.spec.ts manages
     * per-role auth inline so guest tests stay unauthenticated.
     */
    {
      name: "audit-chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /tests\/auth\/setup\.ts$/,
    },
  ],
});
