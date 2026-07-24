import { expect, test, type Page, type Response } from "@playwright/test";
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
      // Identity fallback for malformed test requests.
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
  const wantedPath = localizedPath(page, wantedRoute);
  await page.goto(wantedPath, { waitUntil: "domcontentloaded" });
  await expect
    .poll(() => new URL(page.url()).pathname, { timeout: actionTimeout })
    .toBe(wantedPath);
  await expect(mainContent(page).locator("button").first()).toBeVisible({ timeout: actionTimeout });
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

  await expect(
    mainContent(page).getByText("Your item has been listed successfully!", { exact: true }),
  ).toBeVisible({ timeout: actionTimeout });
  await expect
    .poll(() => new URL(page.url()).pathname, { timeout: actionTimeout })
    .toBe(localizedPath(page, `/objects/${itemId}`));

  return itemId!;
}

async function archiveObject(page: Page, itemId: string) {
  await expectAuthenticatedSession(page, "User A before Favorites object cleanup");
  await page.goto(localizedPath(page, myObjectsRoute), { waitUntil: "domcontentloaded" });
  await expect
    .poll(() => new URL(page.url()).pathname, { timeout: actionTimeout })
    .toBe(localizedPath(page, myObjectsRoute));

  const main = mainContent(page);
  const search = main.getByPlaceholder("Search your items...", { exact: true });
  await expect(search).toBeVisible({ timeout: actionTimeout });
  await search.fill("");

  const itemLink = main.locator(`a[href$="/objects/${itemId}"]`).first();
  if (!(await itemLink.isVisible({ timeout: 5_000 }).catch(() => false))) return;

  const card = itemLink.locator("xpath=ancestor::div[contains(@class,'overflow-hidden')][1]");
  const expandButton = card.getByRole("button", { name: "Expand details", exact: true });
  if (await expandButton.isVisible().catch(() => false)) await expandButton.click();

  const archiveButton = card.getByRole("button", { name: "Archive", exact: true });
  if (!(await archiveButton.isVisible({ timeout: 3_000 }).catch(() => false))) return;

  const archiveResponsePromise = page.waitForResponse(
    (response) => isItemsWriteResponse(response, itemId),
    { timeout: actionTimeout },
  );
  await archiveButton.click();
  const archiveResponse = await archiveResponsePromise;
  expect(archiveResponse.ok(), `Item cleanup failed with ${archiveResponse.status()}.`).toBe(true);
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

  if ((await isFavorite(page)) !== expected) {
    await button.click();
  }

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

async function bestEffortWantedCleanup(page: Page, requestId: string) {
  try {
    await openWanted(page);
    await mainContent(page).locator("button").nth(1).click();
    const card = page.getByTestId(`wanted-request-${requestId}`);
    if (!(await card.isVisible({ timeout: 5_000 }).catch(() => false))) return;
    const buttons = card.locator("button");
    const count = await buttons.count();
    if (count === 0) return;
    await buttons.nth(count - 1).click();
    await expect(card).toHaveCount(0, { timeout: actionTimeout });
  } catch {
    // Cleanup must never replace the lifecycle assertion that actually failed.
  }
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
        itemPath = localizedPath(pageA, `/objects/${itemId}`);
        await ensureFavoriteState(pageA, itemPath, false);
        await ensureFavoriteState(pageB, itemPath, false);
      });

      await test.step("User A saves the object and the state persists", async () => {
        expect(itemId).toBeTruthy();
        expect(itemPath).toBeTruthy();
        await ensureFavoriteState(pageA, itemPath!, true);
      });

      await test.step("favorite appears only in User A Favorites", async () => {
        await openFavorites(pageA);
        await expect(pageA.getByTestId(`favorite-item-${itemId}`)).toBeVisible({
          timeout: actionTimeout,
        });

        await openFavorites(pageB);
        await expect(pageB.getByTestId(`favorite-item-${itemId}`)).toHaveCount(0);
      });

      await test.step("User A removes the favorite and persistence is cleared", async () => {
        await ensureFavoriteState(pageA, itemPath!, false);
        await openFavorites(pageA);
        await expect(pageA.getByTestId(`favorite-item-${itemId}`)).toHaveCount(0);
      });
    } catch (error) {
      primaryError = error;
    } finally {
      if (itemId && itemPath) {
        try {
          await ensureFavoriteState(pageA, itemPath, false);
          await ensureFavoriteState(pageB, itemPath, false);
          await archiveObject(pageA, itemId);
        } catch {
          // Preserve the primary failure; cleanup is best-effort and idempotent.
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
        await mainContent(pageA).locator("button").first().click();
        const wantedForm = mainContent(pageA)
          .locator("div.rounded-2xl", { has: pageA.locator("input") })
          .first();
        await wantedForm.locator("input").nth(0).fill(title);
        await wantedForm.locator("textarea").first().fill(description);

        const createResponsePromise = pageA.waitForResponse(isWantedCreateResponse, {
          timeout: actionTimeout,
        });
        await wantedForm.locator("button").last().click();
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
        await mainContent(pageB).locator("input").first().fill(title);
        const card = pageB.getByTestId(`wanted-request-${requestId}`);
        await expect(card).toBeVisible({ timeout: actionTimeout });
        await expect(card.getByText(title, { exact: false })).toBeVisible();
        await expect(card.locator("button")).toHaveCount(0);
      });

      await test.step("User A marks the request fulfilled", async () => {
        await openWanted(pageA);
        await mainContent(pageA).locator("button").nth(1).click();
        const card = pageA.getByTestId(`wanted-request-${requestId}`);
        await expect(card).toBeVisible({ timeout: actionTimeout });
        await card.locator("button").nth(1).click();
        await expect(card.getByText("fulfilled", { exact: true })).toBeVisible({
          timeout: actionTimeout,
        });
      });

      await test.step("fulfilled request disappears from User B public list", async () => {
        await openWanted(pageB);
        await mainContent(pageB).locator("input").first().fill(title);
        await expect(pageB.getByTestId(`wanted-request-${requestId}`)).toHaveCount(0);
      });
    } catch (error) {
      primaryError = error;
    } finally {
      if (requestId) await bestEffortWantedCleanup(pageA, requestId);
      await contextA.close();
      await contextB.close();
    }

    if (primaryError) throw primaryError;
  });
});
