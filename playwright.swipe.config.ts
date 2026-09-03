import { defineConfig, devices } from "@playwright/test";

// Isolated public UI suite: never logs into or writes to the real database.
export default defineConfig({
  testDir: "./e2e",
  testMatch: "swipe-discovery.spec.ts",
  timeout: 90_000,
  expect: { timeout: 20_000 },
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.SWIPE_PREVIEW_URL || "http://localhost:3100",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    serviceWorkers: "block", // Keep deterministic fixtures from being bypassed by the app's service worker.
  },
  projects: [
    { name: "swipe-desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } } },
    { name: "swipe-tablet", use: { ...devices["iPad Mini"], defaultBrowserType: "chromium" } },
    { name: "swipe-mobile", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } } },
  ],
});
