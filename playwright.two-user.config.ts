import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const userAAuthFile = path.join(__dirname, "e2e", ".auth", "user-a.json");
const userBAuthFile = path.join(__dirname, "e2e", ".auth", "user-b.json");

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "html" : "list",
  use: {
    baseURL,
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
      dependencies: ["setup-user-a", "setup-user-b"],
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
