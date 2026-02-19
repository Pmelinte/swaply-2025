import { test, expect } from "@playwright/test";

test.describe("Login page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  // ── Page load ───────────────────────────────────────────────────────

  test("renders the login form with email and password fields", async ({
    page,
  }) => {
    // The page should contain an email input and a password input
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test("renders a submit button", async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
  });

  test("renders the terms acceptance checkbox", async ({ page }) => {
    const checkbox = page.locator('input[type="checkbox"]');
    await expect(checkbox).toBeVisible();
  });

  // ── Tab switching ───────────────────────────────────────────────────

  test("has login, register, and reset tabs", async ({ page }) => {
    // The three tab buttons are rendered as regular buttons inside the form card.
    // They use rounded-full styling. We look for exactly 3 tab-like buttons
    // before the <form> element.
    const tabs = page.locator("button.rounded-full").filter({
      has: page.locator("text=/./"),
    });

    // There should be at least 3 tab buttons (login, register, reset)
    // plus the submit button, so we check the first three are visible.
    const tabCount = await tabs.count();
    expect(tabCount).toBeGreaterThanOrEqual(3);
  });

  test("switching to register tab still shows email and password fields", async ({
    page,
  }) => {
    // The tabs are buttons with rounded-full class. The second tab is "register".
    // We click the second tab-like button in the card header area.
    const allRoundedButtons = page.locator("button.rounded-full");
    // The second button (index 1) is the register tab
    await allRoundedButtons.nth(1).click();

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator(
      'input[type="password"], input[type="text"]',
    );

    await expect(emailInput).toBeVisible();
    // Password field should still be present (may be type="text" if show-password is toggled)
    await expect(passwordInput.first()).toBeVisible();
  });

  test("switching to reset tab hides the password field", async ({ page }) => {
    // The third tab (index 2) is the "reset password" tab
    const allRoundedButtons = page.locator("button.rounded-full");
    await allRoundedButtons.nth(2).click();

    // Email should still be visible
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();

    // Password field should NOT be visible on the reset tab
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toHaveCount(0);
  });

  // ── Form validation ─────────────────────────────────────────────────

  test("shows error when submitting without accepting terms", async ({
    page,
  }) => {
    // Fill in email and password but leave checkbox unchecked
    await page.locator('input[type="email"]').fill("test@example.com");
    await page.locator('input[type="password"]').fill("password123");

    await page.locator('button[type="submit"]').click();

    // Should show an error message about accepting terms
    const errorBanner = page.locator(".bg-red-50, .dark\\:bg-red-900\\/40");
    await expect(errorBanner).toBeVisible({ timeout: 5_000 });
  });

  test("shows error when submitting with empty email", async ({ page }) => {
    // Check the terms checkbox first
    await page.locator('input[type="checkbox"]').check();
    // Fill password but leave email empty
    await page.locator('input[type="password"]').fill("password123");

    await page.locator('button[type="submit"]').click();

    // Should show an error about email
    const errorBanner = page.locator(".bg-red-50, .dark\\:bg-red-900\\/40");
    await expect(errorBanner).toBeVisible({ timeout: 5_000 });
  });

  test("shows error when password is too short", async ({ page }) => {
    // Accept terms, fill email, use a short password
    await page.locator('input[type="checkbox"]').check();
    await page.locator('input[type="email"]').fill("test@example.com");
    await page.locator('input[type="password"]').fill("ab");

    await page.locator('button[type="submit"]').click();

    // Should show an error about password length (min 6)
    const errorBanner = page.locator(".bg-red-50, .dark\\:bg-red-900\\/40");
    await expect(errorBanner).toBeVisible({ timeout: 5_000 });
  });

  // ── Password strength indicator ────────────────────────────────────

  test("shows password strength indicator on register tab when typing", async ({
    page,
  }) => {
    // Switch to register tab (second tab)
    const allRoundedButtons = page.locator("button.rounded-full");
    await allRoundedButtons.nth(1).click();

    // Type a password to trigger the strength indicator
    await page.locator('input[type="password"]').fill("StrongP@ss1");

    // The strength indicator consists of colored bars (h-1.5 rounded-full divs)
    // and a text label underneath
    const strengthBars = page.locator("div.h-1\\.5.rounded-full");
    await expect(strengthBars.first()).toBeVisible();

    // There should be exactly 4 strength bar segments
    await expect(strengthBars).toHaveCount(4);
  });

  test("password strength indicator is NOT visible on login tab", async ({
    page,
  }) => {
    // Stay on the default login tab and type a password
    await page.locator('input[type="password"]').fill("StrongP@ss1");

    // Strength bars should NOT appear on the login tab
    const strengthBars = page.locator("div.h-1\\.5.rounded-full");
    await expect(strengthBars).toHaveCount(0);
  });
});
