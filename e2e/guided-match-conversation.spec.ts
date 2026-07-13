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

const chatPath = "/en/chat";
const profilePath = "/en/profile";
const actionTimeout = 20_000;

function readStorageState(path: string) {
  return JSON.parse(readFileSync(path, "utf8"));
}

async function preparePage(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("cookie_consent", "rejected");
    window.localStorage.setItem("swaply_cookie_consent", "rejected");
  });
}

async function expectReusableSession(page: Page, label: string) {
  await page.goto(profilePath, { waitUntil: "domcontentloaded" });
  await expect
    .poll(() => new URL(page.url()).pathname, { timeout: actionTimeout })
    .toBe(profilePath);
  await expectAuthenticatedSession(page, label);
}

function isConversationListResponse(response: Response) {
  const request = response.request();
  const url = new URL(response.url());
  return (
    request.method() === "GET" &&
    url.pathname.endsWith("/rest/v1/conversations") &&
    (url.searchParams.get("select") ?? "").includes("agenda_state")
  );
}

function isAgendaUpdateResponse(response: Response) {
  const request = response.request();
  const url = new URL(response.url());
  return (
    request.method() === "POST" &&
    url.pathname.endsWith(
      "/rest/v1/rpc/update_match_conversation_agenda",
    )
  );
}

function isMessageWriteResponse(response: Response) {
  const request = response.request();
  const url = new URL(response.url());
  return (
    request.method() === "POST" && url.pathname.endsWith("/rest/v1/messages")
  );
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

async function expectAnonymousDenied(response: APIResponse, label: string) {
  const body = await response.text();
  expect(
    [401, 403],
    `${label} unexpected status: ${response.status()} ${body}`,
  ).toContain(response.status());
}

type ConversationSnapshot = {
  id: string;
  match_id: string | null;
  status: string | null;
  agenda_state: {
    active_stage?: string;
    completed_stages?: string[];
  } | null;
};

test.describe("Train C Batch 57 Guided Match Conversation", () => {
  test.describe.configure({ retries: 0 });

  test("persists optional stages and keeps suggested replies editable", async ({
    browser,
  }) => {
    test.setTimeout(180_000);

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

    try {
      await test.step("reuse the match conversation created by the Batch 56 dependency", async () => {
        await expectReusableSession(pageA, "User A before Batch 57 lifecycle");
        await expectReusableSession(pageB, "User B before Batch 57 lifecycle");
      });

      let conversationId = "";
      let matchId = "";
      let restOrigin = "";
      let userAHeaders: ReturnType<typeof authenticatedRestHeaders>;

      await test.step("User A opens the newest accepted match conversation", async () => {
        const conversationsPromise = pageA.waitForResponse(
          isConversationListResponse,
          { timeout: actionTimeout },
        );

        await pageA.goto(chatPath, { waitUntil: "domcontentloaded" });
        const response = await conversationsPromise;
        const body = await response.text();
        expect(
          response.ok(),
          `Conversation list failed: ${response.status()} ${body}`,
        ).toBe(true);

        const conversations = JSON.parse(body) as ConversationSnapshot[];
        const matchConversation = conversations.find(
          (conversation) => Boolean(conversation.match_id),
        );
        expect(
          matchConversation,
          "Batch 56 dependency must leave one accepted match conversation.",
        ).toBeTruthy();

        conversationId = matchConversation!.id;
        matchId = matchConversation!.match_id!;
        restOrigin = new URL(response.url()).origin;
        userAHeaders = authenticatedRestHeaders(response);

        await pageA
          .getByTestId(`conversation-select-${conversationId}`)
          .click();
        await expect(pageA.getByTestId("match-conversation-guide")).toBeVisible({
          timeout: actionTimeout,
        });
        await expect(pageA.getByTestId("match-stage-interest")).toHaveAttribute(
          "aria-pressed",
          "true",
        );
      });

      let initialMessageCount = 0;

      await test.step("quick replies and polite declines only populate the editable draft", async () => {
        const initialMessagesResponse = await pageA.request.get(
          `${restOrigin}/rest/v1/messages?select=id&conversation_id=eq.${conversationId}`,
          { headers: userAHeaders! },
        );
        const initialMessagesBody = await expectJsonOk(
          initialMessagesResponse,
          "Initial message count",
        );
        initialMessageCount = (JSON.parse(initialMessagesBody) as unknown[])
          .length;

        let messageWrites = 0;
        const countMessageWrite = (response: Response) => {
          if (isMessageWriteResponse(response)) messageWrites += 1;
        };
        pageA.on("response", countMessageWrite);

        await pageA.getByTestId("quick-reply-condition").click();
        await expect(pageA.getByTestId("match-message-input")).toHaveValue(
          /Could you describe the item's condition/,
        );
        await pageA
          .getByTestId("match-message-input")
          .fill(
            "Could you describe the item's condition and include recent photos?",
          );
        await expect(pageA.getByTestId("match-message-input")).toHaveValue(
          "Could you describe the item's condition and include recent photos?",
        );

        await pageA.getByText("Polite decline", { exact: true }).click();
        await pageA.getByTestId("polite-refusal-notRightFit").click();
        await expect(pageA.getByTestId("match-message-input")).toHaveValue(
          /I do not think this exchange is the right fit/,
        );

        await pageA.waitForTimeout(300);
        expect(messageWrites).toBe(0);
        pageA.off("response", countMessageWrite);
      });

      await test.step("User A selects and completes the condition stage", async () => {
        const selectResponsePromise = pageA.waitForResponse(
          isAgendaUpdateResponse,
          { timeout: actionTimeout },
        );
        await pageA.getByTestId("match-stage-condition").click();
        const selectResponse = await selectResponsePromise;
        const selectBody = await selectResponse.text();
        expect(
          selectResponse.ok(),
          `Stage selection failed: ${selectResponse.status()} ${selectBody}`,
        ).toBe(true);

        const completeResponsePromise = pageA.waitForResponse(
          isAgendaUpdateResponse,
          { timeout: actionTimeout },
        );
        await pageA.getByTestId("match-stage-complete-condition").click();
        const completeResponse = await completeResponsePromise;
        const completeBody = await completeResponse.text();
        expect(
          completeResponse.ok(),
          `Stage completion failed: ${completeResponse.status()} ${completeBody}`,
        ).toBe(true);

        await expect(pageA.getByTestId("match-guide-progress")).toContainText(
          "1 of 5",
        );
        await expect(pageA.getByTestId("match-stage-condition")).toHaveAttribute(
          "aria-pressed",
          "true",
        );
      });

      let userBHeaders: ReturnType<typeof authenticatedRestHeaders>;

      await test.step("User B sees the shared state and completes logistics", async () => {
        const conversationsPromise = pageB.waitForResponse(
          isConversationListResponse,
          { timeout: actionTimeout },
        );
        await pageB.goto(`${chatPath}?conversation=${conversationId}`, {
          waitUntil: "domcontentloaded",
        });
        const response = await conversationsPromise;
        userBHeaders = authenticatedRestHeaders(response);

        await pageB
          .getByTestId(`conversation-select-${conversationId}`)
          .click();
        await expect(pageB.getByTestId("match-guide-progress")).toContainText(
          "1 of 5",
          { timeout: actionTimeout },
        );
        await expect(
          pageB.getByTestId("match-stage-complete-condition"),
        ).toHaveText("Reopen stage");

        const selectResponsePromise = pageB.waitForResponse(
          isAgendaUpdateResponse,
          { timeout: actionTimeout },
        );
        await pageB.getByTestId("match-stage-logistics").click();
        expect((await selectResponsePromise).ok()).toBe(true);

        const completeResponsePromise = pageB.waitForResponse(
          isAgendaUpdateResponse,
          { timeout: actionTimeout },
        );
        await pageB.getByTestId("match-stage-complete-logistics").click();
        expect((await completeResponsePromise).ok()).toBe(true);

        await pageB.reload({ waitUntil: "domcontentloaded" });
        await expect(pageB.getByTestId("match-guide-progress")).toContainText(
          "2 of 5",
          { timeout: actionTimeout },
        );
        await expect(pageB.getByTestId("match-stage-logistics")).toHaveAttribute(
          "aria-pressed",
          "true",
        );
      });

      await test.step("reload persists the shared agenda and creates no Exchange side effects", async () => {
        await pageA.reload({ waitUntil: "domcontentloaded" });
        await expect(pageA.getByTestId("match-guide-progress")).toContainText(
          "2 of 5",
          { timeout: actionTimeout },
        );
        await expect(pageA.getByTestId("match-stage-logistics")).toHaveAttribute(
          "aria-pressed",
          "true",
        );

        const conversationResponse = await pageA.request.get(
          `${restOrigin}/rest/v1/conversations?select=id,match_id,status,agenda_state&id=eq.${conversationId}`,
          { headers: userAHeaders! },
        );
        const conversationBody = await expectJsonOk(
          conversationResponse,
          "Participant agenda query",
        );
        expect(JSON.parse(conversationBody)).toEqual([
          expect.objectContaining({
            id: conversationId,
            match_id: matchId,
            agenda_state: expect.objectContaining({
              active_stage: "logistics",
              completed_stages: expect.arrayContaining([
                "condition",
                "logistics",
              ]),
            }),
          }),
        ]);

        const matchResponse = await pageA.request.get(
          `${restOrigin}/rest/v1/matches?select=id,status,converted_swap_id&id=eq.${matchId}`,
          { headers: userAHeaders! },
        );
        const matchBody = await expectJsonOk(
          matchResponse,
          "Match remains accepted",
        );
        expect(JSON.parse(matchBody)).toEqual([
          {
            id: matchId,
            status: "accepted",
            converted_swap_id: null,
          },
        ]);

        const messagesResponse = await pageA.request.get(
          `${restOrigin}/rest/v1/messages?select=id&conversation_id=eq.${conversationId}`,
          { headers: userAHeaders! },
        );
        const messagesBody = await expectJsonOk(
          messagesResponse,
          "Message count after draft prompts",
        );
        expect((JSON.parse(messagesBody) as unknown[]).length).toBe(
          initialMessageCount,
        );
      });

      await test.step("anonymous callers cannot read or update the agenda", async () => {
        const anonHeaders = {
          apikey: userBHeaders!.apikey,
          "content-type": "application/json",
        };

        const anonReadResponse = await pageB.request.get(
          `${restOrigin}/rest/v1/conversations?select=id,agenda_state&id=eq.${conversationId}`,
          { headers: anonHeaders },
        );
        const anonReadBody = await anonReadResponse.text();
        if (anonReadResponse.ok()) {
          expect(JSON.parse(anonReadBody)).toEqual([]);
        } else {
          expect([401, 403]).toContain(anonReadResponse.status());
        }

        const anonUpdateResponse = await pageB.request.post(
          `${restOrigin}/rest/v1/rpc/update_match_conversation_agenda`,
          {
            headers: anonHeaders,
            data: {
              p_conversation_id: conversationId,
              p_stage: "agreement",
              p_completed: true,
            },
          },
        );
        await expectAnonymousDenied(
          anonUpdateResponse,
          "Anonymous agenda update",
        );
      });
    } finally {
      await contextA.close().catch(() => undefined);
      await contextB.close().catch(() => undefined);
    }
  });
});
