import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const vercelAutomationBypassSecret =
  process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim() || null;
const userAAuthFile = path.join(__dirname, "e2e", ".auth", "user-a.json");
const userBAuthFile = path.join(__dirname, "e2e", ".auth", "user-b.json");

const extraHTTPHeaders = vercelAutomationBypassSecret
  ? {
      "x-vercel-protection-bypass": vercelAutomationBypassSecret,
      "x-vercel-set-bypass-cookie": "true",
    }
  : undefined;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  fullyParallel: false,
  workers: 1,
  reporter: process.env.CI ? "html" : "list",
  use: {
    baseURL,
    ...(extraHTTPHeaders ? { extraHTTPHeaders } : {}),
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    video: "off",
  },
  projects: [
    {
      name: "setup-user-a",
      testMatch: /auth-user-a\.setup\.ts/,
    },
    {
      name: "setup-user-b",
      testMatch: /auth-user-b\.setup\.ts/,
    },
    {
      name: "two-user-auth",
      testMatch: /two-user-auth\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup-user-a", "setup-user-b"],
    },
    {
      name: "profile",
      testMatch: /(?:^|[\\/])profile\.spec\.ts$/,
      use: { ...devices["Desktop Chrome"], storageState: userAAuthFile },
      dependencies: ["setup-user-a"],
    },
    {
      name: "objects-crud",
      testMatch: /(?:^|[\\/])objects-crud\.spec\.ts$/,
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["two-user-auth", "profile"],
    },
    {
      name: "favorites-wants",
      testMatch: /(?:^|[\\/])favorites-wants\.spec\.ts$/,
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["objects-crud"],
    },
    {
      name: "express-interest",
      testMatch: /(?:^|[\\/])express-interest\.spec\.ts$/,
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["favorites-wants"],
    },
    {
      name: "match-creation",
      testMatch: /(?:^|[\\/])match-creation\.spec\.ts$/,
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["express-interest"],
    },
    {
      name: "match-conversation-base",
      testMatch: /(?:^|[\\/])match-conversation\.spec\.ts$/,
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["match-creation"],
    },
    {
      name: "guided-match-conversation",
      testMatch: /(?:^|[\\/])guided-match-conversation\.spec\.ts$/,
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["match-conversation-base"],
    },
    {
      name: "match-conversation",
      testMatch: /(?:^|[\\/])realtime-guided-match-conversation\.spec\.ts$/,
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["guided-match-conversation"],
    },
    {
      name: "bilateral-match-agreement",
      testMatch: /(?:^|[\\/])bilateral-match-agreement\.spec\.ts$/,
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["match-conversation"],
    },
    {
      name: "chromium-user-a",
      testMatch: /user-a\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], storageState: userAAuthFile },
      dependencies: ["setup-user-a"],
    },
    {
      name: "chromium-user-b",
      testMatch: /user-b\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], storageState: userBAuthFile },
      dependencies: ["setup-user-b"],
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        timeout: 120_000,
        reuseExistingServer: !process.env.CI,
      },
});
