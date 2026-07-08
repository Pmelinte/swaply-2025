import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";
import {
  getPublicDrawerAuditRoutes,
  getPublicVisualAuditRoutes,
} from "../src/lib/public-pages/publicRouteAudit";

const screenshotRoot = path.join(process.cwd(), "playwright-audit-screenshots");

const publicRoutes = getPublicVisualAuditRoutes("en");
const drawerAuditRoutes = getPublicDrawerAuditRoutes("en");

const contextualCopyRoutes = new Set([
  "/en/objects",
  "/en/properties",
  "/en/services",
  "/en/events",
  "/en/matching",
  "/en/messages",
  "/en/exchange",
  "/en/blog",
]);

const bottomNavHrefs = new Set(["/en", "/en/explore", "/en/matching", "/en/messages", "/en/exchange"]);

const viewports = [
  { name: "desktop", width: 1440, height: 1100 },
  { name: "mobile", width: 390, height: 844 },
] as const;

function screenshotPath(viewportName: string, route: string) {
  const safeRoute = route.replace(/^\//, "").replace(/[^a-zA-Z0-9]+/g, "-") || "home";
  const folder = path.join(screenshotRoot, viewportName);
  mkdirSync(folder, { recursive: true });
  return path.join(folder, `${safeRoute}.png`);
}

async function assertPublicPageIsHealthy(page: Page, route: string) {
  const response = await page.goto(route, { waitUntil: "domcontentloaded" });
  const status = response?.status();

  expect(status, `${route} must return a HTTP response`).toBeDefined();
  expect(status, `${route} must not redirect to a missing page`).toBeLessThan(400);

  await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => undefined);

  await expect(page.locator("body"), `${route} body must be visible`).toBeVisible();
  await expect(page.locator("body"), `${route} must not render the Next.js 404`).not.toContainText(
    "This page could not be found",
  );
  await expect(page.locator("body"), `${route} must not render a generic application error`).not.toContainText(
    "Application error",
  );
  await expect(page.locator("body"), `${route} must not render a runtime error`).not.toContainText(
    "Unhandled Runtime Error",
  );
}

async function assertDrawerIsHealthy(page: Page, route: string) {
  const drawer = page.getByRole("dialog", { name: /side drawer/i });
  await expect(drawer, `${route} drawer must be visible after hamburger click`).toBeVisible();

  if (contextualCopyRoutes.has(route)) {
    await expect(drawer, `${route} drawer must expose contextual menu copy`).toContainText(/Context Menu|Menu contextual/i);
  }

  const drawerLinks = await drawer.locator("a[href]").evaluateAll((links) =>
    links
      .map((link) => link.getAttribute("href"))
      .filter((href): href is string => Boolean(href)),
  );

  for (const href of drawerLinks) {
    expect(bottomNavHrefs.has(href), `${route} drawer must not duplicate bottom nav href ${href}`).toBe(false);
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
          await page.screenshot({ path: filePath, fullPage: true, animations: "disabled" });
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
        await page.getByLabel("Open menu").first().click();
        await assertDrawerIsHealthy(page, route);

        const filePath = screenshotPath("drawer", route);
        await page.screenshot({ path: filePath, fullPage: true, animations: "disabled" });
        await testInfo.attach(`drawer-${route}`, {
          path: filePath,
          contentType: "image/png",
        });
      });
    }
  });
});
