import {
  expect,
  test,
  type APIResponse,
  type Page,
  type Response,
} from "@playwright/test";
import { readFileSync } from "node:fs";
import {
  expectAuthenticatedSession,
  userAAuthFile,
  userBAuthFile,
} from "./two-user-auth.setup";

const objectCreatePath = "/en/objects/new";
const myObjectsPath = "/en/my-objects";
const matchingPath = "/en/matching";
const chatPath = "/en/chat";
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
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "{}",
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

function isMatchingCandidateResponse(response: Response) {
  const request = response.request();
  if (request.method() !== "GET") return false;

  const url = new URL(response.url());
  const selectedColumns = url.searchParams.get("select") ?? "";

  return (
    url.pathname.endsWith("/rest/v1/items") &&
    url.searchParams.get("is_active") === "eq.true" &&
    url.searchParams.get("status") === "eq.active" &&
    url.searchParams.get("limit") === "100" &&
    selectedColumns.includes("perceived_value_tier")
  );
}

function isMatchingSessionWriteResponse(response: Response) {
  const request = response.request();
  const url = new URL(response.url());
  return (
    request.method() === "POST" &&
    url.pathname.endsWith("/rest/v1/matching_sessions")
  );
}

function isInterestWriteResponse(response: Response) {
  const request = response.request();
  const url = new URL(response.url());
  return (
    request.method() === "POST" &&
    url.pathname.endsWith("/rest/v1/matching_interests")
  );
}

function isAcceptInterestResponse(response: Response) {
  const request = response.request();
  const url = new URL(response.url());
  return (
    request.method() === "POST" &&
    url.pathname.endsWith("/rest/v1/rpc/accept_matching_interest")
  );
}

function isMessageWriteResponse(response: Response) {
  const request = response.request();
  const url = new URL(response.url());
  return (
    request.method() === "POST" && url.pathname.endsWith("/rest/v1/messages")
  );
}

async function createObject(
  page: Page,
  title: string,
  description: string,
): Promise<string> {
  await page.goto(objectCreatePath, { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/en\/objects\/new/);

  const origin = new URL(page.url()).origin;
  const imageUrl = `${origin}/icons/icon-512x512.png`;

  await page
    .getByPlaceholder("https://example.com/product.jpg", { exact: true })
    .fill(imageUrl);
  await page.getByRole("button", { name: "Use", exact: true }).click();
  await expect(
    page.getByRole("img", { name: "Photo 1", exact: true }),
  ).toBeVisible({
    timeout: actionTimeout,
  });

  const titleInput = page.getByPlaceholder("What are you offering?", {
    exact: true,
  });
  await expect(titleInput).toBeEnabled({ timeout: actionTimeout });
  await titleInput.fill(title);

  await page.getByRole("button").filter({ hasText: "Electronics" }).click();
  await page.getByRole("button", { name: "Computers", exact: true }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();

  await page
    .locator("button")
    .filter({ has: page.getByText("Good", { exact: true }) })
    .click();
  await page
    .locator("button")
    .filter({ has: page.getByText("Medium", { exact: true }) })
    .click();
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
  await page
    .getByRole("button", { name: "Publish Listing", exact: true })
    .click();
  const response = await responsePromise;
  const body = await response.text();

  expect(
    response.ok(),
    `Item creation failed: ${response.status()} ${body}`,
  ).toBe(true);
  const itemId = parseId(body);
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
  await expect(
    itemLink,
    `Cleanup could not find object ${itemId}.`,
  ).toBeVisible({
    timeout: actionTimeout,
  });

  const card = itemLink.locator(
    "xpath=ancestor::div[contains(@class,'overflow-hidden')][1]",
  );
  const expandButton = card.getByRole("button", {
    name: "Expand details",
    exact: true,
  });
  if (await expandButton.isVisible().catch(() => false))
    await expandButton.click();

  const archiveButton = card.getByRole("button", {
    name: "Archive",
    exact: true,
  });
  if (!(await archiveButton.isVisible({ timeout: 3_000 }).catch(() => false)))
    return;

  const responsePromise = page.waitForResponse(
    (response) => isItemsWriteResponse(response, itemId),
    { timeout: actionTimeout },
  );
  await archiveButton.click();
  const response = await responsePromise;
  expect(
    response.ok(),
    `${label} object cleanup failed with ${response.status()}.`,
  ).toBe(true);
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
  conversation_id?: string;
  interest_status?: string;
  match_status?: string;
};

function parseAcceptPayload(body: string): AcceptInterestPayload {
  const parsed = JSON.parse(body) as
    | AcceptInterestPayload[]
    | AcceptInterestPayload;
  return Array.isArray(parsed) ? (parsed[0] ?? {}) : parsed;
}

function authenticatedRestHeaders(response: Response) {
  const headers = response.request().headers();
  const apikey = headers.apikey;
  const authorization = headers.authorization;

  if (!apikey)
    throw new Error("Supabase request must contain an apikey header.");
  if (!authorization)
    throw new Error("Supabase request must contain an Authorization header.");

  return {
    apikey,
    authorization,
    "content-type": "application/json",
  };
}

async function expectJsonOk(response: APIResponse, label: string) {
  const body = await response.text();
  expect(response.ok(), `${label} failed: ${response.status()} ${body}`).toBe(
    true,
  );
  return body;
}

async function expectAnonymousIsolation(response: APIResponse, label: string) {
  const body = await response.text();

  if (response.ok()) {
    expect(
      JSON.parse(body),
      `${label} exposed participant data to anon.`,
    ).toEqual([]);
    return;
  }

  expect(
    [401, 403],
    `${label} unexpected status: ${response.status()} ${body}`,
  ).toContain(response.status());
}

test.describe("Train C Batch 56 Match Conversation", () => {
  test.describe.configure({ retries: 0 });

  test("creates one private conversation and persists the first participant message", async ({
    browser,
  }, testInfo) => {
    test.setTimeout(300_000);

    const contextA = await browser.newContext({
      storageState: readStorageState(userAAuthFile),
    });
    const contextB = await browser.newContext({
      storageState: readStorageState(userBAuthFile),
    });
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await preparePage(pageA);
    await preparePage(pageB);

    const suffix = `${Date.now()}-${testInfo.workerIndex}`;
    const sourceTitle = `Batch 56 source ${suffix}`;
    const targetTitle = `Batch 56 target ${suffix}`;
    const firstMessage = `Batch 56 hello ${suffix}`;

    let sourceItemId: string | null = null;
    let targetItemId: string | null = null;
    let interestId: string | null = null;
    let matchingSessionId: string | null = null;
    let matchId: string | null = null;
    let conversationId: string | null = null;
    let messageId: string | null = null;
    let interestWriteResponse: Response | null = null;
    let acceptResponse: Response | null = null;
    let primaryError: unknown = null;

    try {
      await test.step("verify reusable authenticated sessions", async () => {
        await expectReusableSession(pageA, "User A before Batch 56 lifecycle");
        await expectReusableSession(pageB, "User B before Batch 56 lifecycle");
      });

      await test.step("create source and target objects", async () => {
        sourceItemId = await createObject(
          pageA,
          sourceTitle,
          "Source object owned by User A for the Match Conversation contract.",
        );
        targetItemId = await createObject(
          pageB,
          targetTitle,
          "Target object owned by User B for the Match Conversation contract.",
        );
      });

      await test.step("User A expresses interest in the hydrated target candidate", async () => {
        expect(sourceItemId).toBeTruthy();
        expect(targetItemId).toBeTruthy();

        const candidatesResponsePromise = pageA.waitForResponse(
          isMatchingCandidateResponse,
          { timeout: actionTimeout },
        );

        await pageA.goto(`${matchingPath}?slot1=${sourceItemId}`, {
          waitUntil: "domcontentloaded",
        });
        await expect
          .poll(() => new URL(pageA.url()).pathname, { timeout: actionTimeout })
          .toBe(matchingPath);

        const candidatesResponse = await candidatesResponsePromise;
        const candidatesBody = await candidatesResponse.text();
        expect(
          candidatesResponse.ok(),
          `Matching candidate query failed: ${candidatesResponse.status()} ${candidatesBody}`,
        ).toBe(true);

        const candidateRows = JSON.parse(candidatesBody) as Array<{
          id?: string;
        }>;
        expect(
          candidateRows.some((row) => row.id === targetItemId),
          `Matching candidate query did not include target item ${targetItemId}.`,
        ).toBe(true);

        const sortSelect = pageA.locator("select").first();
        await expect(sortSelect).toBeVisible({ timeout: actionTimeout });
        await sortSelect.selectOption("newest");
        await expect(sortSelect).toHaveValue("newest", {
          timeout: actionTimeout,
        });

        const candidate = pageA.getByTestId(
          `matching-candidate-${targetItemId}`,
        );
        await expect(candidate).toBeVisible({ timeout: actionTimeout });
        await pageA
          .getByTestId(`matching-candidate-details-${targetItemId}`)
          .click();
        await expect(
          pageA.getByTestId(`matching-item-drawer-${targetItemId}`),
        ).toBeVisible({
          timeout: actionTimeout,
        });

        const sessionResponsePromise = pageA.waitForResponse(
          isMatchingSessionWriteResponse,
          { timeout: actionTimeout },
        );
        const interestResponsePromise = pageA.waitForResponse(
          isInterestWriteResponse,
          { timeout: actionTimeout },
        );

        await pageA
          .getByTestId(`express-interest-submit-${targetItemId}`)
          .click();

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

        expect(matchingSessionId).toBeTruthy();
        expect(interestId).toBeTruthy();
      });

      await test.step("User B accepts and receives one Open Chat action", async () => {
        await pageB.goto(matchingPath, { waitUntil: "domcontentloaded" });
        await expect(
          pageB.getByTestId(`received-interest-${interestId}`),
        ).toBeVisible({
          timeout: actionTimeout,
        });

        const responsePromise = pageB.waitForResponse(
          isAcceptInterestResponse,
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
        expect(payload.match_id).toBeTruthy();
        expect(payload.conversation_id).toBeTruthy();

        matchId = payload.match_id ?? null;
        conversationId = payload.conversation_id ?? null;

        await expect(
          pageB.getByTestId(`received-interest-${interestId}`),
        ).toHaveCount(0);
        await expect(
          pageB.getByTestId(`accepted-match-chat-${interestId}`),
        ).toBeVisible({
          timeout: actionTimeout,
        });
        await expect(
          pageB.getByTestId(`open-match-chat-${interestId}`),
        ).toBeVisible({
          timeout: actionTimeout,
        });
      });

      await test.step("User B opens the match conversation and sends the first message", async () => {
        expect(conversationId).toBeTruthy();

        await pageB.getByTestId(`open-match-chat-${interestId}`).click();
        await expect
          .poll(() => new URL(pageB.url()).pathname, { timeout: actionTimeout })
          .toBe(chatPath);
        await expect
          .poll(() => new URL(pageB.url()).searchParams.get("conversation"), {
            timeout: actionTimeout,
          })
          .toBe(conversationId);

        await expect(
          pageB.getByTestId("match-conversation-header"),
        ).toBeVisible({
          timeout: actionTimeout,
        });
        await expect(
          pageB.getByTestId("match-conversation-items"),
        ).toContainText(sourceTitle, {
          timeout: actionTimeout,
        });
        await expect(
          pageB.getByTestId("match-conversation-items"),
        ).toContainText(targetTitle, {
          timeout: actionTimeout,
        });

        const messageResponsePromise = pageB.waitForResponse(
          isMessageWriteResponse,
          { timeout: actionTimeout },
        );

        await pageB.getByTestId("match-message-input").fill(firstMessage);
        await pageB.getByTestId("match-message-send").click();

        const messageResponse = await messageResponsePromise;
        const messageBody = await messageResponse.text();
        expect(
          messageResponse.ok(),
          `Message write failed: ${messageResponse.status()} ${messageBody}`,
        ).toBe(true);

        messageId = parseId(messageBody);
        expect(messageId, "Message response must include an id.").toBeTruthy();

        await expect(
          pageB.getByTestId(`conversation-message-content-${messageId}`),
        ).toHaveText(firstMessage, { timeout: actionTimeout });
      });

      await test.step("User A reads the same persisted conversation after reload", async () => {
        expect(conversationId).toBeTruthy();
        expect(messageId).toBeTruthy();

        await pageA.goto(`${chatPath}?conversation=${conversationId}`, {
          waitUntil: "domcontentloaded",
        });

        await expect(
          pageA.getByTestId("match-conversation-header"),
        ).toBeVisible({
          timeout: actionTimeout,
        });
        await expect(
          pageA.getByTestId(`conversation-message-content-${messageId}`),
        ).toHaveText(firstMessage, { timeout: actionTimeout });

        await pageA.reload({ waitUntil: "domcontentloaded" });
        await expect(
          pageA.getByTestId(`conversation-message-content-${messageId}`),
        ).toHaveText(firstMessage, { timeout: actionTimeout });
      });

      await test.step("conversation and message are participant-only and idempotent", async () => {
        expect(acceptResponse).toBeTruthy();
        expect(interestWriteResponse).toBeTruthy();
        expect(matchId).toBeTruthy();
        expect(conversationId).toBeTruthy();
        expect(messageId).toBeTruthy();

        const restOrigin = new URL(acceptResponse!.url()).origin;
        const userBHeaders = authenticatedRestHeaders(acceptResponse!);
        const userAHeaders = authenticatedRestHeaders(interestWriteResponse!);

        const conversationResponse = await pageA.request.get(
          `${restOrigin}/rest/v1/conversations?select=id,match_id,swap_id,participant_ids,item_ids&id=eq.${conversationId}`,
          { headers: userAHeaders },
        );
        const conversationBody = await expectJsonOk(
          conversationResponse,
          "Participant conversation query",
        );
        const conversations = JSON.parse(conversationBody) as Array<{
          id: string;
          match_id: string;
          swap_id: string | null;
          participant_ids: string[];
          item_ids: string[];
        }>;

        expect(conversations).toHaveLength(1);
        expect(conversations[0]?.id).toBe(conversationId);
        expect(conversations[0]?.match_id).toBe(matchId);
        expect(conversations[0]?.swap_id).toBeNull();
        expect(conversations[0]?.participant_ids).toHaveLength(2);
        expect(conversations[0]?.item_ids).toEqual([
          sourceItemId,
          targetItemId,
        ]);

        const messageResponse = await pageB.request.get(
          `${restOrigin}/rest/v1/messages?select=id,conversation_id,match_id,swap_id,sender_id,recipient_id,content&id=eq.${messageId}`,
          { headers: userBHeaders },
        );
        const messageBody = await expectJsonOk(
          messageResponse,
          "Participant message query",
        );
        const messages = JSON.parse(messageBody) as Array<{
          id: string;
          conversation_id: string;
          match_id: string;
          swap_id: string | null;
          content: string;
        }>;

        expect(messages).toEqual([
          expect.objectContaining({
            id: messageId,
            conversation_id: conversationId,
            match_id: matchId,
            swap_id: null,
            content: firstMessage,
          }),
        ]);

        const anonHeaders = {
          apikey: userAHeaders.apikey,
          "content-type": "application/json",
        };

        const anonConversationResponse = await pageA.request.get(
          `${restOrigin}/rest/v1/conversations?select=id&id=eq.${conversationId}`,
          { headers: anonHeaders },
        );
        await expectAnonymousIsolation(
          anonConversationResponse,
          "Anonymous conversation query",
        );

        const anonMessageResponse = await pageA.request.get(
          `${restOrigin}/rest/v1/messages?select=id&id=eq.${messageId}`,
          { headers: anonHeaders },
        );
        await expectAnonymousIsolation(
          anonMessageResponse,
          "Anonymous message query",
        );

        const repeatResponse = await pageB.request.post(acceptResponse!.url(), {
          headers: userBHeaders,
          data: { p_interest_id: interestId },
        });
        const repeatBody = await expectJsonOk(
          repeatResponse,
          "Idempotent accept",
        );
        const repeatPayload = parseAcceptPayload(repeatBody);

        expect(repeatPayload.match_id).toBe(matchId);
        expect(repeatPayload.conversation_id).toBe(conversationId);

        const duplicateResponse = await pageB.request.get(
          `${restOrigin}/rest/v1/conversations?select=id,match_id&match_id=eq.${matchId}`,
          { headers: userBHeaders },
        );
        const duplicateBody = await expectJsonOk(
          duplicateResponse,
          "Conversation uniqueness query",
        );
        expect(JSON.parse(duplicateBody)).toEqual([
          {
            id: conversationId,
            match_id: matchId,
          },
        ]);

        const matchResponse = await pageB.request.get(
          `${restOrigin}/rest/v1/matches?select=id,status,converted_swap_id&id=eq.${matchId}`,
          { headers: userBHeaders },
        );
        const matchBody = await expectJsonOk(
          matchResponse,
          "No Exchange side-effect query",
        );
        expect(JSON.parse(matchBody)).toEqual([
          {
            id: matchId,
            status: "accepted",
            converted_swap_id: null,
          },
        ]);
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
