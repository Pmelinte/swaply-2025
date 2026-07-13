import { expect, test, type Page, type Response } from "@playwright/test";
import { readFileSync } from "node:fs";
import {
  expectAuthenticatedSession,
  userAAuthFile,
  userBAuthFile,
} from "./two-user-auth.setup";

const objectCreatePath = "/en/objects/new";
const myObjectsPath = "/en/my-objects";
const matchingPath = "/en/matching";
const profilePath = "/en/profile";
const actionTimeout = 20_000;

function readStorageState(path: string) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function mainContent(page: Page) {
  return page.getByRole("main");
}

async function preparePage(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("cookie_consent", "rejected");
    window.localStorage.setItem("swaply_cookie_consent", "rejected");
  });

  await page.route("**/api/analyze-image", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });

  await page.route("**/api/ai", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "fallback", tags: [] }),
    });
  });

  await page.route("**/api/translate", async (route) => {
    let translated = "";
    try {
      const body = route.request().postDataJSON() as { text?: unknown };
      if (typeof body.text === "string") translated = body.text;
    } catch {
      // Keep malformed requests deterministic in E2E.
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ translated }),
    });
  });
}

async function expectReusableSession(page: Page, label: string) {
  await page.goto(profilePath, { waitUntil: "domcontentloaded" });
  await expect
    .poll(() => new URL(page.url()).pathname, { timeout: actionTimeout })
    .toBe(profilePath);
  await expectAuthenticatedSession(page, label);
}

function isItemsWriteResponse(response: Response, itemId?: string) {
  const request = response.request();
  if (request.method() !== "POST" && request.method() !== "PATCH") return false;

  const url = new URL(response.url());
  if (!url.pathname.endsWith("/rest/v1/items")) return false;
  if (!itemId) return true;

  return (
    (request.postData() ?? "").includes(itemId) ||
    url.searchParams.get("id") === `eq.${itemId}`
  );
}

function isInterestWriteResponse(response: Response, method: "POST" | "PATCH") {
  const request = response.request();
  const url = new URL(response.url());
  return (
    request.method() === method && url.pathname.endsWith("/rest/v1/matching_interests")
  );
}

async function createObject(page: Page, title: string, description: string): Promise<string> {
  await page.goto(objectCreatePath, { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/en\/objects\/new/);

  const origin = new URL(page.url()).origin;
  const imageUrl = `${origin}/icons/icon-512x512.png`;

  await page.getByPlaceholder("https://example.com/product.jpg", { exact: true }).fill(imageUrl);
  await page.getByRole("button", { name: "Use", exact: true }).click();
  await expect(page.getByRole("img", { name: "Photo 1", exact: true })).toBeVisible({
    timeout: actionTimeout,
  });

  const titleInput = page.getByPlaceholder("What are you offering?", { exact: true });
  await expect(titleInput).toBeEnabled({ timeout: actionTimeout });
  await titleInput.fill(title);

  await page.getByRole("button").filter({ hasText: "Electronics" }).click();
  await page.getByRole("button", { name: "Computers", exact: true }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();

  await page.locator("button").filter({ has: page.getByText("Good", { exact: true }) }).click();
  await page.locator("button").filter({ has: page.getByText("Medium", { exact: true }) }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();

  await page
    .getByPlaceholder("Describe the item in detail...", { exact: true })
    .fill(description);
  await page.getByRole("button", { name: "Next", exact: true }).click();

  await page.locator("button").filter({ hasText: "Objects only" }).click();
  await page
    .getByPlaceholder("Describe what you're looking for...", { exact: true })
    .fill("A useful electronic item in good condition.");
  await page.getByRole("button", { name: "Adjacent", exact: true }).click();
  await page.getByRole("button", { name: "Moderate", exact: true }).click();
  await page.locator("button").filter({ hasText: "Local" }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();

  const responsePromise = page.waitForResponse(
    (response) => isItemsWriteResponse(response),
    { timeout: actionTimeout },
  );
  await page.getByRole("button", { name: "Publish Listing", exact: true }).click();
  const response = await responsePromise;
  const body = await response.text();

  expect(response.ok(), `Item creation failed: ${response.status()} ${body}`).toBe(true);
  const rows = JSON.parse(body) as Array<{ id?: string }>;
  const itemId = rows[0]?.id;
  expect(itemId, "Item creation response must include an id.").toBeTruthy();

  await expect
    .poll(() => new URL(page.url()).pathname, { timeout: actionTimeout })
    .toBe(`/en/objects/${itemId}`);

  return itemId!;
}

async function archiveObject(page: Page, itemId: string, label: string) {
  await expectAuthenticatedSession(page, `${label} before object cleanup`);
  await page.goto(myObjectsPath, { waitUntil: "domcontentloaded" });
  await expect
    .poll(() => new URL(page.url()).pathname, { timeout: actionTimeout })
    .toBe(myObjectsPath);

  const main = mainContent(page);
  const itemLink = main.locator(`a[href$="/objects/${itemId}"]`).first();
  await expect(itemLink, `Cleanup could not find object ${itemId}.`).toBeVisible({
    timeout: actionTimeout,
  });

  const card = itemLink.locator("xpath=ancestor::div[contains(@class,'overflow-hidden')][1]");
  const expandButton = card.getByRole("button", { name: "Expand details", exact: true });
  if (await expandButton.isVisible().catch(() => false)) await expandButton.click();

  const archiveButton = card.getByRole("button", { name: "Archive", exact: true });
  if (!(await archiveButton.isVisible({ timeout: 3_000 }).catch(() => false))) return;

  const responsePromise = page.waitForResponse(
    (response) => isItemsWriteResponse(response, itemId),
    { timeout: actionTimeout },
  );
  await archiveButton.click();
  const response = await responsePromise;
  expect(response.ok(), `${label} object cleanup failed with ${response.status()}.`).toBe(true);
}

function parseInterestId(body: string): string | null {
  const parsed = JSON.parse(body) as Array<{ id?: string }> | { id?: string };
  if (Array.isArray(parsed)) return parsed[0]?.id ?? null;
  return parsed.id ?? null;
}

test.describe("Train C Batch 54 Express Interest", () => {
  test.describe.configure({ retries: 0 });

  test("persists, is participant-visible, remains isolated, and can be withdrawn", async ({
    browser,
  }, testInfo) => {
    test.setTimeout(300_000);

    const contextA = await browser.newContext({ storageState: readStorageState(userAAuthFile) });
    const contextB = await browser.newContext({ storageState: readStorageState(userBAuthFile) });
    const contextC = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();
    const pageC = await contextC.newPage();

    await preparePage(pageA);
    await preparePage(pageB);
    await preparePage(pageC);

    const suffix = `${Date.now()}-${testInfo.workerIndex}`;
    let sourceItemId: string | null = null;
    let targetItemId: string | null = null;
    let interestId: string | null = null;
    let primaryError: unknown = null;

    try {
      await test.step("verify reusable authenticated sessions", async () => {
        await expectReusableSession(pageA, "User A before Express Interest lifecycle");
        await expectReusableSession(pageB, "User B before Express Interest lifecycle");
      });

      await test.step("create source and target objects", async () => {
        sourceItemId = await createObject(
          pageA,
          `Batch 54 source ${suffix}`,
          "Source object owned by User A for the Express Interest contract.",
        );
        targetItemId = await createObject(
          pageB,
          `Batch 54 target ${suffix}`,
          "Target object owned by User B for the Express Interest contract.",
        );
      });

      await test.step("User A expresses interest in User B's object", async () => {
        expect(sourceItemId).toBeTruthy();
        expect(targetItemId).toBeTruthy();

        await pageA.goto(`${matchingPath}?slot1=${sourceItemId}`, {
          waitUntil: "domcontentloaded",
        });
        await expect
          .poll(() => new URL(pageA.url()).pathname, { timeout: actionTimeout })
          .toBe(matchingPath);

        const candidate = pageA.getByTestId(`matching-candidate-${targetItemId}`);
        await expect(candidate).toBeVisible({ timeout: actionTimeout });
        await pageA.getByTestId(`matching-candidate-details-${targetItemId}`).click();
        await expect(pageA.getByTestId(`matching-item-drawer-${targetItemId}`)).toBeVisible({
          timeout: actionTimeout,
        });

        const responsePromise = pageA.waitForResponse(
          (response) => isInterestWriteResponse(response, "POST"),
          { timeout: actionTimeout },
        );
        await pageA.getByTestId(`express-interest-submit-${targetItemId}`).click();
        const response = await responsePromise;
        const body = await response.text();
        expect(response.ok(), `Express Interest failed: ${response.status()} ${body}`).toBe(true);

        interestId = parseInterestId(body);
        expect(interestId, "Express Interest response must include an immutable id.").toBeTruthy();
        await expect(pageA.getByTestId(`express-interest-${targetItemId}`)).toBeVisible({
          timeout: actionTimeout,
        });
      });

      await test.step("interest persists for User A after reload", async () => {
        await pageA.reload({ waitUntil: "domcontentloaded" });
        await expect(pageA.getByTestId(`express-interest-${targetItemId}`)).toBeVisible({
          timeout: actionTimeout,
        });
      });

      await test.step("User B sees the received interest", async () => {
        await pageB.goto(matchingPath, { waitUntil: "domcontentloaded" });
        await expect(pageB.getByTestId("interests-received")).toBeVisible({
          timeout: actionTimeout,
        });
        await expect(pageB.getByTestId(`received-interest-${interestId}`)).toBeVisible({
          timeout: actionTimeout,
        });
      });

      await test.step("nonparticipant User C cannot see the private interest", async () => {
        await pageC.goto(matchingPath, { waitUntil: "domcontentloaded" });
        await expect(pageC.getByTestId(`received-interest-${interestId}`)).toHaveCount(0);
        await expect(pageC.getByTestId(`express-interest-${targetItemId}`)).toHaveCount(0);
      });

      await test.step("User A withdraws the interest", async () => {
        const responsePromise = pageA.waitForResponse(
          (response) => isInterestWriteResponse(response, "PATCH"),
          { timeout: actionTimeout },
        );
        await pageA.getByTestId(`withdraw-interest-${targetItemId}`).click();
        const response = await responsePromise;
        const body = response.ok() ? "" : await response.text();
        expect(response.ok(), `Withdraw Interest failed: ${response.status()} ${body}`).toBe(true);
        await expect(pageA.getByTestId(`express-interest-${targetItemId}`)).toHaveCount(0);
      });

      await test.step("withdrawn interest disappears for User B", async () => {
        await pageB.reload({ waitUntil: "domcontentloaded" });
        await expect(pageB.getByTestId(`received-interest-${interestId}`)).toHaveCount(0);
      });
    } catch (error) {
      primaryError = error;
      throw error;
    } finally {
      const cleanupErrors: unknown[] = [];

      if (sourceItemId) {
        try {
          await archiveObject(pageA, sourceItemId, "User A");
        } catch (error) {
          cleanupErrors.push(error);
        }
      }

      if (targetItemId) {
        try {
          await archiveObject(pageB, targetItemId, "User B");
        } catch (error) {
          cleanupErrors.push(error);
        }
      }

      await contextA.close().catch(() => undefined);
      await contextB.close().catch(() => undefined);
      await contextC.close().catch(() => undefined);

      if (!primaryError && cleanupErrors.length > 0) throw cleanupErrors[0];
    }
  });
});
