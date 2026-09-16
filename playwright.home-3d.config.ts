import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "home-3d.spec.ts",
  timeout: 60000,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["json", { outputFile: "test-results/home-3d.json" }]],
  use: {
    baseURL: "http://127.0.0.1:3000",
    browserName: "chromium",
    viewport: { width: 1440, height: 1000 },
    contextOptions: { reducedMotion: "reduce" },
    launchOptions: { args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: { command: "npm run start", url: "http://127.0.0.1:3000/en", timeout: 120000, reuseExistingServer: !process.env.CI },
});
