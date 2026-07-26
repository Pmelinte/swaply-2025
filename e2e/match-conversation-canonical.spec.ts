import { expect, test, type APIResponse, type Page, type Response } from "@playwright/test";
import { readFileSync } from "node:fs";
import {
  expectAuthenticatedSession,
  userAAuthFile,
  userBAuthFile,
} from "./two-user-auth.setup";

const actionTimeout = 20_000;

function readStorageState(path: string) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function currentLocale(page: Page) {
  const [, locale] = new URL(page.url()).pathname.split("/");
  return locale || "en";
}

function localizedPath(page: Page, route: string) {
  return `/${currentLocale(page)}${route}`;
}

async function establishLocale(page: Page) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect
    .poll(() => new URL(page.url()).pathname.split("/")[1] || "", { timeout: actionTimeout })
    .not.toBe("");
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
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ translated: "" }),
    });
  });
}

async function expectReusableSession(page: Page, label: string) {
  await establishLocale(page);
  const profilePath = localizedPath(page, "/profile");
  await page.goto(profilePath, { waitUntil: "domcontentloaded" });
  await expect.poll(() => new URL(page.url()).pathname, { timeout: actionTimeout }).toBe(profilePath);
  await expectAuthenticatedSession(page, label);
}

function isItemsWriteResponse(response: Response) {
  return response.request().method() === "POST" && new URL(response.url()).pathname.endsWith("/rest/v1/items");
}

function isExpressInterestResponse(response: Response) {
  return (
    response.request().method() === "POST" &&
    new URL(response.url()).pathname.endsWith("/rest/v1/rpc/express_matching_interest")
  );
}

function isAcceptInterestResponse(response: Response) {
  return (
    response.request().method() === "POST" &&
    new URL(response.url()).pathname.endsWith("/rest/v1/rpc/accept_matching_interest")
  );
}

function parseFirst<T>(body: string): T {
  const parsed = JSON.parse(body) as T | T[];
  return Array.isArray(parsed) ? parsed[0]! : parsed;
}

function authenticatedRestHeaders(response: Response) {
  const headers = response.request().headers();
  expect(headers.apikey).toBeTruthy();
  expect(headers.authorization).toBeTruthy();
  return {
    apikey: headers.apikey!,
    authorization: headers.authorization!,
    "content-type": "application/json",
  };
}

async function expectJsonOk(response: APIResponse, label: string) {
  const body = await response.text();
  expect(response.ok(), `${label} failed: ${response.status()} ${body}`).toBe(true);
  return body;
}

async function createObject(page: Page, title: string): Promise<string> {
  await page.goto(localizedPath(page, "/objects/new"), { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/[^/]+\/objects\/new/);

  const imageUrl = `${new URL(page.url()).origin}/icons/icon-512x512.png`;
  await page.getByPlaceholder("https://example.com/product.jpg", { exact: true }).fill(imageUrl);
  await page.getByRole("button", { name: "Use", exact: true }).click();
  await expect(page.getByRole("img", { name: "Photo 1", exact: true })).toBeVisible({ timeout: actionTimeout });

  await page.getByPlaceholder("What are you offering?", { exact: true }).fill(title);
  await page.getByRole("button").filter({ hasText: "Electronics" }).click();
  await page.getByRole("button", { name: "Computers", exact: true }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.locator("button").filter({ has: page.getByText("Good", { exact: true }) }).click();
  await page.locator("button").filter({ has: page.getByText("Medium", { exact: true }) }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByPlaceholder("Describe the item in detail...", { exact: true }).fill("Canonical conversation E2E object.");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.locator("button").filter({ hasText: "Objects only" }).click();
  await page.getByPlaceholder("Describe what you're looking for...", { exact: true }).fill("Another useful object.");
  await page.getByRole("button", { name: "Adjacent", exact: true }).click();
  await page.getByRole("button", { name: "Moderate", exact: true }).click();
  await page.locator("button").filter({ hasText: "Local" }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();

  const responsePromise = page.waitForResponse(isItemsWriteResponse, { timeout: actionTimeout });
  await page.getByRole("button", { name: "Publish Listing", exact: true }).click();
  const response = await responsePromise;
  const body = await response.text();
  expect(response.ok(), `Item creation failed: ${response.status()} ${body}`).toBe(true);
  const row = parseFirst<{ id: string }>(body);
  expect(row.id).toBeTruthy();
  await expect.poll(() => new URL(page.url()).pathname, { timeout: actionTimeout }).toBe(localizedPath(page, `/objects/${row.id}`));
  return row.id;
}

test.describe("Train C Batch 56 canonical match conversation", () => {
  test("creates one participant-only conversation and persists a message", async ({ browser }, testInfo) => {
    test.setTimeout(300_000);

    const contextA = await browser.newContext({ storageState: readStorageState(userAAuthFile) });
    const contextB = await browser.newContext({ storageState: readStorageState(userBAuthFile) });
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();
    await preparePage(pageA);
    await preparePage(pageB);

    const suffix = `${Date.now()}-${testInfo.workerIndex}`;
    await expectReusableSession(pageA, "User A before canonical conversation");
    await expectReusableSession(pageB, "User B before canonical conversation");

    const sourceItemId = await createObject(pageA, `Canonical source ${suffix}`);
    const targetItemId = await createObject(pageB, `Canonical target ${suffix}`);

    const matchingPathA = localizedPath(pageA, "/matching");
    await pageA.goto(`${matchingPathA}?slot1=${sourceItemId}`, { waitUntil: "domcontentloaded" });
    await expect(pageA.getByTestId(`matching-candidate-${targetItemId}`)).toBeVisible({ timeout: actionTimeout });
    await pageA.getByTestId(`matching-candidate-details-${targetItemId}`).click();

    const expressPromise = pageA.waitForResponse(isExpressInterestResponse, { timeout: actionTimeout });
    await pageA.getByTestId(`express-interest-submit-${targetItemId}`).click();
    const expressResponse = await expressPromise;
    const expressBody = await expressResponse.text();
    expect(expressResponse.ok(), `Express interest failed: ${expressResponse.status()} ${expressBody}`).toBe(true);
    const expressed = parseFirst<{ id: string; to_item_id: string }>(expressBody);
    expect(expressed.to_item_id).toBe(targetItemId);

    const matchingPathB = localizedPath(pageB, "/matching");
    await pageB.goto(matchingPathB, { waitUntil: "domcontentloaded" });
    await expect(pageB.getByTestId(`received-interest-${expressed.id}`)).toBeVisible({ timeout: actionTimeout });

    const acceptPromise = pageB.waitForResponse(isAcceptInterestResponse, { timeout: actionTimeout });
    await pageB.getByTestId(`accept-interest-${expressed.id}`).click();
    const acceptResponse = await acceptPromise;
    const acceptBody = await acceptResponse.text();
    expect(acceptResponse.ok(), `Accept interest failed: ${acceptResponse.status()} ${acceptBody}`).toBe(true);
    const accepted = parseFirst<{
      match_id: string;
      conversation_id: string;
      matching_session_id: string;
      interest_status: string;
      match_status: string;
    }>(acceptBody);
    expect(accepted.interest_status).toBe("accepted");
    expect(accepted.match_status).toBe("accepted");
    expect(accepted.match_id).toBeTruthy();
    expect(accepted.conversation_id).toBeTruthy();

    const restOrigin = new URL(acceptResponse.url()).origin;
    const userAHeaders = authenticatedRestHeaders(expressResponse);
    const userBHeaders = authenticatedRestHeaders(acceptResponse);

    const conversationResponse = await pageA.request.get(
      `${restOrigin}/rest/v1/conversations?select=id,match_id,participant_ids,item_ids&id=eq.${accepted.conversation_id}`,
      { headers: userAHeaders },
    );
    const conversationBody = await expectJsonOk(conversationResponse, "Participant conversation query");
    const conversations = JSON.parse(conversationBody) as Array<{
      id: string;
      match_id: string;
      participant_ids: string[];
      item_ids: string[];
    }>;
    expect(conversations).toHaveLength(1);
    expect(conversations[0]?.match_id).toBe(accepted.match_id);
    expect(conversations[0]?.item_ids).toEqual([sourceItemId, targetItemId]);

    const messageText = `Canonical message ${suffix}`;
    const messageResponse = await pageB.request.post(`${restOrigin}/rest/v1/messages`, {
      headers: { ...userBHeaders, Prefer: "return=representation" },
      data: {
        conversation_id: accepted.conversation_id,
        match_id: accepted.match_id,
        sender_id: conversations[0]!.participant_ids.find(Boolean),
        recipient_id: conversations[0]!.participant_ids.find((id) => id !== conversations[0]!.participant_ids[0]),
        content: messageText,
      },
    });
    const messageBody = await expectJsonOk(messageResponse, "Participant message write");
    const message = parseFirst<{ id: string; content: string }>(messageBody);
    expect(message.content).toBe(messageText);

    const persistedMessageResponse = await pageA.request.get(
      `${restOrigin}/rest/v1/messages?select=id,conversation_id,match_id,content&id=eq.${message.id}`,
      { headers: userAHeaders },
    );
    const persistedMessageBody = await expectJsonOk(persistedMessageResponse, "Participant message query");
    expect(JSON.parse(persistedMessageBody)).toEqual([
      {
        id: message.id,
        conversation_id: accepted.conversation_id,
        match_id: accepted.match_id,
        content: messageText,
      },
    ]);

    const anonResponse = await pageA.request.get(
      `${restOrigin}/rest/v1/conversations?select=id&id=eq.${accepted.conversation_id}`,
      { headers: { apikey: userAHeaders.apikey } },
    );
    if (anonResponse.ok()) {
      expect(JSON.parse(await anonResponse.text())).toEqual([]);
    } else {
      expect([401, 403]).toContain(anonResponse.status());
    }

    const repeatResponse = await pageB.request.post(acceptResponse.url(), {
      headers: userBHeaders,
      data: { p_interest_id: expressed.id },
    });
    const repeatBody = await expectJsonOk(repeatResponse, "Idempotent accept");
    const repeated = parseFirst<{ match_id: string; conversation_id: string }>(repeatBody);
    expect(repeated.match_id).toBe(accepted.match_id);
    expect(repeated.conversation_id).toBe(accepted.conversation_id);

    await contextA.close().catch(() => undefined);
    await contextB.close().catch(() => undefined);
  });
});
