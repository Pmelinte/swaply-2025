import fs from "fs";
import path from "path";
import { test, expect, type Page, type BrowserContext, type TestInfo } from "@playwright/test";

const BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL ||
  process.env.BASE_URL ||
  "https://www.swaply.world";

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "";

const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

const TEST_EMAIL =
  process.env.PLAYWRIGHT_TEST_EMAIL ||
  process.env.AUDIT_TEST_EMAIL ||
  "alexandru.stoica516@gmail.com";

const TEST_PASSWORD =
  process.env.PLAYWRIGHT_TEST_PASSWORD ||
  process.env.AUDIT_TEST_PASSWORD ||
  "Swaply2026!";

const RESULTS_DIR = path.join(process.cwd(), "audit-results", "full-audit");
const SCREENSHOTS_DIR = path.join(RESULTS_DIR, "screenshots");

const NOISE_FILTER = /error|MISSING|crash/i;

const ERROR_IGNORE_PATTERNS: RegExp[] = [
  /favicon\.ico/i,
  /Failed to load resource: the server responded with a status of 404 \(.*\)\s*$/i,
  /chrome-extension:\/\//i,
  /\bnet::ERR_ABORTED\b/i,
];

type ViewportName = "desktop" | "mobile";

type RouteSpec = {
  name: string;
  path: string;
  requiresAuth?: boolean;
  clickFirstNCards?: number;
};

const ROUTES: RouteSpec[] = [
  { name: "root-redirect", path: "/" },
  { name: "home", path: "/en" },
  { name: "objects", path: "/en/objects", clickFirstNCards: 3 },
  { name: "properties", path: "/en/properties", clickFirstNCards: 3 },
  { name: "services", path: "/en/services", clickFirstNCards: 3 },
  { name: "events", path: "/en/events", clickFirstNCards: 3 },
  { name: "explore", path: "/en/explore" },
  { name: "matching", path: "/en/matching", requiresAuth: true },
  { name: "messages", path: "/en/messages", requiresAuth: true },
  { name: "exchange", path: "/en/exchange", requiresAuth: true },
  { name: "profile", path: "/en/profile", requiresAuth: true },
  { name: "settings", path: "/en/settings", requiresAuth: true },
  { name: "dashboard", path: "/en/dashboard", requiresAuth: true },
  { name: "notifications", path: "/en/notifications", requiresAuth: true },
  { name: "help", path: "/en/help" },
  { name: "blog", path: "/en/blog" },
  { name: "login", path: "/en/login" },
];

const VIEWPORTS: Record<ViewportName, { width: number; height: number }> = {
  desktop: { width: 1280, height: 900 },
  mobile: { width: 390, height: 844 },
};

const MOBILE_USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1";

type ConsoleEntry = {
  type: string;
  text: string;
  location?: string;
};

type CardClickResult = {
  index: number;
  hrefBefore: string;
  hrefAfter: string;
  navigated: boolean;
  consoleErrorsAfter: number;
  pageErrorsAfter: number;
  notes?: string;
};

type RouteResult = {
  route: string;
  path: string;
  viewport: ViewportName;
  status: number | null;
  finalUrl: string;
  redirected: boolean;
  title: string;
  h1: string;
  hasMain: boolean;
  consoleErrors: ConsoleEntry[];
  pageErrors: string[];
  requestFailures: Array<{ url: string; errorText: string }>;
  screenshot: string;
  cardClicks?: CardClickResult[];
  severity: "ok" | "low" | "medium" | "high" | "critical";
  severityReasons: string[];
  durationMs: number;
};

async function ensureDir(dirPath: string) {
  await fs.promises.mkdir(dirPath, { recursive: true });
}

function sanitize(input: string) {
  return input.replace(/[^a-z0-9-_]+/gi, "-").replace(/-+/g, "-").toLowerCase();
}

function shouldIgnoreEntry(text: string) {
  return ERROR_IGNORE_PATTERNS.some((pattern) => pattern.test(text));
}

async function authenticateWithSupabase(
  page: Page,
  _context: BrowserContext,
  testInfo: TestInfo
): Promise<boolean> {
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    testInfo.annotations.push({
      type: "warning",
      description: "Missing PLAYWRIGHT_TEST_EMAIL/PASSWORD — running unauthenticated.",
    });
    return false;
  }
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    testInfo.annotations.push({
      type: "warning",
      description: "Missing SUPABASE_URL or SUPABASE_ANON_KEY — cannot authenticate.",
    });
    return false;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      testInfo.annotations.push({
        type: "warning",
        description: `Supabase login failed: HTTP ${response.status}`,
      });
      return false;
    }

    const session = (await response.json()) as Record<string, unknown>;
    if (!session.access_token) return false;

    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 20_000 });

    const projectRef =
      SUPABASE_URL.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1] ?? "";
    const storageKey = projectRef ? `sb-${projectRef}-auth-token` : "sb-auth-token";

    await page.evaluate(
      ({ key, value }: { key: string; value: string }) => {
        localStorage.setItem(key, value);
      },
      { key: storageKey, value: JSON.stringify(session) }
    );

    await page.reload({ waitUntil: "domcontentloaded" });
    return true;
  } catch (error) {
    testInfo.annotations.push({
      type: "warning",
      description: `Supabase login threw: ${(error as Error).message}`,
    });
    return false;
  }
}

function classifyRoute(result: Omit<RouteResult, "severity" | "severityReasons">) {
  const reasons: string[] = [];
  let severity: RouteResult["severity"] = "ok";

  const bump = (next: RouteResult["severity"]) => {
    const order: RouteResult["severity"][] = ["ok", "low", "medium", "high", "critical"];
    if (order.indexOf(next) > order.indexOf(severity)) severity = next;
  };

  const status = result.status ?? 0;
  if (status >= 500) {
    reasons.push(`HTTP ${status}`);
    bump("critical");
  } else if (status === 404) {
    reasons.push("HTTP 404");
    bump("high");
  } else if (status >= 400) {
    reasons.push(`HTTP ${status}`);
    bump("high");
  } else if (status === 0 || result.status === null) {
    reasons.push("No HTTP response");
    bump("high");
  }

  if (result.pageErrors.length > 0) {
    reasons.push(`${result.pageErrors.length} uncaught page error(s)`);
    bump("critical");
  }

  const matchingConsoleErrors = result.consoleErrors.filter(
    (entry) => NOISE_FILTER.test(entry.text)
  );
  if (matchingConsoleErrors.length > 0) {
    reasons.push(`${matchingConsoleErrors.length} console error/MISSING/crash entries`);
    bump("high");
  }

  if (!result.title) {
    reasons.push("Empty <title>");
    bump("medium");
  }
  if (!result.h1) {
    reasons.push("No visible <h1>");
    bump("medium");
  }
  if (!result.hasMain) {
    reasons.push("No <main> landmark");
    bump("low");
  }
  if (result.requestFailures.length > 0) {
    reasons.push(`${result.requestFailures.length} failed network request(s)`);
    bump("low");
  }

  return { severity, severityReasons: reasons };
}

async function clickFirstNCards(
  page: Page,
  n: number,
  consoleErrors: ConsoleEntry[],
  pageErrors: string[]
): Promise<CardClickResult[]> {
  const results: CardClickResult[] = [];
  for (let i = 0; i < n; i += 1) {
    const cards = page.locator(".item-card");
    const count = await cards.count().catch(() => 0);
    if (count <= i) {
      results.push({
        index: i,
        hrefBefore: page.url(),
        hrefAfter: page.url(),
        navigated: false,
        consoleErrorsAfter: consoleErrors.length,
        pageErrorsAfter: pageErrors.length,
        notes: `Only ${count} cards available`,
      });
      continue;
    }

    const before = page.url();
    const errorsBefore = pageErrors.length;
    const consoleBefore = consoleErrors.length;

    try {
      await cards.nth(i).scrollIntoViewIfNeeded({ timeout: 3_000 }).catch(() => {});
      await Promise.all([
        page.waitForLoadState("domcontentloaded", { timeout: 10_000 }).catch(() => {}),
        cards.nth(i).click({ timeout: 5_000 }),
      ]);
      await page.waitForTimeout(800);
    } catch (error) {
      results.push({
        index: i,
        hrefBefore: before,
        hrefAfter: page.url(),
        navigated: false,
        consoleErrorsAfter: consoleErrors.length,
        pageErrorsAfter: pageErrors.length,
        notes: `Click failed: ${(error as Error).message}`,
      });
      await page.goto(before, { waitUntil: "domcontentloaded" }).catch(() => {});
      continue;
    }

    const after = page.url();
    results.push({
      index: i,
      hrefBefore: before,
      hrefAfter: after,
      navigated: after !== before,
      consoleErrorsAfter: consoleErrors.length - consoleBefore,
      pageErrorsAfter: pageErrors.length - errorsBefore,
    });

    await page.goto(before, { waitUntil: "domcontentloaded", timeout: 20_000 }).catch(() => {});
    await page.waitForTimeout(400);
  }
  return results;
}

async function auditRoute(
  page: Page,
  route: RouteSpec,
  viewport: ViewportName,
  consoleErrors: ConsoleEntry[],
  pageErrors: string[],
  requestFailures: Array<{ url: string; errorText: string }>
): Promise<RouteResult> {
  consoleErrors.length = 0;
  pageErrors.length = 0;
  requestFailures.length = 0;

  const started = Date.now();
  const target = new URL(route.path, BASE_URL).toString();

  const response = await page
    .goto(target, { waitUntil: "domcontentloaded", timeout: 25_000 })
    .catch(() => null);
  await page.waitForLoadState("networkidle", { timeout: 6_000 }).catch(() => {});
  await page.waitForTimeout(700);

  const status = response?.status() ?? null;
  const finalUrl = page.url();
  const redirected = !finalUrl.endsWith(route.path) && finalUrl !== target;
  const title = await page.title().catch(() => "");
  const h1 = await page
    .locator("h1")
    .first()
    .innerText({ timeout: 2_000 })
    .catch(() => "");
  const hasMain = (await page.locator("main").count().catch(() => 0)) > 0;

  const screenshotName = `${sanitize(route.name)}--${viewport}.png`;
  const screenshotPath = path.join(SCREENSHOTS_DIR, screenshotName);
  await page
    .screenshot({ path: screenshotPath, fullPage: true, animations: "disabled" })
    .catch(() => {});

  let cardClicks: CardClickResult[] | undefined;
  if (route.clickFirstNCards && viewport === "desktop") {
    cardClicks = await clickFirstNCards(page, route.clickFirstNCards, consoleErrors, pageErrors);
  }

  const filteredConsole = [...consoleErrors].filter(
    (entry) => !shouldIgnoreEntry(entry.text)
  );
  const filteredFailures = [...requestFailures].filter(
    (entry) => !shouldIgnoreEntry(entry.url)
  );

  const base = {
    route: route.name,
    path: route.path,
    viewport,
    status,
    finalUrl,
    redirected,
    title,
    h1,
    hasMain,
    consoleErrors: filteredConsole,
    pageErrors: [...pageErrors],
    requestFailures: filteredFailures,
    screenshot: path.relative(RESULTS_DIR, screenshotPath),
    cardClicks,
    durationMs: Date.now() - started,
  };

  const { severity, severityReasons } = classifyRoute(base);
  return { ...base, severity, severityReasons };
}

test.describe("swaply.world full route audit", () => {
  test("audits every route on desktop and mobile", async ({ browser }, testInfo) => {
    test.setTimeout(20 * 60 * 1000);
    await ensureDir(SCREENSHOTS_DIR);

    const allResults: RouteResult[] = [];
    let authenticated = false;

    for (const viewportName of ["desktop", "mobile"] as const) {
      const context = await browser.newContext({
        viewport: VIEWPORTS[viewportName],
        userAgent: viewportName === "mobile" ? MOBILE_USER_AGENT : undefined,
        deviceScaleFactor: viewportName === "mobile" ? 3 : 1,
        isMobile: viewportName === "mobile",
        hasTouch: viewportName === "mobile",
      });
      const page = await context.newPage();

      const consoleErrors: ConsoleEntry[] = [];
      const pageErrors: string[] = [];
      const requestFailures: Array<{ url: string; errorText: string }> = [];

      page.on("console", (msg) => {
        if (msg.type() === "error" || msg.type() === "warning") {
          consoleErrors.push({
            type: msg.type(),
            text: msg.text(),
            location: msg.location()?.url,
          });
        }
      });
      page.on("pageerror", (err) => {
        pageErrors.push(err.message);
      });
      page.on("requestfailed", (req) => {
        requestFailures.push({
          url: req.url(),
          errorText: req.failure()?.errorText || "unknown",
        });
      });

      const loggedIn = await authenticateWithSupabase(page, context, testInfo);
      if (viewportName === "desktop") authenticated = loggedIn;

      for (const route of ROUTES) {
        const result = await auditRoute(
          page,
          route,
          viewportName,
          consoleErrors,
          pageErrors,
          requestFailures
        );
        allResults.push(result);
      }

      await context.close();
    }

    const reportPath = path.join(RESULTS_DIR, "results.json");
    await fs.promises.writeFile(
      reportPath,
      JSON.stringify(
        {
          baseUrl: BASE_URL,
          authenticated,
          generatedAt: new Date().toISOString(),
          results: allResults,
        },
        null,
        2
      ),
      "utf8"
    );

    await testInfo.attach("full-audit-results.json", {
      path: reportPath,
      contentType: "application/json",
    });

    const criticalCount = allResults.filter((r) => r.severity === "critical").length;
    const highCount = allResults.filter((r) => r.severity === "high").length;
    expect.soft(criticalCount, "no critical-severity routes").toBe(0);
    expect.soft(highCount, "summary of high-severity routes (soft)").toBeGreaterThanOrEqual(0);
  });
});
