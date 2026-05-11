import fs from "fs";
import path from "path";
import { test, expect, Page, BrowserContext, TestInfo } from "@playwright/test";

const BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL ||
  process.env.BASE_URL ||
  "https://www.swaply.world";

const USER_EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL || "";
const USER_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD || "";

const ADMIN_EMAIL = process.env.PLAYWRIGHT_ADMIN_EMAIL || USER_EMAIL;
const ADMIN_PASSWORD = process.env.PLAYWRIGHT_ADMIN_PASSWORD || USER_PASSWORD;

type AuditRole = "guest" | "user" | "admin";

type AuditRoute = {
  name: string;
  path: string;
  requiresAuth?: boolean;
  roles?: AuditRole[];
  expectedUrlIncludes?: string[];
  forbiddenUrlIncludes?: string[];
  requiredSelectors?: string[];
};

const ROUTES: AuditRoute[] = [
  {
    name: "home",
    path: "/en",
    roles: ["guest", "user", "admin"],
    forbiddenUrlIncludes: ["/login"],
  },
  {
    name: "objects",
    path: "/en/objects",
    roles: ["guest", "user", "admin"],
    forbiddenUrlIncludes: ["/login"],
  },
  {
    name: "explore",
    path: "/en/explore",
    roles: ["guest", "user", "admin"],
    forbiddenUrlIncludes: ["/login"],
  },
  {
    name: "matching",
    path: "/en/matching",
    requiresAuth: true,
    roles: ["user", "admin"],
    forbiddenUrlIncludes: ["/login"],
  },
  {
    name: "chat",
    path: "/en/chat",
    requiresAuth: true,
    roles: ["user", "admin"],
    forbiddenUrlIncludes: ["/login"],
  },
  {
    name: "exchange",
    path: "/en/exchange",
    requiresAuth: true,
    roles: ["user", "admin"],
    forbiddenUrlIncludes: ["/login"],
  },
  {
    name: "properties",
    path: "/en/properties",
    roles: ["guest", "user", "admin"],
    forbiddenUrlIncludes: ["/login"],
  },
  {
    name: "services",
    path: "/en/services",
    roles: ["guest", "user", "admin"],
    forbiddenUrlIncludes: ["/login"],
  },
  {
    name: "events",
    path: "/en/events",
    roles: ["guest", "user", "admin"],
    forbiddenUrlIncludes: ["/login"],
  },
  {
    name: "blog",
    path: "/en/blog",
    roles: ["guest", "user", "admin"],
    forbiddenUrlIncludes: ["/login"],
  },
  {
    name: "about",
    path: "/en/about",
    roles: ["guest", "user", "admin"],
    forbiddenUrlIncludes: ["/login"],
  },
  {
    name: "contact",
    path: "/en/contact",
    roles: ["guest", "user", "admin"],
    forbiddenUrlIncludes: ["/login"],
  },
];

async function ensureDir(dirPath: string) {
  await fs.promises.mkdir(dirPath, { recursive: true });
}

function sanitizeFileName(input: string) {
  return input.replace(/[^a-z0-9-_]+/gi, "-").replace(/-+/g, "-").toLowerCase();
}

async function readLocalStorageSnapshot(page: Page) {
  try {
    return await page.evaluate(() => {
      const out: Array<{ key: string; value: string }> = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (!key) continue;
        const value = localStorage.getItem(key) ?? "";
        out.push({ key, value: value.slice(0, 500) });
      }
      return out;
    });
  } catch {
    return [];
  }
}

async function collectAuthState(page: Page, context: BrowserContext) {
  const cookies = await context.cookies();
  const authCookies = cookies.filter((cookie) =>
    /sb-|supabase|auth|session|token/i.test(cookie.name)
  );

  const localStorageSnapshot = await readLocalStorageSnapshot(page);
  const authStorage = localStorageSnapshot.filter(
    (item) =>
      /supabase|auth|session|token|user/i.test(item.key) ||
      /access_token|refresh_token|currentSession|authenticated/i.test(item.value)
  );

  return {
    cookies: authCookies.map((cookie) => cookie.name),
    storageKeys: authStorage.map((item) => item.key),
    detected: authCookies.length > 0 || authStorage.length > 0,
  };
}

async function fillFirstVisible(page: Page, selectors: string[], value: string) {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if ((await locator.count().catch(() => 0)) === 0) continue;
    if (!(await locator.isVisible().catch(() => false))) continue;
    await locator.fill(value);
    return true;
  }
  return false;
}

async function clickFirstVisible(page: Page, selectors: string[]) {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if ((await locator.count().catch(() => 0)) === 0) continue;
    if (!(await locator.isVisible().catch(() => false))) continue;
    await locator.click();
    return true;
  }
  return false;
}

async function authenticateThroughLoginPage(
  page: Page,
  context: BrowserContext,
  email: string,
  password: string
): Promise<boolean> {
  if (!email || !password) return false;

  try {
    await context.clearCookies();
    await page.goto(new URL("/en/login", BASE_URL).toString(), {
      waitUntil: "domcontentloaded",
      timeout: 20_000,
    });

    await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => {});

    const emailFilled = await fillFirstVisible(
      page,
      [
        'input[type="email"]',
        'input[name="email"]',
        'input[id*="email" i]',
        'input[autocomplete="email"]',
        'input[placeholder*="email" i]',
      ],
      email
    );

    const passwordFilled = await fillFirstVisible(
      page,
      [
        'input[type="password"]',
        'input[name="password"]',
        'input[id*="password" i]',
        'input[autocomplete="current-password"]',
        'input[placeholder*="password" i]',
      ],
      password
    );

    if (!emailFilled || !passwordFilled) return false;

    const clicked = await clickFirstVisible(page, [
      'button[type="submit"]',
      'button:has-text("Sign in")',
      'button:has-text("Log in")',
      'button:has-text("Login")',
      'button:has-text("Autentificare")',
      'button:has-text("Conectare")',
    ]);

    if (!clicked) return false;

    await page.waitForURL((url) => !url.pathname.includes("/login"), {
      timeout: 15_000,
    }).catch(() => {});

    await page.waitForLoadState("domcontentloaded", { timeout: 10_000 }).catch(() => {});
    await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => {});
    await page.waitForTimeout(1000);

    const authState = await collectAuthState(page, context);
    return authState.detected && !page.url().includes("/login");
  } catch {
    return false;
  }
}

async function loginAsRole(
  page: Page,
  context: BrowserContext,
  role: AuditRole,
  testInfo: TestInfo
) {
  if (role === "guest") {
    return { loginWorked: true, attempted: false };
  }

  if (role === "user") {
    const ok = await authenticateThroughLoginPage(page, context, USER_EMAIL, USER_PASSWORD);
    if (!ok) {
      testInfo.annotations.push({
        type: "warning",
        description: "User UI authentication failed or credentials are missing.",
      });
    }
    return { loginWorked: ok, attempted: true };
  }

  const ok = await authenticateThroughLoginPage(page, context, ADMIN_EMAIL, ADMIN_PASSWORD);
  if (!ok) {
    testInfo.annotations.push({
      type: "warning",
      description: "Admin UI authentication failed or credentials are missing.",
    });
  }
  return { loginWorked: ok, attempted: true };
}

async function getPageSignals(page: Page) {
  const bodyText = await page.locator("body").innerText().catch(() => "");
  const h1Text = await page.locator("h1").first().innerText().catch(() => "");
  const hasMain = await page.locator("main").count().catch(() => 0);
  const hasBottomNav = await page
    .locator('nav, [role="navigation"]')
    .count()
    .catch(() => 0);

  return {
    bodySample: bodyText.slice(0, 1000),
    h1Text,
    hasMain: hasMain > 0,
    hasBottomNav: hasBottomNav > 0,
  };
}

test.describe("swaply.world authenticated deep audit", () => {
  for (const role of ["guest", "user", "admin"] as const) {
    test(`audit as ${role}`, async ({ page, context }, testInfo) => {
      test.setTimeout(15 * 60 * 1000);

      const resultsDir = path.join(process.cwd(), "audit-results", role);
      await ensureDir(resultsDir);

      const consoleErrors: Array<{ type: string; text: string }> = [];
      const requestFailures: Array<{ url: string; errorText: string }> = [];

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push({ type: msg.type(), text: msg.text() });
        }
      });

      page.on("requestfailed", (request) => {
        requestFailures.push({
          url: request.url(),
          errorText: request.failure()?.errorText || "unknown",
        });
      });

      const { loginWorked } = await loginAsRole(page, context, role, testInfo);
      const authState = await collectAuthState(page, context);

      if (role !== "guest") {
        expect.soft(loginWorked, `${role} login should succeed`).toBeTruthy();
        expect.soft(authState.detected, `${role} auth state should be detected`).toBeTruthy();
      }

      const roleResults: Array<Record<string, unknown>> = [];

      for (const route of ROUTES) {
        if (route.roles && !route.roles.includes(role)) continue;

        const targetUrl = new URL(route.path, BASE_URL).toString();
        const response = await page
          .goto(targetUrl, {
            waitUntil: "domcontentloaded",
            timeout: 20_000,
          })
          .catch(() => null);

        await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => {});
        await page.waitForTimeout(1000);

        const finalUrl = page.url();
        const status = response?.status() ?? null;
        const title = await page.title().catch(() => "");
        const signals = await getPageSignals(page);

        const screenshotPath = path.join(
          resultsDir,
          `${sanitizeFileName(route.name)}.png`
        );
        await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});

        if (route.requiresAuth && role !== "guest") {
          expect.soft(finalUrl.includes("/login")).toBeFalsy();
        }

        if (route.forbiddenUrlIncludes?.length) {
          for (const forbidden of route.forbiddenUrlIncludes) {
            expect
              .soft(
                finalUrl.includes(forbidden),
                `${route.path} should not end on ${forbidden} for ${role}`
              )
              .toBeFalsy();
          }
        }

        if (route.expectedUrlIncludes?.length) {
          for (const expected of route.expectedUrlIncludes) {
            expect
              .soft(
                finalUrl.includes(expected),
                `${route.path} should include ${expected} for ${role}`
              )
              .toBeTruthy();
          }
        }

        expect.soft(status, `${route.path} should return HTTP 200 for ${role}`).toBe(200);

        if (route.requiredSelectors?.length) {
          for (const selector of route.requiredSelectors) {
            const count = await page.locator(selector).count().catch(() => 0);
            expect.soft(count > 0, `${route.path} should contain ${selector}`).toBeTruthy();
          }
        }

        roleResults.push({
          role,
          path: route.path,
          status,
          finalUrl,
          title,
          requiresAuth: !!route.requiresAuth,
          authDetected: authState.detected,
          authCookies: authState.cookies,
          authStorageKeys: authState.storageKeys,
          hasMain: signals.hasMain,
          hasBottomNav: signals.hasBottomNav,
          h1Text: signals.h1Text,
          bodySample: signals.bodySample,
          screenshotPath,
        });
      }

      const consoleErrorsPath = path.join(resultsDir, "console-errors.json");
      const requestFailuresPath = path.join(resultsDir, "request-failures.json");
      const resultsPath = path.join(resultsDir, "results.json");

      await fs.promises.writeFile(resultsPath, JSON.stringify(roleResults, null, 2), "utf8");
      await fs.promises.writeFile(
        consoleErrorsPath,
        JSON.stringify(consoleErrors, null, 2),
        "utf8"
      );
      await fs.promises.writeFile(
        requestFailuresPath,
        JSON.stringify(requestFailures, null, 2),
        "utf8"
      );

      await testInfo.attach(`${role}-results.json`, {
        path: resultsPath,
        contentType: "application/json",
      });

      await testInfo.attach(`${role}-console-errors.json`, {
        path: consoleErrorsPath,
        contentType: "application/json",
      });

      await testInfo.attach(`${role}-request-failures.json`, {
        path: requestFailuresPath,
        contentType: "application/json",
      });
    });
  }
});
