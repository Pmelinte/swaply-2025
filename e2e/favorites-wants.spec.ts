import { expect, test, type BrowserContext, type Page, type Response } from "@playwright/test";
import { readFileSync } from "node:fs";
import {
  expectAuthenticatedSession,
  userAAuthFile,
  userBAuthFile,
} from "./two-user-auth.setup";

const wantedRoute = "/wanted";
const favoritesRoute = "/favorites";
const objectCreateRoute = "/objects/new";
const myObjectsRoute = "/my-objects";
const profileRoute = "/profile";
const actionTimeout = 20_000;

type WantedCreateResult = {
  requestId: string;
  authorization: string;
};

function readStorageState(path: string) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function mainContent(page: Page) {
  return page.getByRole("main");
}

function currentLocale(page: Page) {
  const [, firstSegment] = new URL(page.url()).pathname.split("/");
  return firstSegment || "en";
}

function localizedPath(page: Page, route: string) {
  const normalizedRoute = route.startsWith("/") ? route : `/${route}`;
  return `/${currentLocale(page)}${normalizedRoute === "/" ? "" : normalizedRoute}`;
}

async function establishLocale(page: Page) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect
    .poll(() => new URL(page.url()).pathname.split("/")[1] || "", { timeout: actionTimeout })
    .not.toBe("");
}

async function expectReusableSession(page: Page, label: string) {
  await establishLocale(page);
  const profilePath = localizedPath(page, profileRoute);
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
      // Deterministic fallback for malformed test requests.
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ translated }),
    });
  });

  await page.route("**/api/translate/item", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });

  await page.route("**/api/embeddings", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });
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

function isWantedRequest(response: Response, method: string, requestId?: string) {
  if (response.request().method() !== method) return false;
  const pathname = new URL(response.url()).pathname;
  return requestId ? pathname === `/api/wanted/${requestId}` : pathname === "/api/wanted";
}

async function openFavorites(page: Page) {
  const favoritesPath = localizedPath(page, favoritesRoute);
  await page.goto(favoritesPath, { waitUntil: "domcontentloaded" });
  await expect
    .poll(() => new URL(page.url()).pathname, { timeout: actionTimeout })
    .toBe(favoritesPath);
  await expect(page.getByTestId("favorites-page")).toBeVisible({ timeout: actionTimeout });
}

async function openWanted(page: Page) {
  const wantedPath = localizedPath(page, wantedRoute);
  await page.goto(wantedPath, { waitUntil: "domcontentloaded" });
  await expect
    .poll(() => new URL(page.url()).pathname, { timeout: actionTimeout })
    .toBe(wantedPath);
  await expect(mainContent(page).locator("input").first()).toBeVisible({ timeout: actionTimeout });
}

async function openWantedAndCaptureAuthorization(page: Page): Promise<string> {
  const requestPromise = page.waitForRequest(
    (request) =>
      request.method() === "GET" &&
      new URL(request.url()).pathname === "/api/wanted" &&
      Boolean(request.headers()["authorization"]),
    { timeout: actionTimeout },
  );

  await openWanted(page);
  const request = await requestPromise;
  const authorization = request.headers()["authorization"];
  expect(authorization, "Wanted GET must carry the reusable Supabase bearer token.").toBeTruthy();
  return authorization!;
}

async function createObject(page: Page, title: string, description: string): Promise<string> {
  await page.goto(localizedPath(page, objectCreateRoute), { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/[^/]+\/objects\/new/);

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

  await expect
    .poll(() => new URL(page.url()).pathname, { timeout: actionTimeout })
    .toBe(localizedPath(page, `/objects/${itemId}`));

  return itemId!;
}

async function archiveObject(page: Page, itemId: string) {
  await expectAuthenticatedSession(page, "User A before Favorites object cleanup");
  await page.goto(localizedPath(page, myObjectsRoute), { waitUntil: "domcontentloaded" });

  const main = mainContent(page);
  const itemLink = main.locator(`a[href$="/objects/${itemId}"]`).first();
  if (!(await itemLink.isVisible({ timeout: 5_000 }).catch(() => false))) return;

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
  expect(response.ok(), `Item cleanup failed with ${response.status()}.`).toBe(true);
}

async function favoriteButton(page: Page) {
  const button = page.getByRole("button", { name: "Favorite", exact: true });
  await expect(button).toBeVisible({ timeout: actionTimeout });
  return button;
}

async function serverFavoriteIds(page: Page): Promise<string[]> {
  const response = await page.request.get("/api/favorites");
  const body = await response.text();
  expect(response.ok(), `Favorites read failed: ${response.status()} ${body}`).toBe(true);
  const payload = JSON.parse(body) as { itemIds?: string[] };
  return payload.itemIds ?? [];
}

async function setServerFavoriteState(page: Page, itemId: string, expected: boolean) {
  const response = await page.request.post("/api/favorites", {
    data: { itemId, favorite: expected },
  });
  const body = await response.text();
  expect(response.ok(), `Favorite mutation failed: ${response.status()} ${body}`).toBe(true);
}

async function ensureFavoriteState(page: Page, path: string, itemId: string, expected: boolean) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await favoriteButton(page);

  if ((await serverFavoriteIds(page)).includes(itemId) !== expected) {
    await setServerFavoriteState(page, itemId, expected);
  }

  await expect
    .poll(async () => (await serverFavoriteIds(page)).includes(itemId), { timeout: actionTimeout })
    .toBe(expected);

  await page.reload({ waitUntil: "domcontentloaded" });
  const reloadedButton = await favoriteButton(page);
  await expect(reloadedButton.locator("svg")).toHaveClass(
    expected ? /fill-red-500/ : /^(?!.*fill-red-500).*$/,
    { timeout: actionTimeout },
  );
}

async function createWantedThroughUi(
  page: Page,
  title: string,
  description: string,
): Promise<WantedCreateResult> {
  await openWanted(page);
  const main = mainContent(page);
  await main.locator("button").first().click();

  const form = main.locator("div.rounded-2xl", { has: main.locator("textarea") }).first();
  await form.locator("input").first().fill(title);
  await form.locator("textarea").first().fill(description);

  const responsePromise = page.waitForResponse(
    (response) => isWantedRequest(response, "POST"),
    { timeout: actionTimeout },
  );
  await form.locator("button").last().click();
  const response = await responsePromise;
  const body = await response.text();
  expect(response.ok(), `Wanted creation failed: ${response.status()} ${body}`).toBe(true);

  const payload = JSON.parse(body) as { request?: { id?: string; status?: string } };
  const requestId = payload.request?.id;
  expect(requestId, "Wanted creation response must include an immutable id.").toBeTruthy();
  expect(payload.request?.status).toBe("active");

  const authorization = response.request().headers()["authorization"];
  expect(authorization, "Wanted creation must carry the reusable Supabase bearer token.").toBeTruthy();

  await expect(page.getByTestId(`wanted-request-${requestId}`)).toBeVisible({ timeout: actionTimeout });
  return { requestId: requestId!, authorization: authorization! };
}

async function patchWanted(
  page: Page,
  requestId: string,
  authorization: string,
  status: "fulfilled" | "cancelled" | "active",
) {
  const response = await page.request.patch(`/api/wanted/${requestId}`, {
    headers: { Authorization: authorization },
    data: { status },
    timeout: actionTimeout,
  });
  const body = await response.text();
  return { response, body };
}

async function deleteWanted(page: Page, requestId: string, authorization: string) {
  const response = await page.request.delete(`/api/wanted/${requestId}`, {
    headers: { Authorization: authorization },
    timeout: actionTimeout,
  });
  const body = await response.text();
  expect(response.ok(), `Wanted cleanup failed: ${response.status()} ${body}`).toBe(true);
}

async function closeContextBestEffort(context: BrowserContext) {
  await context.close().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    if (!/Target page, context or browser has been closed/i.test(message)) throw error;
  });
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
      await expectReusableSession(pageA, "User A before Favorites lifecycle");
      await expectReusableSession(pageB, "User B before Favorites lifecycle");

      itemId = await createObject(pageA, title, description);
      itemPath = localizedPath(pageA, `/objects/${itemId}`);
      await ensureFavoriteState(pageA, itemPath, itemId, false);
      await ensureFavoriteState(pageB, itemPath, itemId, false);
      await ensureFavoriteState(pageA, itemPath, itemId, true);

      await openFavorites(pageA);
      await expect(pageA.getByTestId(`favorite-item-${itemId}`)).toBeVisible({
        timeout: actionTimeout,
      });

      await openFavorites(pageB);
      await expect(pageB.getByTestId(`favorite-item-${itemId}`)).toHaveCount(0);

      await ensureFavoriteState(pageA, itemPath, itemId, false);
      await openFavorites(pageA);
      await expect(pageA.getByTestId(`favorite-item-${itemId}`)).toHaveCount(0);
    } catch (error) {
      primaryError = error;
    } finally {
      if (itemId && itemPath && !pageA.isClosed() && !pageB.isClosed()) {
        await ensureFavoriteState(pageA, itemPath, itemId, false).catch(() => undefined);
        await ensureFavoriteState(pageB, itemPath, itemId, false).catch(() => undefined);
        await archiveObject(pageA, itemId).catch(() => undefined);
      }
      await closeContextBestEffort(contextA);
      await closeContextBestEffort(contextB);
    }

    if (primaryError) throw primaryError;
  });

  test("wanted request is public only while active and remains owner-controlled", async ({
    browser,
  }, testInfo) => {
    test.setTimeout(150_000);

    const contextA = await browser.newContext({ storageState: readStorageState(userAAuthFile) });
    const contextB = await browser.newContext({ storageState: readStorageState(userBAuthFile) });
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await preparePage(pageA);
    await preparePage(pageB);

    const suffix = `${Date.now()}-${testInfo.workerIndex}`;
    const title = `Batch 53 wanted ${suffix}`;
    const description = "Batch 53 verifies public visibility and owner-only lifecycle controls.";
    let requestId: string | null = null;
    let ownerAuthorization: string | null = null;
    let primaryError: unknown = null;

    try {
      await expectReusableSession(pageA, "User A before Wanted lifecycle");
      await expectReusableSession(pageB, "User B before Wanted lifecycle");

      const created = await createWantedThroughUi(pageA, title, description);
      requestId = created.requestId;
      ownerAuthorization = created.authorization;

      const outsiderAuthorization = await openWantedAndCaptureAuthorization(pageB);
      await mainContent(pageB).locator("input").first().fill(title);
      const outsiderCard = pageB.getByTestId(`wanted-request-${requestId}`);
      await expect(outsiderCard).toBeVisible({ timeout: actionTimeout });
      await expect(outsiderCard.locator("button")).toHaveCount(0);

      const outsiderMutation = await patchWanted(
        pageB,
        requestId,
        outsiderAuthorization,
        "fulfilled",
      );
      expect([403, 404]).toContain(outsiderMutation.response.status());

      const ownerMutation = await patchWanted(
        pageA,
        requestId,
        ownerAuthorization,
        "fulfilled",
      );
      expect(
        ownerMutation.response.ok(),
        `Wanted fulfillment failed: ${ownerMutation.response.status()} ${ownerMutation.body}`,
      ).toBe(true);
      const fulfilledPayload = JSON.parse(ownerMutation.body) as {
        request?: { status?: string };
      };
      expect(fulfilledPayload.request?.status).toBe("fulfilled");

      await openWanted(pageB);
      await mainContent(pageB).locator("input").first().fill(title);
      await expect(pageB.getByTestId(`wanted-request-${requestId}`)).toHaveCount(0);
    } catch (error) {
      primaryError = error;
    } finally {
      if (requestId && ownerAuthorization && !pageA.isClosed()) {
        await deleteWanted(pageA, requestId, ownerAuthorization).catch((cleanupError) => {
          if (!primaryError) primaryError = cleanupError;
        });
      }
      await closeContextBestEffort(contextA);
      await closeContextBestEffort(contextB);
    }

    if (primaryError) throw primaryError;
  });
});
