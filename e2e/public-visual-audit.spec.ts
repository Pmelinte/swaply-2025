import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { FORBIDDEN_PUBLIC_LOGIN_WALL_PATTERNS } from "../src/lib/public-pages/loginWallGuards";
import {
  getPublicDrawerAuditRoutes,
  getPublicVisualAuditRoutes,
  toLocalizedRoute,
} from "../src/lib/public-pages/publicRouteAudit";

const screenshotRoot = path.join(process.cwd(), "playwright-audit-screenshots");

const publicRoutes = getPublicVisualAuditRoutes("en");
const drawerAuditRoutes = getPublicDrawerAuditRoutes("en");

const domainParityPaths = ["/properties", "/services", "/events"] as const;
const domainParityLocales = [
  { locale: "de", direction: "ltr" },
  { locale: "ar", direction: "rtl" },
] as const;

const forbiddenInternalCopy = [
  /foundation stack/i,
  /batch\s*\d/i,
  /route guardrails/i,
  /ai advisory/i,
  /real action after login/i,
];

const viewports = [
  { name: "desktop", width: 1440, height: 1100 },
  { name: "mobile", width: 390, height: 844 },
] as const;

function screenshotPath(viewportName: string, route: string) {
  const safeRoute =
    route.replace(/^\//, "").replace(/[^a-zA-Z0-9]+/g, "-") || "home";
  const folder = path.join(screenshotRoot, viewportName);
  mkdirSync(folder, { recursive: true });
  return path.join(folder, `${safeRoute}.png`);
}

function routePageKey(route: string) {
  return route.split("/").filter(Boolean).at(-1) ?? "home";
}

async function assertPublicPageIsHealthy(page: Page, route: string) {
  const response = await page.goto(route, { waitUntil: "domcontentloaded" });
  const status = response?.status();

  expect(status, `${route} must return a HTTP response`).toBeDefined();
  expect(status, `${route} must not redirect to a missing page`).toBeLessThan(
    400,
  );

  await page
    .waitForLoadState("networkidle", { timeout: 5_000 })
    .catch(() => undefined);

  const body = page.locator("body");
  await expect(body, `${route} body must be visible`).toBeVisible();
  await expect(body, `${route} must not render the Next.js 404`).not.toContainText(
    "This page could not be found",
  );
  await expect(
    body,
    `${route} must not render a generic application error`,
  ).not.toContainText("Application error");
  await expect(body, `${route} must not render a runtime error`).not.toContainText(
    "Unhandled Runtime Error",
  );

  const bodyText = await body.innerText();
  for (const pattern of FORBIDDEN_PUBLIC_LOGIN_WALL_PATTERNS) {
    expect(
      pattern.test(bodyText),
      `${route} must not be a blank login wall matching ${pattern}`,
    ).toBe(false);
  }

  for (const pattern of forbiddenInternalCopy) {
    expect(
      pattern.test(bodyText),
      `${route} must not expose internal project copy matching ${pattern}`,
    ).toBe(false);
  }
}

async function assertDrawerIsHealthy(page: Page, route: string) {
  const drawer = page.getByRole("dialog", { name: /context menu/i });
  await expect(
    drawer,
    `${route} drawer must be visible after contextual-menu click`,
  ).toBeVisible();

  const drawerPage = drawer.locator("[data-drawer-page]").first();
  if ((await drawerPage.count()) > 0) {
    await expect(
      drawerPage,
      `${route} drawer must expose a stable route-specific identity`,
    ).toHaveAttribute("data-drawer-page", routePageKey(route));
  } else {
    expect(
      routePageKey(route),
      `${route} may omit data-drawer-page only for the legacy Explore filter drawer`,
    ).toBe("explore");
  }

  const drawerControls = drawer.locator('a[href], button:not([disabled])');
  expect(
    await drawerControls.count(),
    `${route} drawer must expose useful navigation or actions`,
  ).toBeGreaterThan(1);

  const drawerText = await drawer.innerText();
  for (const pattern of forbiddenInternalCopy) {
    expect(
      pattern.test(drawerText),
      `${route} drawer must not expose internal project copy matching ${pattern}`,
    ).toBe(false);
  }
}

test.describe("Swaply public visual audit", () => {
  for (const viewport of viewports) {
    test.describe(viewport.name, () => {
      test.use({ viewport });

      for (const route of publicRoutes) {
        test(`renders ${route}`, async ({ page }, testInfo) => {
          await assertPublicPageIsHealthy(page, route);

          const filePath = screenshotPath(viewport.name, route);
          await page.screenshot({
            path: filePath,
            fullPage: true,
            animations: "disabled",
          });
          await testInfo.attach(`${viewport.name}-${route}`, {
            path: filePath,
            contentType: "image/png",
          });
        });
      }
    });
  }

  test.describe("drawers", () => {
    test.use({ viewport: { width: 1440, height: 1100 } });

    for (const route of drawerAuditRoutes) {
      test(`opens route-specific drawer on ${route}`, async ({ page }, testInfo) => {
        await assertPublicPageIsHealthy(page, route);
        await page.getByRole("button", { name: /context menu/i }).first().click();
        await assertDrawerIsHealthy(page, route);

        const filePath = screenshotPath("drawer", route);
        await page.screenshot({
          path: filePath,
          fullPage: true,
          animations: "disabled",
        });
        await testInfo.attach(`drawer-${route}`, {
          path: filePath,
          contentType: "image/png",
        });
      });
    }
  });

  for (const { locale, direction } of domainParityLocales) {
    for (const viewport of viewports) {
      test.describe(`${locale} domain parity on ${viewport.name}`, () => {
        test.use({ viewport });

        for (const domainPath of domainParityPaths) {
          const route = toLocalizedRoute(domainPath, locale);

          test(`renders ${route} with locale direction`, async ({
            page,
          }, testInfo) => {
            await assertPublicPageIsHealthy(page, route);
            await expect(page.locator("html")).toHaveAttribute("lang", locale);
            await expect(page.locator("html")).toHaveAttribute("dir", direction);

            const filePath = screenshotPath(
              `${viewport.name}-${locale}`,
              route,
            );
            await page.screenshot({
              path: filePath,
              fullPage: true,
              animations: "disabled",
            });
            await testInfo.attach(`${viewport.name}-${locale}-${route}`, {
              path: filePath,
              contentType: "image/png",
            });
          });
        }
      });
    }
  }
});
