import { expect, test, type APIResponse, type Page, type Response } from "@playwright/test";
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

function isMatchingSessionWriteResponse(response: Response) {
  const request = response.request();
  const url = new URL(response.url());
  return request.method() === "POST" && url.pathname.endsWith("/rest/v1/matching_sessions");
}

function isInterestWriteResponse(response: Response) {
  const request = response.request();
  const url = new URL(response.url());
  return request.method() === "POST" && url.pathname.endsWith("/rest/v1/matching_interests");
}

function isAcceptInterestResponse(response: Response) {
  const request = response.request();
  const url = new URL(response.url());
  return (
    request.method() === "POST" &&
    url.pathname.endsWith("/rest/v1/rpc/accept_matching_interest")
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

function parseId(body: string): string | null {
  const parsed = JSON.parse(body) as Array<{ id?: string }> | { id?: string };
  if (Array.isArray(parsed)) return parsed[0]?.id ?? null;
  return parsed.id ?? null;
}

type AcceptInterestPayload = {
  interest_id?: string;
  matching_session_id?: string;
  match_id?: string;
  interest_status?: string;
  match_status?: string;
};

function parseAcceptPayload(body: string): AcceptInterestPayload {
  const parsed = JSON.parse(body) as AcceptInterestPayload[] | AcceptInterestPayload;
  return Array.isArray(parsed) ? (parsed[0] ?? {}) : parsed;
}

function authenticatedRestHeaders(response: Response) {
  const headers = response.request().headers();
  const apikey = headers.apikey;
  const authorization = headers.authorization;

  if (!apikey) {
    throw new Error("Supabase request must contain an apikey header.");
  }
  if (!authorization) {
    throw new Error("Supabase request must contain an Authorization header.");
  }

  return {
    apikey,
    authorization,
    "content-type": "application/json",
  };
}

async function expectJsonOk(response: APIResponse, label: string) {
  const body = await response.text();
  expect(response.ok(), `${label} failed: ${response.status()} ${body}`).toBe(true);
  return body;
}

test.describe("Train C Batch 55 Match Creation", () => {
  test.describe.configure({ retries: 0 });

  test("creates a matching session and idempotently accepts an interest into a match", async ({
    browser,
  }, testInfo) => {
    test.setTimeout(300_000);

    const contextA = await browser.newContext({ storageState: readStorageState(userAAuthFile) });
    const contextB = await browser.newContext({ storageState: readStorageState(userBAuthFile) });
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await preparePage(pageA);
    await preparePage(pageB);

    const suffix = `${Date.now()}-${testInfo.workerIndex}`;
    let sourceItemId: string | null = null;
    let targetItemId: string | null = null;
    let interestId: string | null = null;
    let matchingSessionId: string | null = null;
    let matchId: string | null = null;
    let primaryError: unknown = null;

    try {
      await test.step("verify reusable authenticated sessions", async () => {
        await expectReusableSession(pageA, "User A before Batch 55 lifecycle");
        await expectReusableSession(pageB, "User B before Batch 55 lifecycle");
      });

      await test.step("create source and target objects", async () => {
        sourceItemId = await createObject(
          pageA,
          `Batch 55 source ${suffix}`,
          "Source object owned by User A for the Match Creation contract.",
        );
        targetItemId = await createObject(
          pageB,
          `Batch 55 target ${suffix}`,
          "Target object owned by User B for the Match Creation contract.",
        );
      });

      let interestWriteResponse: Response | null = null;

      await test.step("User A expresses interest and creates or reuses a matching session", async () => {
        expect(sourceItemId).toBeTruthy();
        expect(targetItemId).toBeTruthy();

        await pageA.goto(`${matchingPath}?slot1=${sourceItemId}`, {
          waitUntil: "domcontentloaded",
        });
        await expect
          .poll(() => new URL(pageA.url()).pathname, { timeout: actionTimeout })
          .toBe(matchingPath);

        const sortSelect = pageA.locator("select").first();
        await expect(sortSelect).toBeVisible({ timeout: actionTimeout });
        await sortSelect.selectOption("newest");

        const candidate = pageA.getByTestId(`matching-candidate-${targetItemId}`);
        await expect(candidate).toBeVisible({ timeout: actionTimeout });
        await pageA.getByTestId(`matching-candidate-details-${targetItemId}`).click();
        await expect(pageA.getByTestId(`matching-item-drawer-${targetItemId}`)).toBeVisible({
          timeout: actionTimeout,
        });

        const sessionResponsePromise = pageA.waitForResponse(
          (response) => isMatchingSessionWriteResponse(response),
          { timeout: actionTimeout },
        );
        const interestResponsePromise = pageA.waitForResponse(
          (response) => isInterestWriteResponse(response),
          { timeout: actionTimeout },
        );

        await pageA.getByTestId(`express-interest-submit-${targetItemId}`).click();

        const [sessionResponse, interestResponse] = await Promise.all([
          sessionResponsePromise,
          interestResponsePromise,
        ]);
        const sessionBody = await sessionResponse.text();
        const interestBody = await interestResponse.text();

        expect(
          sessionResponse.ok(),
          `Matching session write failed: ${sessionResponse.status()} ${sessionBody}`,
        ).toBe(true);
        expect(
          interestResponse.ok(),
          `Express Interest failed: ${interestResponse.status()} ${interestBody}`,
        ).toBe(true);

        matchingSessionId = parseId(sessionBody);
        interestId = parseId(interestBody);
        interestWriteResponse = interestResponse;

        expect(matchingSessionId, "Matching session response must include an id.").toBeTruthy();
        expect(interestId, "Express Interest response must include an id.").toBeTruthy();
      });

      let acceptResponse: Response | null = null;

      await test.step("User B accepts the pending interest", async () => {
        await pageB.goto(matchingPath, { waitUntil: "domcontentloaded" });
        await expect(pageB.getByTestId(`received-interest-${interestId}`)).toBeVisible({
          timeout: actionTimeout,
        });

        const responsePromise = pageB.waitForResponse(
          (response) => isAcceptInterestResponse(response),
          { timeout: actionTimeout },
        );
        await pageB.getByTestId(`accept-interest-${interestId}`).click();
        acceptResponse = await responsePromise;

        const body = await acceptResponse.text();
        expect(
          acceptResponse.ok(),
          `Accept Interest failed: ${acceptResponse.status()} ${body}`,
        ).toBe(true);

        const payload = parseAcceptPayload(body);
        expect(payload.interest_id).toBe(interestId);
        expect(payload.matching_session_id).toBe(matchingSessionId);
        expect(payload.interest_status).toBe("accepted");
        expect(payload.match_status).toBe("accepted");
        expect(payload.match_id, "Accept Interest response must include a match id.").toBeTruthy();
        matchId = payload.match_id ?? null;

        await expect(pageB.getByTestId(`received-interest-${interestId}`)).toHaveCount(0);
      });

      await test.step("accepted state and participant match are persisted", async () => {
        expect(acceptResponse).toBeTruthy();
        expect(interestWriteResponse).toBeTruthy();
        expect(matchId).toBeTruthy();

        const restOrigin = new URL(acceptResponse!.url()).origin;
        const userBHeaders = authenticatedRestHeaders(acceptResponse!);
        const userAHeaders = authenticatedRestHeaders(interestWriteResponse!);

        const matchResponse = await pageB.request.get(
          `${restOrigin}/rest/v1/matches?select=id,status,initiator_item_id,target_item_id&id=eq.${matchId}`,
          { headers: userBHeaders },
        );
        const matchBody = await expectJsonOk(matchResponse, "Participant match query");
        const matches = JSON.parse(matchBody) as Array<{
          id: string;
          status: string;
          initiator_item_id: string;
          target_item_id: string;
        }>;

        expect(matches).toEqual([
          {
            id: matchId,
            status: "accepted",
            initiator_item_id: sourceItemId,
            target_item_id: targetItemId,
          },
        ]);

        const sessionResponse = await pageA.request.get(
          `${restOrigin}/rest/v1/matching_sessions?select=id,user_id,slot_1_item_id&id=eq.${matchingSessionId}`,
          { headers: userAHeaders },
        );
        const sessionBody = await expectJsonOk(sessionResponse, "Initiator session query");
        const sessions = JSON.parse(sessionBody) as Array<{
          id: string;
          user_id: string;
          slot_1_item_id: string;
        }>;

        expect(sessions).toHaveLength(1);
        expect(sessions[0]?.id).toBe(matchingSessionId);
        expect(sessions[0]?.slot_1_item_id).toBe(sourceItemId);

        await pageA.reload({ waitUntil: "domcontentloaded" });
        await expect(pageA.getByTestId(`express-interest-${targetItemId}`)).toHaveCount(0);

        await pageB.reload({ waitUntil: "domcontentloaded" });
        await expect(pageB.getByTestId(`received-interest-${interestId}`)).toHaveCount(0);
      });

      await test.step("accepting the same interest again reuses the same session and match", async () => {
        expect(acceptResponse).toBeTruthy();
        expect(interestId).toBeTruthy();

        const repeatResponse = await pageB.request.post(acceptResponse!.url(), {
          headers: authenticatedRestHeaders(acceptResponse!),
          data: { p_interest_id: interestId },
        });
        const repeatBody = await expectJsonOk(repeatResponse, "Idempotent accept");
        const payload = parseAcceptPayload(repeatBody);

        expect(payload.interest_id).toBe(interestId);
        expect(payload.matching_session_id).toBe(matchingSessionId);
        expect(payload.match_id).toBe(matchId);
        expect(payload.interest_status).toBe("accepted");
        expect(payload.match_status).toBe("accepted");
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

      if (!primaryError && cleanupErrors.length > 0) throw cleanupErrors[0];
    }
  });
});
