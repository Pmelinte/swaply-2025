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
    {
      name: "audit-chromium",
      use: {
        ...devices["Desktop Chrome"],
        // No storageState here — each spec manages its own auth so that
        // full-audit.spec.ts can fall back gracefully when the file is absent.
      },
      // Do not accidentally pick up the auth helper files.
      testIgnore: /tests\/auth\//,
    },
  ],
});
