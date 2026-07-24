import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import {
  authenticateAndSave,
  expectAuthenticatedSession,
  userAAuthFile,
  userBAuthFile,
} from "./two-user-auth.setup";

async function profileUrl(page: Page, tab: "profil" | "cont" = "profil") {
  const locale = new URL(page.url()).pathname.split("/").filter(Boolean)[0] || "en";
  return `/${locale}/profile?tab=${tab}`;
}

async function openProfileMenu(page: Page) {
  const trigger = page.getByTestId("profile-menu-trigger");
  const settings = page.getByTestId("profile-menu-settings");

  await expect(trigger).toBeVisible({ timeout: 20_000 });
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(settings).toBeVisible();
}

async function openAccountTab(page: Page, email: string, label: string) {
  await page.goto(await profileUrl(page, "cont"), { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/[a-z-]+\/profile\?tab=cont/);
  await expectAuthenticatedSession(page, label);

  const currentEmail = page.getByTestId("profile-current-email");
  try {
    await expect(currentEmail).toContainText(email, { timeout: 20_000 });
  } catch {
    await page.reload({ waitUntil: "domcontentloaded" });
    await expectAuthenticatedSession(page, `${label} after account-tab reload`);
    await expect(currentEmail).toContainText(email, { timeout: 20_000 });
  }

  return currentEmail;
}

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

async function ensureReusableSession(
  page: Page,
  email: string,
  password: string,
  authFile: string,
  label: string,
) {
  const currentSession = await page.request.get("/api/tokens/balance");

  if (currentSession.status() !== 200) {
    await authenticateAndSave(page, email, password, authFile, label);
  } else {
    await page.context().storageState({ path: authFile });
  }

  await page.goto("/en/profile?tab=profil", { waitUntil: "domcontentloaded" });
  await expectAuthenticatedSession(page, label);

  const profileMenu = page.getByTestId("profile-menu-trigger");

  try {
    await expect(profileMenu).toBeVisible({ timeout: 20_000 });
  } catch {
    await page.reload({ waitUntil: "domcontentloaded" });
    await expectAuthenticatedSession(page, `${label} after hydration reload`);
    await expect(profileMenu).toBeVisible({ timeout: 20_000 });
  }

  await page.context().storageState({ path: authFile });
}

test.describe("Train C two-user authenticated baseline", () => {
  test.describe.configure({ mode: "serial" });

  test("dedicated sessions are distinct and both can open the profile route", async ({
    browser,
  }) => {
    test.setTimeout(120_000);

    const stateA = JSON.parse(readFileSync(userAAuthFile, "utf8"));
    const stateB = JSON.parse(readFileSync(userBAuthFile, "utf8"));
    const userAEmail = requiredCredential("E2E_USER_A_EMAIL");
    const userAPassword = requiredCredential("E2E_USER_A_PASSWORD");
    const userBEmail = requiredCredential("E2E_USER_B_EMAIL");
    const userBPassword = requiredCredential("E2E_USER_B_PASSWORD");

    expect(JSON.stringify(stateA)).not.toBe(JSON.stringify(stateB));

    const contextA = await browser.newContext({ storageState: stateA });
    const contextB = await browser.newContext({ storageState: stateB });

    try {
      const pageA = await contextA.newPage();
      const pageB = await contextB.newPage();

      await ensureReusableSession(
        pageA,
        userAEmail,
        userAPassword,
        userAAuthFile,
        "User A baseline",
      );
      await ensureReusableSession(
        pageB,
        userBEmail,
        userBPassword,
        userBAuthFile,
        "User B baseline",
      );

      await expect(pageA).toHaveURL(/\/[a-z-]+\/profile/);
      await expect(pageB).toHaveURL(/\/[a-z-]+\/profile/);
      await expect(pageA.locator('input[type="email"]')).toHaveCount(0);
      await expect(pageB.locator('input[type="email"]')).toHaveCount(0);

      await openProfileMenu(pageA);
      await pageA.keyboard.press("Escape");
      await expect(pageA.getByTestId("profile-menu-trigger")).toHaveAttribute(
        "aria-expanded",
        "false",
      );
      await openProfileMenu(pageB);

      const currentEmailA = await openAccountTab(pageA, userAEmail, "User A account tab");
      const currentEmailB = await openAccountTab(pageB, userBEmail, "User B account tab");

      await expect(currentEmailA).not.toContainText(userBEmail);
      await expect(currentEmailB).not.toContainText(userAEmail);
    } finally {
      await Promise.all([
        contextA.close().catch(() => undefined),
        contextB.close().catch(() => undefined),
      ]);
    }
  });

  test("guest requests cannot read authenticated account APIs", async ({
    request,
  }) => {
    const balance = await request.get("/api/tokens/balance");
    expect(balance.status()).toBe(401);

    const history = await request.get("/api/tokens/history");
    expect(history.status()).toBe(401);
  });

  test("guest profile requests redirect to login without private profile controls", async ({
    page,
  }) => {
    await page.goto("/en/profile", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/en\/login\?returnTo=%2Fprofile/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /save profile/i })).toHaveCount(
      0,
    );
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
      await ensureReusableSession(
        page,
        userBEmail,
        userBPassword,
        userBAuthFile,
        "User B before logout",
      );

      await openProfileMenu(page);
      logoutTriggered = true;
      await page.getByTestId("profile-menu-logout").click();

      await expect
        .poll(
          async () =>
            (await context.request.get("/api/tokens/balance")).status(),
          { timeout: 30_000 },
        )
        .toBe(401);

      await page.goto("/en/profile", { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(/\/en\/login\?returnTo=%2Fprofile/);
      await expect(page.locator('input[type="email"]')).toBeVisible();
    } catch (error) {
      primaryError = error;
    }

    let restoreError: unknown | null = null;

    if (logoutTriggered) {
      try {
        await test.step("restore the reusable User B fixture", async () => {
          await ensureReusableSession(
            page,
            userBEmail,
            userBPassword,
            userBAuthFile,
            "User B after fixture restore",
          );
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
