import { test, expect } from "@playwright/test";

test.describe("Navigation — public pages", () => {
  // ── Page accessibility ──────────────────────────────────────────────
  // These pages should be reachable without authentication.

  const publicPages = [
    { path: "/login", titleFragment: "Swaply" },
    { path: "/info", titleFragment: "Swaply" },
    { path: "/feedback", titleFragment: "Swaply" },
    { path: "/objects", titleFragment: "Swaply" },
  ];

  for (const { path, titleFragment } of publicPages) {
    test(`${path} loads successfully`, async ({ page }) => {
      const response = await page.goto(path);
      // Should not be a server error
      expect(response?.status()).toBeLessThan(500);
      // Page title should contain the app name
      await expect(page).toHaveTitle(new RegExp(titleFragment));
    });
  }

  // ── TopBar ──────────────────────────────────────────────────────────

  test("TopBar is visible with Swaply logo link", async ({ page }) => {
    await page.goto("/");
    // The TopBar contains a link to "/" with the Swaply logo
    const logoLink = page.locator('a[href="/"][title="Swaply"]');
    await expect(logoLink).toBeVisible();
  });

  test("TopBar logo navigates to home", async ({ page }) => {
    await page.goto("/login");
    const logoLink = page.locator('a[href="/"][title="Swaply"]');
    await logoLink.click();
    await expect(page).toHaveURL("/");
  });

  test("TopBar shows login link when not authenticated", async ({ page }) => {
    await page.goto("/");
    // When logged out, the TopBar shows a "Login" link/button
    const loginLink = page.locator('a[href="/login"]');
    await expect(loginLink).toBeVisible();
  });

  // ── FooterNav (bottom navigation bar) ──────────────────────────────

  test("FooterNav is visible with all navigation links", async ({ page }) => {
    await page.goto("/");
    const footerNav = page.locator("nav.sticky.bottom-0");
    await expect(footerNav).toBeVisible();

    // The footer nav should have links to all 5 main sections
    const expectedHrefs = ["/", "/objects", "/match", "/chat", "/change"];
    for (const href of expectedHrefs) {
      const link = footerNav.locator(`a[href="${href}"]`);
      await expect(link).toBeVisible();
    }
  });

  test("FooterNav highlights the active page", async ({ page }) => {
    await page.goto("/objects");
    const footerNav = page.locator("nav.sticky.bottom-0");
    const objectsLink = footerNav.locator('a[href="/objects"]');
    // The active link should have the blue highlight class
    await expect(objectsLink).toHaveClass(/bg-blue-50|text-blue-700/);
  });

  test("clicking FooterNav link navigates to that page", async ({ page }) => {
    await page.goto("/");
    const footerNav = page.locator("nav.sticky.bottom-0");
    const objectsLink = footerNav.locator('a[href="/objects"]');
    await objectsLink.click();
    await expect(page).toHaveURL("/objects");
  });

  // ── Language selector ───────────────────────────────────────────────

  test("language selector dropdown opens on click", async ({ page }) => {
    await page.goto("/");
    // The language button contains an uppercase language code and a chevron
    const langButton = page.locator("button").filter({ hasText: /^[A-Z]{2}$/ });
    // If there's no exact match, fall back to the button with the flag image
    const langTrigger = langButton.or(
      page.locator("button").filter({ has: page.locator("img[src*='flag']") }),
    );
    await langTrigger.first().click();

    // The dropdown should appear with a search input
    const dropdown = page.locator("input[type='text']").first();
    await expect(dropdown).toBeVisible();
  });
});

test.describe("Navigation — authenticated pages", () => {
  // These tests run in the "chromium-auth" project with saved session state.

  const authPages = [
    { path: "/my-objects", description: "My objects page" },
    { path: "/profile", description: "Profile settings" },
    { path: "/objects/new", description: "Create new item" },
    { path: "/match", description: "AI matching page" },
    { path: "/chat", description: "Chat / messaging" },
  ];

  for (const { path, description } of authPages) {
    test(`${description} (${path}) loads for authenticated user @auth`, async ({
      page,
    }) => {
      await page.goto(path);
      // Should not redirect to login (when authenticated)
      await expect(page).toHaveURL(path);
    });
  }
});
