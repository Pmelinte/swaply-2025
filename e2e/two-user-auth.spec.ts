import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import {
  authenticateAndSave,
  expectAuthenticatedSession,
  userAAuthFile,
  userBAuthFile,
} from "./two-user-auth.setup";

type RequiredCredential =
  | "E2E_USER_A_EMAIL"
  | "E2E_USER_A_PASSWORD"
  | "E2E_USER_B_EMAIL"
  | "E2E_USER_B_PASSWORD";

function requiredCredential(name: RequiredCredential): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

async function restoreReusableUserBSession(page: Page, email: string, password: string) {
  const currentSession = await page.request.get("/api/tokens/balance");

  if (currentSession.status() === 200) {
    await page.context().storageState({ path: userBAuthFile });
    return;
  }

  await authenticateAndSave(page, email, password, userBAuthFile, "User B");
}

test.describe("Train C two-user authenticated baseline", () => {
  test.describe.configure({ mode: "serial" });

  test("dedicated sessions are distinct and both can open the profile route", async ({ browser }) => {
    const stateA = JSON.parse(readFileSync(userAAuthFile, "utf8"));
    const stateB = JSON.parse(readFileSync(userBAuthFile, "utf8"));
    const userAEmail = requiredCredential("E2E_USER_A_EMAIL");
    const userBEmail = requiredCredential("E2E_USER_B_EMAIL");

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

  test("authenticated user can log out and loses protected access without invalidating later suites", async ({
    browser,
  }, testInfo) => {
    test.setTimeout(120_000);

    const userBEmail = requiredCredential("E2E_USER_B_EMAIL");
    const userBPassword = requiredCredential("E2E_USER_B_PASSWORD");
    const context = await browser.newContext({ storageState: userBAuthFile });
    const page = await context.newPage();

    let logoutTriggered = false;
    let primaryError: unknown | null = null;

    try {
      await page.goto("/en/profile", { waitUntil: "networkidle" });
      await expect(page).toHaveURL(/\/en\/profile/);
      await expectAuthenticatedSession(page, "User B before logout");

      await page.getByRole("button", { name: "Profile & Settings", exact: true }).click();
      logoutTriggered = true;
      await page.getByRole("menuitem", { name: "Logout", exact: true }).click();

      await expect(page.getByRole("link", { name: "Login", exact: true })).toBeVisible();
      await expect
        .poll(async () => (await context.request.get("/api/tokens/balance")).status(), {
          timeout: 30_000,
        })
        .toBe(401);

      await page.goto("/en/profile", { waitUntil: "networkidle" });
      await expect(page).toHaveURL(/\/en\/login\?returnTo=%2Fprofile/);
      await expect(page.locator('input[type="email"]')).toBeVisible();
    } catch (error) {
      primaryError = error;
    }

    let restoreError: unknown | null = null;

    if (logoutTriggered) {
      try {
        await test.step("restore the reusable User B fixture", async () => {
          await restoreReusableUserBSession(page, userBEmail, userBPassword);
          await expectAuthenticatedSession(page, "User B after fixture restore");
        });
      } catch (error) {
        restoreError = error;
      }
    }

    await context.close();

    if (primaryError !== null) {
      if (restoreError !== null) {
        await testInfo.attach("user-b-session-restore-error", {
          body:
            restoreError instanceof Error
              ? restoreError.stack ?? restoreError.message
              : String(restoreError),
          contentType: "text/plain",
        });
      }

      throw primaryError;
    }

    if (restoreError !== null) throw restoreError;
  });
});
