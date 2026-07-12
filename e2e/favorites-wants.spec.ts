import { expect, test, type Page, type Response } from "@playwright/test";
import { readFileSync } from "node:fs";
import {
  expectAuthenticatedSession,
  userAAuthFile,
  userBAuthFile,
} from "./two-user-auth.setup";

const wantedPath = "/en/wanted";
const favoritesPath = "/en/favorites";
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

async function expectReusableSession(page: Page, label: string) {
  await page.goto(profilePath, { waitUntil: "domcontentloaded" });
  await expect
    .poll(() => new URL(page.url()).pathname, { timeout: actionTimeout })
    .toBe(profilePath);
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
      // Keep the identity-translation fallback empty for malformed test requests.
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

function isWantedCreateResponse(response: Response) {
  const request = response.request();
  const url = new URL(response.url());
  return request.method() === "POST" && url.pathname === "/api/wanted";
}

function isFavoriteWriteResponse(response: Response, itemId: string) {
  const request = response.request();
  const method = request.method();
  if (method !== "POST" && method !== "DELETE") return false;

  const url = new URL(response.url());
  if (!url.pathname.endsWith("/rest/v1/user_favorites")) return false;

  const body = request.postData() ?? "";
  return body.includes(itemId) || url.searchParams.get("item_id") === `eq.${itemId}`;
}

function isItemsWriteResponse(response: Response, itemId?: string) {
  const request = response.request();
  const method = request.method();
  if (method !== "POST" && method !== "PATCH") return false;

  const url = new URL(response.url());
  if (!url.pathname.endsWith("/rest/v1/items")) return false;
  if (!itemId) return true;

  const body = request.postData() ?? "";
  return body.includes(itemId) || url.searchParams.get("id") === `eq.${itemId}`;
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

async function openFavorites(page: Page) {
  await page.goto(favoritesPath, { waitUntil: "domcontentloaded" });
  await expect
    .poll(() => new URL(page.url()).pathname, { timeout: actionTimeout })
    .toBe(favoritesPath);
  await expect(page.getByTestId("favorites-page")).toBeVisible({ timeout: actionTimeout });
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

  await expect(
    mainContent(page).getByText("Your item has been listed successfully!", { exact: true }),
  ).toBeVisible({ timeout: actionTimeout });
  await expect
    .poll(() => new URL(page.url()).pathname, { timeout: actionTimeout })
    .toBe(`/en/objects/${itemId}`);

  return itemId!;
}

async function archiveObject(page: Page, itemId: string) {
  await expectAuthenticatedSession(page, "User A before Favorites object cleanup");
  await page.goto(myObjectsPath, { waitUntil: "domcontentloaded" });
  await expect
    .poll(() => new URL(page.url()).pathname, { timeout: actionTimeout })
    .toBe(myObjectsPath);

  const main = mainContent(page);
  const search = main.getByPlaceholder("Search your items...", { exact: true });
  await expect(search).toBeVisible({ timeout: actionTimeout });
  await search.fill("");

  const itemLink = main.locator(`a[href$="/objects/${itemId}"]`).first();
  await expect(itemLink, `Cleanup could not find item ${itemId} in My Objects.`).toBeVisible({
    timeout: actionTimeout,
  });

  const card = itemLink.locator("xpath=ancestor::div[contains(@class,'overflow-hidden')][1]");
  await expect(card).toBeVisible({ timeout: actionTimeout });

  const expandButton = card.getByRole("button", { name: "Expand details", exact: true });
  if (await expandButton.isVisible().catch(() => false)) {
    await expandButton.click();
  }

  const archiveButton = card.getByRole("button", { name: "Archive", exact: true });
  if (!(await archiveButton.isVisible({ timeout: 3_000 }).catch(() => false))) {
    await expect(card.getByRole("button", { name: "Resume", exact: true })).toBeVisible({
      timeout: actionTimeout,
    });
    return;
  }

  const archiveResponsePromise = page.waitForResponse(
    (response) => isItemsWriteResponse(response, itemId),
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

async function ensureNotFavorite(page: Page, path: string, itemId: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  const favoriteButton = page.getByRole("button", { name: "Favorite", exact: true });
  await expect(favoriteButton).toBeVisible({ timeout: actionTimeout });

  const iconClass = (await favoriteButton.locator("svg").getAttribute("class")) ?? "";
  if (!iconClass.includes("fill-red-500")) return;

  const responsePromise = page.waitForResponse(
    (response) => isFavoriteWriteResponse(response, itemId),
    { timeout: actionTimeout },
  );
  await favoriteButton.click();
  const response = await responsePromise;
  expect(response.ok(), `Favorite cleanup failed with ${response.status()}.`).toBe(true);
}

test.describe("Train C Batch 53 favorites and wants", () => {
  test.describe.configure({ retries: 0 });

  test("favorite persists for User A, remains isolated from User B, and cleans up", async ({
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
    const title = `Batch 53 favorite ${suffix}`;
    const description = "Batch 53 verifies favorite persistence and per-user isolation.";

    let itemId: string | null = null;
    let itemPath: string | null = null;
    let primaryError: unknown = null;

    try {
      await test.step("verify reusable sessions", async () => {
        await expectReusableSession(pageA, "User A before Favorites lifecycle");
        await expectReusableSession(pageB, "User B before Favorites lifecycle");
      });

      await test.step("create an isolated favorite test object as User A", async () => {
        itemId = await createObject(pageA, title, description);
        itemPath = `/en/objects/${itemId}`;

        await ensureNotFavorite(pageA, itemPath, itemId);
        await ensureNotFavorite(pageB, itemPath, itemId);
      });

      await test.step("User A saves the object", async () => {
        expect(itemId).toBeTruthy();
        expect(itemPath).toBeTruthy();

        await pageA.goto(itemPath!, { waitUntil: "domcontentloaded" });
        const favoriteButton = pageA.getByRole("button", { name: "Favorite", exact: true });
        await expect(favoriteButton).toBeVisible({ timeout: actionTimeout });

        const responsePromise = pageA.waitForResponse(
          (response) => isFavoriteWriteResponse(response, itemId!),
          { timeout: actionTimeout },
        );
        await favoriteButton.click();
        const response = await responsePromise;
        expect(response.ok(), `Favorite creation failed with ${response.status()}.`).toBe(true);

        await expect(favoriteButton.locator("svg")).toHaveClass(/fill-red-500/, {
          timeout: actionTimeout,
        });
      });

      await test.step("favorite persists after reload and appears in User A Favorites", async () => {
        await pageA.reload({ waitUntil: "domcontentloaded" });
        const favoriteButton = pageA.getByRole("button", { name: "Favorite", exact: true });
        await expect(favoriteButton.locator("svg")).toHaveClass(/fill-red-500/, {
          timeout: actionTimeout,
        });

        await openFavorites(pageA);
        await expect(pageA.getByTestId(`favorite-item-${itemId}`)).toBeVisible({
          timeout: actionTimeout,
        });
      });

      await test.step("User B does not inherit User A favorite", async () => {
        await openFavorites(pageB);
        await expect(pageB.getByTestId(`favorite-item-${itemId}`)).toHaveCount(0);
      });

      await test.step("User A removes the favorite and persistence is cleared", async () => {
        const card = pageA.getByTestId(`favorite-item-${itemId}`);
        await expect(card).toBeVisible({ timeout: actionTimeout });

        const responsePromise = pageA.waitForResponse(
          (response) => isFavoriteWriteResponse(response, itemId!),
          { timeout: actionTimeout },
        );
        await card.getByRole("button").click();
        const response = await responsePromise;
        expect(response.ok(), `Favorite deletion failed with ${response.status()}.`).toBe(true);
        await expect(card).toHaveCount(0, { timeout: actionTimeout });

        await pageA.reload({ waitUntil: "domcontentloaded" });
        await expect(pageA.getByTestId("favorites-page")).toBeVisible({ timeout: actionTimeout });
        await expect(pageA.getByTestId(`favorite-item-${itemId}`)).toHaveCount(0);
      });
    } catch (error) {
      primaryError = error;
    } finally {
      if (itemId && itemPath) {
        try {
          await ensureNotFavorite(pageA, itemPath, itemId);
          await ensureNotFavorite(pageB, itemPath, itemId);
          await archiveObject(pageA, itemId);
        } catch (cleanupError) {
          if (!primaryError) primaryError = cleanupError;
        }
      }

      await contextA.close();
      await contextB.close();
    }

    if (primaryError) throw primaryError;
  });

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

        const createdCard = pageA.getByTestId(`wanted-request-${requestId}`);
        await expect(createdCard).toBeVisible({ timeout: actionTimeout });
        await expect(createdCard.getByText(title, { exact: false })).toBeVisible();
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