import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

const routesFile = path.join(__dirname, "..", "audit.routes.json");
const routes: { public: string[] } = JSON.parse(
  fs.readFileSync(routesFile, "utf-8"),
);

const RESULTS_DIR = path.join(__dirname, "..", "audit-results");

interface RouteResult {
  route: string;
  url: string;
  status: number | null;
  consoleErrors: string[];
  requestFailures: string[];
  englishLeaks: string[];
  screenshotFile: string;
  timestamp: string;
}

// Common English words that should NOT appear on Romanian pages
const ENGLISH_LEAK_PATTERNS = [
  /\bLoading data\b/i,
  /\bSomething went wrong\b/i,
  /\bSign in to start\b/i,
  /\bNo data available\b/i,
  /\bRecommended next step\b/i,
  /\bToken balance\b/i,
  /\bView all notifications\b/i,
];

test.describe("Public Route Audit", () => {
  const allResults: RouteResult[] = [];

  test.beforeAll(() => {
    if (!process.env.BASE_URL) {
      throw new Error(
        "BASE_URL environment variable is required. " +
          "Set it to the deployment URL, e.g. BASE_URL=https://www.swaply.world",
      );
    }
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  });

  for (const route of routes.public) {
    test(`audit ${route}`, async ({ page }) => {
      const baseUrl = process.env.BASE_URL!;
      const fullUrl = `${baseUrl}${route}`;
      const consoleErrors: string[] = [];
      const requestFailures: string[] = [];

      // Listen for console errors
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
      });

      // Listen for failed requests
      page.on("requestfailed", (req) => {
        requestFailures.push(
          `${req.method()} ${req.url()} — ${req.failure()?.errorText ?? "unknown"}`,
        );
      });

      // Navigate
      let status: number | null = null;
      try {
        const response = await page.goto(fullUrl, {
          waitUntil: "networkidle",
          timeout: 30_000,
        });
        status = response?.status() ?? null;
      } catch (e) {
        consoleErrors.push(`Navigation error: ${e instanceof Error ? e.message : String(e)}`);
      }

      // Full-page screenshot
      const slug = route.replace(/\//g, "_").replace(/^_/, "") || "root";
      const screenshotFile = `${slug}.png`;
      await page.screenshot({
        path: path.join(RESULTS_DIR, screenshotFile),
        fullPage: true,
      });

      // Check for English text leaks on Romanian pages
      const englishLeaks: string[] = [];
      if (route.startsWith("/ro")) {
        const bodyText = await page.textContent("body").catch(() => "");
        if (bodyText) {
          for (const pattern of ENGLISH_LEAK_PATTERNS) {
            const match = bodyText.match(pattern);
            if (match) {
              englishLeaks.push(match[0]);
            }
          }
        }
      }

      // Build result
      const result: RouteResult = {
        route,
        url: fullUrl,
        status,
        consoleErrors,
        requestFailures,
        englishLeaks,
        screenshotFile,
        timestamp: new Date().toISOString(),
      };
      allResults.push(result);

      // Write incremental results
      fs.writeFileSync(
        path.join(RESULTS_DIR, "audit-results.json"),
        JSON.stringify(allResults, null, 2),
      );

      // Assert page loaded successfully
      expect(status, `${route} should return 200`).toBe(200);
    });
  }
});
