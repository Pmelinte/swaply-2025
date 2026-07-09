import { test, expect, type Page } from "@playwright/test";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

const PUBLIC_CANONICAL_ROUTES = [
  { label: "home", path: "/en" },
  { label: "objects", path: "/en/objects" },
  { label: "explore", path: "/en/explore" },
  { label: "matching", path: "/en/matching" },
  { label: "messages", path: "/en/messages" },
  { label: "exchange", path: "/en/exchange" },
  { label: "chat", path: "/en/chat" },
  { label: "properties", path: "/en/properties" },
  { label: "services", path: "/en/services" },
  { label: "events", path: "/en/events" },
  { label: "blog", path: "/en/blog" },
  { label: "about", path: "/en/about" },
  { label: "contact", path: "/en/contact" },
] as const;

const LEGACY_ROUTE_REDIRECTS = [
  { label: "match", from: "/en/match", to: /\/en\/matching(?:[/?#]|$)/ },
  { label: "change", from: "/en/change", to: /\/en\/exchange(?:[/?#]|$)/ },
] as const;

const ADMIN_ROUTES = [
  { label: "canonical", path: "/en/admin/canonical" },
  { label: "flows", path: "/en/admin/flows" },
  { label: "live-data", path: "/en/admin/live-data" },
  { label: "matching-engine", path: "/en/admin/matching-engine" },
] as const;

function screenshotName(prefix: string, routePath: string) {
  const routeLabel = routePath.replace(/^\/en\/?/, "") || "home";
  return `test-results/${prefix}-${routeLabel.replaceAll("/", "-")}.png`;
}

async function gotoAndCapture(page: Page, routePath: string, screenshotPath: string) {
  let status = 0;

  try {
    const response = await page.goto(`${BASE_URL}${routePath}`, { waitUntil: "domcontentloaded" });
    status = response?.status() ?? 0;
  } finally {
    await page.screenshot({ path: screenshotPath, fullPage: true });
  }

  return status;
}

test.use({ viewport: { width: 1280, height: 800 } });

test.describe("public route contract", () => {
  for (const route of PUBLIC_CANONICAL_ROUTES) {
    test(`${route.label} responds below 400`, async ({ page }) => {
      const status = await gotoAndCapture(
        page,
        route.path,
        screenshotName("public", route.path),
      );

      expect(status, `${route.path} returned HTTP ${status}`).toBeGreaterThanOrEqual(200);
      expect(status, `${route.path} returned HTTP ${status}`).toBeLessThan(400);
    });
  }
});

test.describe("legacy route redirect contract", () => {
  for (const route of LEGACY_ROUTE_REDIRECTS) {
    test(`${route.from} redirects to canonical route`, async ({ page }) => {
      await gotoAndCapture(page, route.from, screenshotName("legacy", route.from));
      await expect(page).toHaveURL(route.to, { timeout: 10_000 });
    });
  }

  test.fixme("/en/items should redirect to /en/objects", async ({ page }) => {
    await gotoAndCapture(page, "/en/items", screenshotName("legacy-known-gap", "/en/items"));
    await expect(page).toHaveURL(/\/en\/objects(?:[/?#]|$)/);
  });
});

test.describe("admin route guardrails", () => {
  for (const route of ADMIN_ROUTES) {
    test(`${route.label} does not server-error`, async ({ page }) => {
      const status = await gotoAndCapture(
        page,
        route.path,
        screenshotName("admin", route.path),
      );

      expect(status, `${route.path} returned HTTP ${status}`).toBeLessThan(500);
    });
  }
});
