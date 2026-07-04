import { test as setup, expect } from "@playwright/test";
import path from "path";

/**
 * Authentication setup — runs once before authenticated tests.
 *
 * Required env vars:
 *   E2E_TEST_EMAIL    — email of a pre-existing Supabase user
 *   E2E_TEST_PASSWORD — password for that user
 *
 * Optional env vars:
 *   E2E_BASE_URL      — deployed site URL; if absent Playwright starts local dev server
 */

const authFile = path.join(__dirname, ".auth", "user.json");

setup("authenticate via login page", async ({ page }) => {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;

  if (!email || !password) {
    setup.skip(true, "E2E_TEST_EMAIL and E2E_TEST_PASSWORD are required for authenticated Playwright tests.");
    return;
  }

  await page.goto("/login", { waitUntil: "domcontentloaded" });

  const checkbox = page.locator('input[type="checkbox"]').first();
  if (await checkbox.isVisible().catch(() => false)) {
    await checkbox.check();
  }

  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();

  await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 });
  await page.context().storageState({ path: authFile });
});
