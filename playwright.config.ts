import { defineConfig, devices } from "@playwright/test";
import path from "path";

/**
 * Playwright E2E configuration for Swaply.
 *
 * Run all tests:   npx playwright test
 * Run one file:    npx playwright test e2e/login.spec.ts
 * UI mode:         npx playwright test --ui
 * Debug:           npx playwright test --debug
 */

const authFile = path.join(__dirname, "e2e", ".auth", "user.json");

export default defineConfig({
  testDir: "./e2e",
  /* Maximum time one test can run */
  timeout: 30_000,
  /* Maximum time expect() assertions can take */
  expect: { timeout: 10_000 },
  /* Fail the build on CI if test.only is left in source */
  forbidOnly: !!process.env.CI,
  /* Retry failed tests once on CI, never locally */
  retries: process.env.CI ? 1 : 0,
  /* Single worker keeps things predictable for a dev-server backend */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter: list for local, html for CI */
  reporter: process.env.CI ? "html" : "list",

  use: {
    /* Base URL lets us use relative paths in page.goto("/login") */
    baseURL: "http://localhost:3000",
    /* Capture screenshot only when a test fails */
    screenshot: "only-on-failure",
    /* Record trace on first retry so we can debug CI failures */
    trace: "on-first-retry",
    /* Keep video off to save disk; enable per-test if needed */
    video: "off",
  },

  projects: [
    /* Auth setup — logs in once and saves session state */
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },

    /* Public tests — no authentication needed */
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /auth\.setup\.ts/,
      grepInvert: /@auth/,
    },

    /* Authenticated tests — depend on setup project */
    {
      name: "chromium-auth",
      use: {
        ...devices["Desktop Chrome"],
        storageState: authFile,
      },
      dependencies: ["setup"],
      grep: /@auth/,
    },
  ],

  /* Start the Next.js dev server before running tests */
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    /* Wait up to 2 minutes for the dev server to be ready */
    timeout: 120_000,
    /* Reuse an already-running server if available */
    reuseExistingServer: !process.env.CI,
  },
});
