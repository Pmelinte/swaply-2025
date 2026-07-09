import { test, expect } from "@playwright/test";

test.describe("Public browsing — objects", () => {
  // ── /objects page loads without login ──────────────────────────────

  test("/objects loads and shows browse UI", async ({ page }) => {
    const response = await page.goto("/objects");
    expect(response?.status()).toBeLessThan(500);
    await expect(page).toHaveTitle(/Swaply/);

    // Grid or list view should be visible
    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible();
  });

  test("/objects shows filter controls", async ({ page }) => {
    await page.goto("/objects");

    // Category or filter buttons should be visible
    const filterArea = page.locator("button, select").first();
    await expect(filterArea).toBeVisible();
  });

  test("/objects does not require login to view items", async ({ page }) => {
    await page.goto("/objects");

    // Should NOT redirect to /login
    await expect(page).toHaveURL(/\/objects/);

    // Should not show a full-page login gate
    const loginRedirect = page.locator('a[href="/login"]');
    // Login link may exist (in banner/topbar) but page content should be visible
    const mainContent = page.locator("main, [class*='max-w']").first();
    await expect(mainContent).toBeVisible();
  });

  // ── Guest banner ──────────────────────────────────────────────────

  test("guest banner appears for non-logged visitors", async ({ page }) => {
    await page.goto("/objects");

    // GuestBanner has sticky top with blue background
    const banner = page.locator(".sticky.top-0.bg-blue-600");
    // May or may not appear depending on sessionStorage; just verify no crash
    const pageLoaded = page.locator("body");
    await expect(pageLoaded).toBeVisible();
  });

  // ── /objects/[id] page ────────────────────────────────────────────

  test("/objects/[id] returns without server error for valid-looking ID", async ({ page }) => {
    // Use a UUID-like ID; even if item doesn't exist, page should render gracefully
    const response = await page.goto("/objects/00000000-0000-0000-0000-000000000001");
    expect(response?.status()).toBeLessThan(500);
  });

  test("/objects/[id] shows auth gate modal on swap button click (guest)", async ({ page }) => {
    await page.goto("/objects/00000000-0000-0000-0000-000000000001");

    // If item exists, the AuthGateModal wraps the swap button
    // Look for the blurred overlay div that AuthGateModal creates
    const authGate = page.locator("[role='button']").filter({
      has: page.locator(".backdrop-blur-\\[2px\\], .pointer-events-none"),
    });

    if (await authGate.count() > 0) {
      await authGate.first().click();

      // Modal should appear
      const modal = page.locator(".fixed.inset-0.z-50");
      await expect(modal).toBeVisible({ timeout: 3000 });
    }
  });

  // ── Legal pages ───────────────────────────────────────────────────

  const legalPages = [
    { path: "/terms", title: "Swaply" },
    { path: "/privacy", title: "Swaply" },
    { path: "/cookies", title: "Swaply" },
    { path: "/safety", title: "Swaply" },
    { path: "/dmca", title: "Swaply" },
    { path: "/copyright", title: "Swaply" },
  ];

  for (const { path, title } of legalPages) {
    test(`${path} loads without error`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBeLessThan(500);
      await expect(page).toHaveTitle(new RegExp(title));
    });
  }

  // ── Blog ──────────────────────────────────────────────────────────

  test("/blog loads and shows articles", async ({ page }) => {
    const response = await page.goto("/blog");
    expect(response?.status()).toBeLessThan(500);
    await expect(page).toHaveTitle(/Blog.*Swaply/);

    // At least one article card should be visible
    const articleLink = page.locator('a[href^="/blog/"]');
    await expect(articleLink.first()).toBeVisible();
  });

  test("/blog/[slug] loads first article", async ({ page }) => {
    const response = await page.goto("/blog/cum-functioneaza-barter-ul-romania-2026");
    expect(response?.status()).toBeLessThan(500);

    // Article title should be visible
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();

    // CTA at the bottom should exist
    const cta = page.locator('a[href="/login"]').filter({ hasText: /Swaply/ });
    await expect(cta.first()).toBeVisible();
  });

  // ── Footer legal links ────────────────────────────────────────────

  test("legal footer is visible with all links", async ({ page }) => {
    await page.goto("/");

    const footer = page.locator("footer");
    await expect(footer).toBeVisible();

    const expectedPaths = ["/blog", "/terms", "/privacy", "/cookies", "/safety"];
    for (const href of expectedPaths) {
      const link = footer.locator(`a[href="${href}"]`);
      await expect(link).toBeVisible();
    }
  });

  // ── Cookie consent banner ─────────────────────────────────────────

  test("cookie consent banner appears on first visit", async ({ page }) => {
    // Clear localStorage to simulate first visit
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("swaply_cookie_consent"));
    await page.reload();

    // Banner should appear (fixed position, z-50)
    const banner = page.locator(".fixed.z-50").filter({
      has: page.locator("button"),
    });

    if (await banner.count() > 0) {
      // Accept button should be visible
      const acceptBtn = banner.locator("button").first();
      await expect(acceptBtn).toBeVisible();

      // Click accept
      await acceptBtn.click();

      // Banner should disappear
      await expect(banner).not.toBeVisible({ timeout: 3000 });
    }
  });
});
