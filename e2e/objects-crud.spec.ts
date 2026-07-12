import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { userAAuthFile, userBAuthFile } from "./two-user-auth.setup";

const objectCreatePath = "/en/objects/new";
const myObjectsPath = "/en/my-objects";
const actionTimeout = 20_000;

function readStorageState(path: string) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function mainContent(page: Page) {
  return page.getByRole("main");
}

async function expectObjectDetails(page: Page, title: string, description: string) {
  const main = mainContent(page);

  await expect(main.getByRole("heading", { name: title, exact: true })).toBeVisible({
    timeout: actionTimeout,
  });
  await expect(main.getByText(description, { exact: true })).toBeVisible({
    timeout: actionTimeout,
  });
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

  await page.route("**/api/translate/item", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({}),
    });
  });
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
    (response) => {
      const request = response.request();
      return (
        request.method() === "POST" &&
        new URL(response.url()).pathname.endsWith("/rest/v1/items")
      );
    },
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
  ).toBeVisible({
    timeout: actionTimeout,
  });
  await expect
    .poll(() => new URL(page.url()).pathname, { timeout: actionTimeout })
    .toBe(`/en/objects/${itemId}`);

  return itemId!;
}

async function archiveObject(page: Page, title: string) {
  await page.goto(myObjectsPath, { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/en\/my-objects/);

  const main = mainContent(page);
  const search = main.getByPlaceholder("Search your items...", { exact: true });
  await expect(search).toBeVisible({ timeout: actionTimeout });
  await search.fill(title);

  const itemLink = main.getByRole("link", { name: title, exact: true });
  if (!(await itemLink.isVisible({ timeout: 5_000 }).catch(() => false))) return;

  const card = itemLink.locator("xpath=ancestor::div[contains(@class,'overflow-hidden')][1]");
  await card.getByRole("button", { name: "Expand details", exact: true }).click();
  await card.getByRole("button", { name: "Delete", exact: true }).click();

  const archiveResponsePromise = page.waitForResponse(
    (response) => {
      const request = response.request();
      return (
        request.method() === "POST" &&
        new URL(response.url()).pathname.endsWith("/rest/v1/items")
      );
    },
    { timeout: actionTimeout },
  );

  await card.getByRole("button", { name: "Archive instead", exact: true }).click();
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
    let currentTitle = originalTitle;
    let primaryError: unknown | null = null;

    try {
      createdItemId = await createObject(pageA, originalTitle, originalDescription);

      await expectObjectDetails(pageA, originalTitle, originalDescription);
      await expect(
        mainContent(pageA).getByRole("link", { name: "Edit object", exact: true }),
      ).toBeVisible({
        timeout: actionTimeout,
      });

      await pageA.reload({ waitUntil: "domcontentloaded" });
      await expectObjectDetails(pageA, originalTitle, originalDescription);

      await pageB.goto(`/en/objects/${createdItemId}`, { waitUntil: "domcontentloaded" });
      await expectObjectDetails(pageB, originalTitle, originalDescription);
      await expect(
        mainContent(pageB).getByRole("link", { name: "Edit object", exact: true }),
      ).toHaveCount(0);

      await pageB.goto(`/en/objects/${createdItemId}/edit`, { waitUntil: "domcontentloaded" });
      await pageB.waitForTimeout(1_000);
      await expect(
        mainContent(pageB).getByRole("button", { name: "Save", exact: true }),
      ).toHaveCount(0);

      await pageA.goto(`/en/objects/${createdItemId}`, { waitUntil: "domcontentloaded" });
      await mainContent(pageA).getByRole("link", { name: "Edit object", exact: true }).click();
      await expect
        .poll(() => new URL(pageA.url()).pathname, { timeout: actionTimeout })
        .toBe(`/en/objects/${createdItemId}/edit`);

      const editMain = mainContent(pageA);
      await editMain.getByLabel("Title *", { exact: true }).fill(editedTitle);
      await editMain
        .getByPlaceholder(
          "Describe the object in detail: condition, defects, included accessories...",
          { exact: true },
        )
        .fill(editedDescription);

      const updateResponsePromise = pageA.waitForResponse(
        (response) => {
          const request = response.request();
          return (
            request.method() === "POST" &&
            new URL(response.url()).pathname.endsWith("/rest/v1/items")
          );
        },
        { timeout: actionTimeout },
      );

      await editMain.getByRole("button", { name: "Save", exact: true }).click();
      const updateResponse = await updateResponsePromise;
      const updateBody = updateResponse.ok() ? "" : await updateResponse.text();
      expect(
        updateResponse.ok(),
        `Item update failed: ${updateResponse.status()} ${updateBody}`,
      ).toBe(true);

      currentTitle = editedTitle;
      await expect
        .poll(() => new URL(pageA.url()).pathname, { timeout: actionTimeout })
        .toBe(`/en/objects/${createdItemId}`);
      await expectObjectDetails(pageA, editedTitle, editedDescription);

      await pageA.reload({ waitUntil: "domcontentloaded" });
      await expectObjectDetails(pageA, editedTitle, editedDescription);
    } catch (error) {
      primaryError = error;
    }

    let cleanupError: unknown | null = null;

    if (createdItemId) {
      try {
        await test.step("archive the Batch 52 test object", async () => {
          await archiveObject(pageA, currentTitle);
          await pageA.goto(`/en/objects/${createdItemId}`, { waitUntil: "domcontentloaded" });
          await expect(
            mainContent(pageA).getByText(
              "Object not found or not publicly available. Navigate back to the objects list.",
              { exact: true },
            ),
          ).toBeVisible({
            timeout: actionTimeout,
          });
        });
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
