import { expect, test, type Page, type Response } from "@playwright/test";
import { readFileSync } from "node:fs";
import {
  expectAuthenticatedSession,
  userAAuthFile,
  userBAuthFile,
} from "./two-user-auth.setup";

const favoritesRoute = "/favorites";
const objectCreateRoute = "/objects/new";
const myObjectsRoute = "/my-objects";
const profileRoute = "/profile";
const actionTimeout = 20_000;

type ApiResult<T> = {
  status: number;
  ok: boolean;
  body: T;
};

type WantedRequestPayload = {
  id?: string;
  status?: string;
  title?: string;
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

async function openFavorites(page: Page) {
  const favoritesPath = localizedPath(page, favoritesRoute);
  await page.goto(favoritesPath, { waitUntil: "domcontentloaded" });
  await expect
    .poll(() => new URL(page.url()).pathname, { timeout: actionTimeout })
    .toBe(favoritesPath);
  await expect(page.getByTestId("favorites-page")).toBeVisible({ timeout: actionTimeout });
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

async function isFavorite(page: Page) {
  const button = await favoriteButton(page);
  const iconClass = (await button.locator("svg").getAttribute("class")) ?? "";
  return iconClass.includes("fill-red-500");
}

async function ensureFavoriteState(page: Page, path: string, expected: boolean) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  const button = await favoriteButton(page);

  if ((await isFavorite(page)) !== expected) await button.click();

  await expect(button.locator("svg")).toHaveClass(
    expected ? /fill-red-500/ : /^(?!.*fill-red-500).*$/,
    { timeout: actionTimeout },
  );

  await page.reload({ waitUntil: "domcontentloaded" });
  const reloadedButton = await favoriteButton(page);
  await expect(reloadedButton.locator("svg")).toHaveClass(
    expected ? /fill-red-500/ : /^(?!.*fill-red-500).*$/,
    { timeout: actionTimeout },
  );
}

async function authenticatedApi<T>(
  page: Page,
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<ApiResult<T>> {
  return page.evaluate(
    async ({ requestPath, requestInit }) => {
      const storageEntry = Object.entries(window.localStorage).find(
        ([key]) => key.startsWith("sb-") && key.endsWith("-auth-token"),
      );
      if (!storageEntry) throw new Error("Supabase auth storage entry not found.");

      const parsed = JSON.parse(storageEntry[1]) as {
        access_token?: string;
        currentSession?: { access_token?: string };
      };
      const accessToken = parsed.access_token ?? parsed.currentSession?.access_token;
      if (!accessToken) throw new Error("Supabase access token not found.");

      const response = await fetch(requestPath, {
        method: requestInit.method ?? "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...(requestInit.body === undefined ? {} : { "Content-Type": "application/json" }),
        },
        body: requestInit.body === undefined ? undefined : JSON.stringify(requestInit.body),
      });

      const text = await response.text();
      let body: unknown = null;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        body = text;
      }

      return { status: response.status, ok: response.ok, body };
    },
    { requestPath: path, requestInit: init },
  ) as Promise<ApiResult<T>>;
}

async function deleteWantedBestEffort(page: Page, requestId: string) {
  await authenticatedApi(page, `/api/wanted/${requestId}`, { method: "DELETE" }).catch(
    () => undefined,
  );
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
      await ensureFavoriteState(pageA, itemPath, false);
      await ensureFavoriteState(pageB, itemPath, false);
      await ensureFavoriteState(pageA, itemPath, true);

      await openFavorites(pageA);
      await expect(pageA.getByTestId(`favorite-item-${itemId}`)).toBeVisible({
        timeout: actionTimeout,
      });

      await openFavorites(pageB);
      await expect(pageB.getByTestId(`favorite-item-${itemId}`)).toHaveCount(0);

      await ensureFavoriteState(pageA, itemPath, false);
      await openFavorites(pageA);
      await expect(pageA.getByTestId(`favorite-item-${itemId}`)).toHaveCount(0);
    } catch (error) {
      primaryError = error;
    } finally {
      if (itemId && itemPath) {
        await ensureFavoriteState(pageA, itemPath, false).catch(() => undefined);
        await ensureFavoriteState(pageB, itemPath, false).catch(() => undefined);
        await archiveObject(pageA, itemId).catch(() => undefined);
      }
      await contextA.close();
      await contextB.close();
    }

    if (primaryError) throw primaryError;
  });

  test("wanted request is public only while active and remains owner-controlled", async ({
    browser,
  }, testInfo) => {
    test.setTimeout(120_000);

    const contextA = await browser.newContext({ storageState: readStorageState(userAAuthFile) });
    const contextB = await browser.newContext({ storageState: readStorageState(userBAuthFile) });
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    const suffix = `${Date.now()}-${testInfo.workerIndex}`;
    const title = `Batch 53 wanted ${suffix}`;
    const description = "Batch 53 verifies public visibility and owner-only lifecycle controls.";
    let requestId: string | null = null;

    try {
      await expectReusableSession(pageA, "User A before Wanted lifecycle");
      await expectReusableSession(pageB, "User B before Wanted lifecycle");

      const created = await authenticatedApi<{ request?: WantedRequestPayload }>(pageA, "/api/wanted", {
        method: "POST",
        body: { title, description },
      });
      expect(created.ok, `Wanted creation failed: ${created.status} ${JSON.stringify(created.body)}`).toBe(
        true,
      );

      requestId = created.body.request?.id ?? null;
      expect(requestId, "Wanted creation response must include an immutable id.").toBeTruthy();
      expect(created.body.request?.status).toBe("active");

      const publicBefore = await authenticatedApi<{ requests?: WantedRequestPayload[] }>(
        pageB,
        "/api/wanted",
      );
      expect(publicBefore.ok).toBe(true);
      expect(publicBefore.body.requests?.some((request) => request.id === requestId)).toBe(true);

      const outsiderMutation = await authenticatedApi(pageB, `/api/wanted/${requestId}`, {
        method: "PATCH",
        body: { status: "fulfilled" },
      });
      expect(outsiderMutation.ok).toBe(false);
      expect([403, 404]).toContain(outsiderMutation.status);

      const fulfilled = await authenticatedApi<{ request?: WantedRequestPayload }>(
        pageA,
        `/api/wanted/${requestId}`,
        { method: "PATCH", body: { status: "fulfilled" } },
      );
      expect(
        fulfilled.ok,
        `Wanted fulfillment failed: ${fulfilled.status} ${JSON.stringify(fulfilled.body)}`,
      ).toBe(true);
      expect(fulfilled.body.request?.status).toBe("fulfilled");

      const ownerRead = await authenticatedApi<{ request?: WantedRequestPayload }>(
        pageA,
        `/api/wanted/${requestId}`,
      );
      expect(ownerRead.ok).toBe(true);
      expect(ownerRead.body.request?.status).toBe("fulfilled");

      const publicAfter = await authenticatedApi<{ requests?: WantedRequestPayload[] }>(
        pageB,
        "/api/wanted",
      );
      expect(publicAfter.ok).toBe(true);
      expect(publicAfter.body.requests?.some((request) => request.id === requestId)).toBe(false);
    } finally {
      if (requestId) await deleteWantedBestEffort(pageA, requestId);
      await contextA.close();
      await contextB.close();
    }
  });
});
