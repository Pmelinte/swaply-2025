import { test, expect, type Locator, type Page } from "@playwright/test";

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

const PUBLIC_SHELL_ROUTES = PUBLIC_CANONICAL_ROUTES;

const LEGACY_ROUTE_REDIRECTS = [
  { label: "match", from: "/en/match", to: /\/en\/matching(?:[/?#]|$)/ },
  { label: "change", from: "/en/change", to: /\/en\/exchange(?:[/?#]|$)/ },
  { label: "items", from: "/en/items", to: /\/en\/objects(?:[/?#]|$)/ },
] as const;

const ADMIN_ROUTES = [
  { label: "canonical", path: "/en/admin/canonical" },
  { label: "flows", path: "/en/admin/flows" },
  { label: "live-data", path: "/en/admin/live-data" },
  { label: "matching-engine", path: "/en/admin/matching-engine" },
] as const;

const ADMIN_DIAGNOSTIC_ROUTE = { label: "diagnostic", path: "/en/admin/diagnostic" } as const;

const BRANCH_NAV_LINKS = [
  { label: "objects", href: "/en/objects", name: /Objects/i },
  { label: "properties", href: "/en/properties", name: /Properties/i },
  { label: "services", href: "/en/services", name: /Services/i },
  { label: "events", href: "/en/events", name: /Events/i },
] as const;

const BOTTOM_NAV_LINKS = [
  { label: "home", href: "/en", name: /Home/i },
  { label: "explore", href: "/en/explore", name: /Explore/i },
  { label: "matching", href: "/en/matching", name: /Matching/i },
  { label: "messages", href: "/en/messages", name: /Messages/i },
  { label: "exchange", href: "/en/exchange", name: /Exchange/i },
] as const;

const DRAWER_INFO_LINKS = [
  { label: "about", href: "/en/about", name: /About Swaply/i },
  { label: "blog", href: "/en/blog", name: /Blog/i },
  { label: "contact", href: "/en/contact", name: /Contact/i },
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

async function isVisible(locator: Locator) {
  return locator.first().isVisible({ timeout: 10_000 }).catch(() => false);
}

type LocatorScope = Page | Locator;

function linkByHref(scope: LocatorScope, href: string) {
  return scope.locator(`a[href="${href}"]`);
}

async function expectVisibleLink(scope: LocatorScope, href: string, name: RegExp, label: string) {
  const link = linkByHref(scope, href).filter({ hasText: name }).first();
  await expect(link, `${label} link (${href}) should be visible`).toBeVisible({ timeout: 10_000 });
}

async function expectPublicShell(page: Page) {
  await expect(
    page.locator('a[href="/en"][title="Swaply"]').first(),
    "Swaply top-logo home link should be visible",
  ).toBeVisible({ timeout: 10_000 });

  const drawerTrigger = page.getByRole("button", { name: "Open menu" });
  await expect(drawerTrigger, "drawer trigger should be visible").toBeVisible({ timeout: 10_000 });

  await expect(
    page.getByRole("link", { name: "Login" }).first(),
    "logged-out login CTA should be visible",
  ).toBeVisible({ timeout: 10_000 });

  const branchNav = page.getByRole("navigation", { name: "Branch navigation" });
  await expect(branchNav, "branch navigation should be visible").toBeVisible({ timeout: 10_000 });

  for (const link of BRANCH_NAV_LINKS) {
    await expectVisibleLink(branchNav, link.href, link.name, `branch nav ${link.label}`);
  }

  const bottomNav = page.getByRole("navigation", { name: "Main navigation" });
  await expect(bottomNav, "bottom navigation should be visible").toBeVisible({ timeout: 10_000 });

  for (const link of BOTTOM_NAV_LINKS) {
    await expectVisibleLink(bottomNav, link.href, link.name, `bottom nav ${link.label}`);
  }

  await drawerTrigger.click();
  const drawer = page.getByRole("dialog", { name: "Side drawer" });
  await expect(drawer, "side drawer should open").toBeVisible({ timeout: 10_000 });

  for (const link of DRAWER_INFO_LINKS) {
    await expectVisibleLink(drawer, link.href, link.name, `drawer ${link.label}`);
  }
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

test.describe("public shell contract", () => {
  for (const route of PUBLIC_SHELL_ROUTES) {
    test(`${route.label} renders global shell`, async ({ page }) => {
      const status = await gotoAndCapture(
        page,
        route.path,
        screenshotName("shell", route.path),
      );

      expect(status, `${route.path} returned HTTP ${status}`).toBeGreaterThanOrEqual(200);
      expect(status, `${route.path} returned HTTP ${status}`).toBeLessThan(400);

      await expectPublicShell(page);
    });
  }
});

test.describe("legacy route redirect contract", () => {
  for (const route of LEGACY_ROUTE_REDIRECTS) {
    test(`${route.label} redirects to canonical route`, async ({ page }) => {
      await gotoAndCapture(page, route.from, screenshotName("legacy", route.from));
      await expect(page).toHaveURL(route.to, { timeout: 10_000 });
    });
  }
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

test.describe("admin diagnostic route contract", () => {
  test("diagnostic is reachable or safely guarded", async ({ page }) => {
    const status = await gotoAndCapture(
      page,
      ADMIN_DIAGNOSTIC_ROUTE.path,
      screenshotName("admin", ADMIN_DIAGNOSTIC_ROUTE.path),
    );

    expect(
      status,
      `${ADMIN_DIAGNOSTIC_ROUTE.path} returned HTTP ${status}`,
    ).toBeGreaterThanOrEqual(200);
    expect(status, `${ADMIN_DIAGNOSTIC_ROUTE.path} returned HTTP ${status}`).toBeLessThan(500);

    await expect(page).toHaveURL(/\/en\/(?:admin\/diagnostic|login)(?:[/?#]|$)/, { timeout: 10_000 });

    const diagnosticVisible = await isVisible(page.getByText("Swaply diagnostic"));
    const guardVisible = await isVisible(
      page.getByText(/authenticate|access restricted|auth required|login|sign in/i),
    );

    expect(
      diagnosticVisible || guardVisible,
      "admin diagnostic must render either the diagnostic dashboard or a safe auth/access guard",
    ).toBe(true);
  });
});
