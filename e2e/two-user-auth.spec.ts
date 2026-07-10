import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { userAAuthFile, userBAuthFile } from "./two-user-auth.setup";

function emailsFromStorageState(storageState: unknown): string[] {
  const state = storageState as {
    origins?: Array<{
      localStorage?: Array<{ name: string; value: string }>;
    }>;
  };

  return (state.origins ?? [])
    .flatMap((origin) => origin.localStorage ?? [])
    .flatMap((entry) => {
      try {
        const parsed = JSON.parse(entry.value) as { user?: { email?: unknown } };
        return typeof parsed.user?.email === "string" ? [parsed.user.email] : [];
      } catch {
        return [];
      }
    });
}

test.describe("Train C two-user authenticated baseline", () => {
  test("dedicated sessions are distinct and both can open the profile route", async ({ browser }) => {
    const stateA = JSON.parse(readFileSync(userAAuthFile, "utf8"));
    const stateB = JSON.parse(readFileSync(userBAuthFile, "utf8"));

    expect(JSON.stringify(stateA)).not.toBe(JSON.stringify(stateB));
    expect(emailsFromStorageState(stateA)).toContain(process.env.E2E_USER_A_EMAIL);
    expect(emailsFromStorageState(stateB)).toContain(process.env.E2E_USER_B_EMAIL);
    expect(emailsFromStorageState(stateA)).not.toContain(process.env.E2E_USER_B_EMAIL);
    expect(emailsFromStorageState(stateB)).not.toContain(process.env.E2E_USER_A_EMAIL);

    const contextA = await browser.newContext({ storageState: stateA });
    const contextB = await browser.newContext({ storageState: stateB });

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await pageA.goto("/en/profile", { waitUntil: "networkidle" });
    await pageB.goto("/en/profile", { waitUntil: "networkidle" });

    await expect(pageA).toHaveURL(/\/en\/profile/);
    await expect(pageB).toHaveURL(/\/en\/profile/);
    await expect(pageA.locator('input[type="email"]')).toHaveCount(0);
    await expect(pageB.locator('input[type="email"]')).toHaveCount(0);

    await contextA.close();
    await contextB.close();
  });

  test("guest requests cannot read authenticated account APIs", async ({ request }) => {
    const balance = await request.get("/api/tokens/balance");
    expect(balance.status()).toBe(401);

    const history = await request.get("/api/tokens/history");
    expect(history.status()).toBe(401);
  });

  test("guest profile view does not expose private profile editing controls", async ({ page }) => {
    await page.goto("/en/profile", { waitUntil: "networkidle" });

    await expect(page).toHaveURL(/\/en\/profile/);
    await expect(page.getByRole("link", { name: /login/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /save profile/i })).toHaveCount(0);
    await expect(page.locator('input[type="email"]')).toHaveCount(0);
  });

  test("authenticated user can log out and returns to the login page", async ({ browser }) => {
    const context = await browser.newContext({ storageState: userAAuthFile });
    const page = await context.newPage();

    await page.goto("/en/profile", { waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/en\/profile/);

    await page.getByRole("button", { name: /profile/i }).click();
    await page.getByRole("menuitem", { name: /logout/i }).click();

    await expect(page).toHaveURL(/\/en\/login/);
    await expect(page.locator('input[type="email"]')).toBeVisible();

    await context.close();
  });
});
