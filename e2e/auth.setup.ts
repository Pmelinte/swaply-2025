import { test as setup, expect } from "@playwright/test";
import path from "path";

/**
 * Authentication setup — runs once before all authenticated tests.
 *
 * Logs in via the UI using E2E_TEST_EMAIL / E2E_TEST_PASSWORD env vars,
 * then saves the browser storage state (cookies + localStorage) so that
 * subsequent tests can reuse the session without logging in again.
 *
 * Required env vars:
 *   E2E_TEST_EMAIL    — email of a pre-existing Supabase user
 *   E2E_TEST_PASSWORD — password for that user
 */

const authFile = path.join(__dirname, ".auth", "user.json");

setup("authenticate via login page", async ({ page }) => {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "E2E_TEST_EMAIL and E2E_TEST_PASSWORD env vars are required for auth setup.\n" +
        "Create a test user in Supabase and set these in .env.local or your CI environment.",
    );
  }

  // Navigate to login page
  await page.goto("/login");

  // Accept terms checkbox
  const checkbox = page.locator('input[type="checkbox"]');
  await checkbox.check();

  // Fill credentials
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);

  // Submit
  await page.locator('button[type="submit"]').click();

  // Wait for successful login — user should be redirected away from /login
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });

  // Save signed-in state
  await page.context().storageState({ path: authFile });
});
