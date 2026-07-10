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
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);

  const termsCheckbox = page.getByRole("checkbox", { name: /terms.*gdpr/i });
  await termsCheckbox.check();
  await expect(termsCheckbox).toBeChecked();

  await page.locator('button[type="submit"]').click();

  await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });
  await page.context().storageState({ path: authFile });
}
