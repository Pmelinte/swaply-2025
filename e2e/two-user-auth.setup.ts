import { expect, type Page } from "@playwright/test";
import path from "path";

export const userAAuthFile = path.join(__dirname, ".auth", "user-a.json");
export const userBAuthFile = path.join(__dirname, ".auth", "user-b.json");

export async function authenticateAndSave(
  page: Page,
  email: string | undefined,
  password: string | undefined,
  authFile: string,
  label: string,
) {
  if (!email || !password) {
    throw new Error(
      `${label} credentials are required. Configure the matching E2E_USER_* GitHub secrets or local environment variables.`,
    );
  }

  await page.goto("/en/login");

  const checkbox = page.locator('input[type="checkbox"]');
  if (await checkbox.count()) {
    await checkbox.check();
  }

  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();

  await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });
  await page.context().storageState({ path: authFile });
}
