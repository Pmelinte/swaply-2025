import {
  expect,
  test,
  type Page,
  type Response as PlaywrightResponse,
} from "@playwright/test";
import { readFileSync } from "node:fs";
import {
  expectAuthenticatedSession,
  userAAuthFile,
  userBAuthFile,
} from "./two-user-auth.setup";

const objectCreatePath = "/en/objects/new";
const myObjectsPath = "/en/my-objects";
const profilePath = "/en/profile";
const actionTimeout = 20_000;

function readStorageState(path: string) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function mainContent(page: Page) {
  return page.getByRole("main");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function localizedPath(suffix: string) {
  return new RegExp(`^/[a-z]{2}${escapeRegExp(suffix)}$`);
}

async function expectLocalizedPath(page: Page, suffix: string) {
  await expect
    .poll(() => new URL(page.url()).pathname, { timeout: actionTimeout })
    .toMatch(localizedPath(suffix));
}

function isItemsWriteResponse(response: PlaywrightResponse, itemId?: string) {
  const request = response.request();
  const method = request.method();
  if (method !== "POST" && method !== "PATCH") return false;

  const url = new URL(response.url());
  if (!url.pathname.endsWith("/rest/v1/items")) return false;
  if (!itemId) return true;

  const body = request.postData() ?? "";
  return body.includes(itemId) || url.searchParams.get("id") === `eq.${itemId}`;
}

function isItemStatusResponse(response: PlaywrightResponse, itemId: string) {
  const url = new URL(response.url());
  return (
    response.request().method() === "PATCH" &&
    url.pathname === `/api/items/${itemId}/status`
  );
}

async function expectObjectDetails(page: Page, title: string, description: string) {
  const main = mainContent(page);
  await expect(main.getByText(title, { exact: true }).first()).toBeVisible({
    timeout: actionTimeout,
  });
  await expect(main.getByText(description, { exact: true }).first()).toBeVisible({
    timeout: actionTimeout,
  });
}

async function expectReusableSession(page: Page, label: string) {
  await page.goto(profilePath, { waitUntil: "domcontentloaded" });
  await expectLocalizedPath(page, "/profile");
  await expectAuthenticatedSession(page, label);
}

async function preparePage(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("cookie_consent", "rejected");
    window.localStorage.setItem("swaply_cookie_consent", "rejected");
  });

  await page.route("**/api/analyze-image", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({}),
    });
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
      translated = "";
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ translated }),
    });
  });
  await page.route("**/api/translate/item", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({}),
    });
  });
  await page.route("**/api/embeddings", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });
}

async function createObject(page: Page, title: string, description: string): Promise<string> {
  await page.goto(objectCreatePath, { waitUntil: "domcontentloaded" });
  await expectLocalizedPath(page, "/objects/new");

  const origin = new URL(page.url()).origin;
  await page
    .getByPlaceholder("https://example.com/product.jpg", { exact: true })
    .fill(`${origin}/icons/icon-512x512.png`);
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
    .fill("A compact camera or an e-reader in good condition.");
  await page.getByRole("button", { name: "Adjacent", exact: true }).click();
  await page.getByRole("button", { name: "Moderate", exact: true }).click();
  await page.locator("button").filter({ hasText: "Local" }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();

  const insertResponsePromise = page.waitForResponse(
    (response) => isItemsWriteResponse(response),
    { timeout: actionTimeout },
  );
  await page.getByRole("button", { name: "Publish Listing", exact: true }).click();
  const insertResponse = await insertResponsePromise;
  const responseBody = await insertResponse.text();
  expect(
    insertResponse.ok(),
    `Item creation failed: ${insertResponse.status()} ${responseBody}`,
  ).toBe(true);

  const insertedRows = JSON.parse(responseBody) as Array<{ id?: string }>;
  const itemId = insertedRows[0]?.id;
  expect(itemId, "The item insert response must include an id.").toBeTruthy();
  await expectLocalizedPath(page, `/objects/${itemId}`);
  return itemId!;
}

async function archiveObject(page: Page, itemId: string) {
  await expectAuthenticatedSession(page, "User A before object cleanup");
  await page.goto(myObjectsPath, { waitUntil: "domcontentloaded" });
  await expectLocalizedPath(page, "/my-objects");

  const main = mainContent(page);
  const itemLink = main.locator(`a[href$="/objects/${itemId}"]`).first();
  await expect(itemLink, `Cleanup could not find item ${itemId} in My Objects.`).toBeVisible({
    timeout: actionTimeout,
  });

  const card = itemLink.locator("xpath=ancestor::div[contains(@class,'overflow-hidden')][1]");
  const expandButton = card.getByRole("button", { name: /Expand details|Collapse details/ });
  if (await expandButton.isVisible().catch(() => false)) await expandButton.click();

  const archiveButton = card.locator("button:has(svg.lucide-archive)").first();
  if (!(await archiveButton.isVisible({ timeout: 3_000 }).catch(() => false))) {
    await expect(card.locator("button:has(svg.lucide-play)").first()).toBeVisible({
      timeout: actionTimeout,
    });
    return;
  }

  const archiveResponsePromise = page.waitForResponse(
    (response) => isItemStatusResponse(response, itemId),
    { timeout: actionTimeout },
  );
  await archiveButton.click();
  const archiveResponse = await archiveResponsePromise;
  const archiveBody = archiveResponse.ok() ? "" : await archiveResponse.text();
  expect(
    archiveResponse.ok(),
    `Item cleanup failed: ${archiveResponse.status()} ${archiveBody}`,
  ).toBe(true);
}

test.describe("Train C Batch 52 objects CRUD", () => {
  test.describe.configure({ retries: 0 });

  test("owner can create, read, update and archive an object while another user cannot edit it", async ({
    browser,
  }, testInfo) => {
    test.setTimeout(240_000);

    const contextA = await browser.newContext({ storageState: readStorageState(userAAuthFile) });
    const contextB = await browser.newContext({ storageState: readStorageState(userBAuthFile) });
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();
    await preparePage(pageA);
    await preparePage(pageB);

    const suffix = `${Date.now()}-${testInfo.workerIndex}`;
    const originalTitle = `Batch 52 CRUD ${suffix}`;
    const editedTitle = `Batch 52 CRUD edited ${suffix}`;
    const originalDescription = "Batch 52 verifies authenticated object creation and persistence.";
    const editedDescription = "Batch 52 verifies authenticated object editing and owner isolation.";

    let createdItemId: string | null = null;
    let primaryError: unknown | null = null;

    try {
      await expectReusableSession(pageA, "User A before Objects CRUD");
      await expectReusableSession(pageB, "User B before Objects CRUD");

      createdItemId = await createObject(pageA, originalTitle, originalDescription);
      const itemId = createdItemId;

      await pageA.reload({ waitUntil: "domcontentloaded" });
      await expectObjectDetails(pageA, originalTitle, originalDescription);
      await expect(mainContent(pageA).locator(`a[href$="/objects/${itemId}/edit"]`)).toBeVisible({
        timeout: actionTimeout,
      });

      await pageB.goto(`/en/objects/${itemId}`, { waitUntil: "domcontentloaded" });
      await expectLocalizedPath(pageB, `/objects/${itemId}`);
      await expectObjectDetails(pageB, originalTitle, originalDescription);
      await expect(mainContent(pageB).locator(`a[href$="/objects/${itemId}/edit"]`)).toHaveCount(0);
      await pageB.goto(`/en/objects/${itemId}/edit`, { waitUntil: "domcontentloaded" });
      await expectAuthenticatedSession(pageB, "User B on denied edit route");
      await expect(mainContent(pageB).locator("form")).toHaveCount(0);

      await pageA.goto(`/en/objects/${itemId}`, { waitUntil: "domcontentloaded" });
      await mainContent(pageA).locator(`a[href$="/objects/${itemId}/edit"]`).click();
      await expectLocalizedPath(pageA, `/objects/${itemId}/edit`);

      const editMain = mainContent(pageA);
      const titleField = editMain.locator("input[name=title]");
      const descriptionField = editMain.locator("textarea[name=description]");
      await titleField.fill(editedTitle);
      await descriptionField.fill(editedDescription);

      const updateResponsePromise = pageA.waitForResponse(
        (response) => isItemsWriteResponse(response, itemId),
        { timeout: actionTimeout },
      );
      await editMain.locator("form button[type=submit]").click();
      const updateResponse = await updateResponsePromise;
      const updateBody = updateResponse.ok() ? "" : await updateResponse.text();
      expect(
        updateResponse.ok(),
        `Item update failed: ${updateResponse.status()} ${updateBody}`,
      ).toBe(true);

      await expectLocalizedPath(pageA, `/objects/${itemId}`);
      await expectObjectDetails(pageA, editedTitle, editedDescription);
      await pageA.reload({ waitUntil: "domcontentloaded" });
      await expectObjectDetails(pageA, editedTitle, editedDescription);
    } catch (error) {
      primaryError = error;
    }

    let cleanupError: unknown | null = null;
    if (createdItemId) {
      try {
        await archiveObject(pageA, createdItemId);
        await pageA.goto(`/en/objects/${createdItemId}`, { waitUntil: "domcontentloaded" });
        await expect(mainContent(pageA).locator(`a[href$="/objects/${createdItemId}/edit"]`)).toHaveCount(0);
      } catch (error) {
        cleanupError = error;
      }
    }

    await contextA.close();
    await contextB.close();

    if (primaryError !== null) {
      if (cleanupError !== null) {
        await testInfo.attach("objects-crud-cleanup-error", {
          body:
            cleanupError instanceof Error
              ? cleanupError.stack ?? cleanupError.message
              : String(cleanupError),
          contentType: "text/plain",
        });
      }
      throw primaryError;
    }

    if (cleanupError !== null) throw cleanupError;
  });
});
