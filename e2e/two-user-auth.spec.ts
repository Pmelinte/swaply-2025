import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { userAAuthFile, userBAuthFile } from "./two-user-auth.setup";

function requiredEmail(name: "E2E_USER_A_EMAIL" | "E2E_USER_B_EMAIL"): string {
  const email = process.env[name];
  if (!email) throw new Error(`${name} is required.`);
  return email;
}

test.describe("Train C two-user authenticated baseline", () => {
  test("dedicated sessions are distinct and both can open the profile route", async ({ browser }) => {
    const stateA = JSON.parse(readFileSync(userAAuthFile, "utf8"));
    const stateB = JSON.parse(readFileSync(userBAuthFile, "utf8"));
    const userAEmail = requiredEmail("E2E_USER_A_EMAIL");
    const userBEmail = requiredEmail("E2E_USER_B_EMAIL");

    expect(JSON.stringify(stateA)).not.toBe(JSON.stringify(stateB));

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

    await pageA.getByRole("button", { name: "Account & Settings", exact: true }).click();
    await pageB.getByRole("button", { name: "Account & Settings", exact: true }).click();

    const currentEmailA = pageA.locator("p").filter({ hasText: "Current email:" });
    const currentEmailB = pageB.locator("p").filter({ hasText: "Current email:" });

    await expect(currentEmailA).toContainText(userAEmail);
    await expect(currentEmailB).toContainText(userBEmail);
    await expect(currentEmailA).not.toContainText(userBEmail);
    await expect(currentEmailB).not.toContainText(userAEmail);

    await contextA.close();
    await contextB.close();
  });

  test("guest requests cannot read authenticated account APIs", async ({ request }) => {
    const balance = await request.get("/api/tokens/balance");
    expect(balance.status()).toBe(401);

    const history = await request.get("/api/tokens/history");
    expect(history.status()).toBe(401);
  });

  test("guest profile requests redirect to login without private profile controls", async ({ page }) => {
    await page.goto("/en/profile", { waitUntil: "networkidle" });

    await expect(page).toHaveURL(/\/en\/login\?returnTo=%2Fprofile/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /save profile/i })).toHaveCount(0);
  });

  test("authenticated user can log out and returns to the login page", async ({ browser }) => {
    const context = await browser.newContext({ storageState: userAAuthFile });
    const page = await context.newPage();

    await page.goto("/en/profile", { waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/en\/profile/);

    await page.getByRole("button", { name: "Profile & Settings", exact: true }).click();
    await page.getByRole("menuitem", { name: "Logout", exact: true }).click();

    await expect(page).toHaveURL(/\/en\/login/);
    await expect(page.locator('input[type="email"]')).toBeVisible();

    await context.close();
  });
});
