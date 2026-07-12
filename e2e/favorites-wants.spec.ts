import { expect, test, type Page, type Response } from "@playwright/test";
import { readFileSync } from "node:fs";
import {
  expectAuthenticatedSession,
  userAAuthFile,
  userBAuthFile,
} from "./two-user-auth.setup";

const wantedPath = "/en/wanted";
const profilePath = "/en/profile";
const actionTimeout = 20_000;

function readStorageState(path: string) {
  return JSON.parse(readFileSync(path, "utf8"));
}

async function expectReusableSession(page: Page, label: string) {
  await page.goto(profilePath, { waitUntil: "domcontentloaded" });
  await expect
    .poll(() => new URL(page.url()).pathname, { timeout: actionTimeout })
    .toBe(profilePath);
  await expectAuthenticatedSession(page, label);
}

function isWantedCreateResponse(response: Response) {
  const request = response.request();
  const url = new URL(response.url());
  return request.method() === "POST" && url.pathname === "/api/wanted";
}

async function openWanted(page: Page) {
  await page.goto(wantedPath, { waitUntil: "domcontentloaded" });
  await expect
    .poll(() => new URL(page.url()).pathname, { timeout: actionTimeout })
    .toBe(wantedPath);
  await expect(page.getByRole("button", { name: "Post Request", exact: true })).toBeVisible({
    timeout: actionTimeout,
  });
}

test.describe("Train C Batch 53 favorites and wants", () => {
  test.describe.configure({ retries: 0 });

  test("wanted request is public only while active and remains owner-controlled", async ({
    browser,
  }, testInfo) => {
    test.setTimeout(180_000);

    const contextA = await browser.newContext({ storageState: readStorageState(userAAuthFile) });
    const contextB = await browser.newContext({ storageState: readStorageState(userBAuthFile) });
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    const suffix = `${Date.now()}-${testInfo.workerIndex}`;
    const title = `Batch 53 wanted ${suffix}`;
    const description = "Batch 53 verifies public visibility and owner-only lifecycle controls.";
    let requestId: string | null = null;
    let primaryError: unknown = null;

    try {
      await test.step("verify reusable sessions", async () => {
        await expectReusableSession(pageA, "User A before Wanted lifecycle");
        await expectReusableSession(pageB, "User B before Wanted lifecycle");
      });

      await test.step("User A creates a wanted request", async () => {
        await openWanted(pageA);
        await pageA.getByRole("button", { name: "Post Request", exact: true }).click();
        await pageA.getByPlaceholder("What are you looking for?", { exact: true }).fill(title);
        await pageA
          .getByPlaceholder("Describe what you need, condition, budget range...", { exact: true })
          .fill(description);

        const createResponsePromise = pageA.waitForResponse(isWantedCreateResponse, {
          timeout: actionTimeout,
        });
        await pageA.getByRole("button", { name: "Publish Request", exact: true }).click();
        const response = await createResponsePromise;
        const body = await response.text();
        expect(response.ok(), `Wanted creation failed: ${response.status()} ${body}`).toBe(true);

        const payload = JSON.parse(body) as { request?: { id?: string } };
        requestId = payload.request?.id ?? null;
        expect(requestId, "Wanted creation response must include an immutable id.").toBeTruthy();
        await expect(pageA.getByText(title, { exact: false })).toBeVisible({ timeout: actionTimeout });
      });

      await test.step("User B sees the active request without owner controls", async () => {
        await openWanted(pageB);
        await pageB.getByPlaceholder("Search wanted requests...", { exact: true }).fill(title);
        const card = pageB.getByTestId(`wanted-request-${requestId}`);
        await expect(card).toBeVisible({ timeout: actionTimeout });
        await expect(card.getByText(title, { exact: false })).toBeVisible();
        await expect(card.getByRole("button", { name: "Edit", exact: true })).toHaveCount(0);
        await expect(card.getByRole("button", { name: "Delete", exact: true })).toHaveCount(0);
      });

      await test.step("User A marks the request fulfilled", async () => {
        await openWanted(pageA);
        await pageA.getByRole("button", { name: "You", exact: true }).click();
        const card = pageA.getByTestId(`wanted-request-${requestId}`);
        await expect(card).toBeVisible({ timeout: actionTimeout });
        await card.getByRole("button", { name: "Success", exact: true }).click();
        await expect(card.getByText("fulfilled", { exact: true })).toBeVisible({
          timeout: actionTimeout,
        });
      });

      await test.step("fulfilled request disappears from User B public list", async () => {
        await openWanted(pageB);
        await pageB.getByPlaceholder("Search wanted requests...", { exact: true }).fill(title);
        await expect(pageB.getByTestId(`wanted-request-${requestId}`)).toHaveCount(0);
      });
    } catch (error) {
      primaryError = error;
    } finally {
      if (requestId) {
        try {
          await openWanted(pageA);
          await pageA.getByRole("button", { name: "You", exact: true }).click();
          const card = pageA.getByTestId(`wanted-request-${requestId}`);
          await expect(card, `Cleanup could not find wanted request ${requestId}.`).toBeVisible({
            timeout: actionTimeout,
          });
          await card.getByRole("button", { name: "Delete", exact: true }).click();
          await expect(card).toHaveCount(0, { timeout: actionTimeout });
        } catch (cleanupError) {
          if (!primaryError) primaryError = cleanupError;
        }
      }

      await contextA.close();
      await contextB.close();
    }

    if (primaryError) throw primaryError;
  });
});
