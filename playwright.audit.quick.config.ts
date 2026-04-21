import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: [["list"], ["json", { outputFile: "audit-results/quick-report.json" }]],

  use: {
    baseURL: process.env.BASE_URL,
    screenshot: "off",
    trace: "off",
    video: "off",
  },

  projects: [
    {
      name: "quick-audit-chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
