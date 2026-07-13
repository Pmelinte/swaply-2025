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

const messagesPath = "/en/messages";
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
  agenda_state: {
    active_stage?: string;
    completed_stages?: string[];
  } | null;
};

test.describe("Train C Batch 58 Realtime Guided Match Conversation", () => {
  test.describe.configure({ retries: 0 });

  test("syncs agenda updates live and prevents overlapping stage writes", async ({
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
      await test.step("reuse authenticated participants and the Batch 57 agenda", async () => {
        await expectReusableSession(pageA, "User A before Batch 58 realtime");
        await expectReusableSession(pageB, "User B before Batch 58 realtime");
      });

      let conversationId = "";
      let matchId = "";
      let restOrigin = "";
      let userAHeaders: ReturnType<typeof authenticatedRestHeaders>;
      let userBHeaders: ReturnType<typeof authenticatedRestHeaders>;

      await test.step("both users open the same conversation at the same time", async () => {
        const conversationsAPromise = pageA.waitForResponse(
          isConversationListResponse,
          { timeout: actionTimeout },
        );
        await pageA.goto(messagesPath, { waitUntil: "domcontentloaded" });
        const responseA = await conversationsAPromise;
        const bodyA = await responseA.text();
        expect(
          responseA.ok(),
          `User A conversation list failed: ${responseA.status()} ${bodyA}`,
        ).toBe(true);

        const conversations = JSON.parse(bodyA) as ConversationSnapshot[];
        const matchConversation = conversations.find(
          (conversation) => Boolean(conversation.match_id),
        );
        expect(
          matchConversation,
          "Batch 57 dependency must leave one accepted match conversation.",
        ).toBeTruthy();

        conversationId = matchConversation!.id;
        matchId = matchConversation!.match_id!;
        restOrigin = new URL(responseA.url()).origin;
        userAHeaders = authenticatedRestHeaders(responseA);

        await pageA
          .getByTestId(`conversation-select-${conversationId}`)
          .click();
        await expect(pageA.getByTestId("match-conversation-guide")).toBeVisible({
          timeout: actionTimeout,
        });

        const conversationsBPromise = pageB.waitForResponse(
          isConversationListResponse,
          { timeout: actionTimeout },
        );
        await pageB.goto(`${messagesPath}?conversation=${conversationId}`, {
          waitUntil: "domcontentloaded",
        });
        const responseB = await conversationsBPromise;
        userBHeaders = authenticatedRestHeaders(responseB);
        await pageB
          .getByTestId(`conversation-select-${conversationId}`)
          .click();
        await expect(pageB.getByTestId("match-conversation-guide")).toBeVisible({
          timeout: actionTimeout,
        });

        await expect(pageA.getByTestId("match-guide-progress")).toContainText(
          "2 of 5",
        );
        await expect(pageB.getByTestId("match-guide-progress")).toContainText(
          "2 of 5",
        );

        // Give both authenticated Postgres Changes channels time to reach SUBSCRIBED.
        await pageA.waitForTimeout(750);
      });

      let initialMessageCount = 0;

      await test.step("User A writes once while every stage control is locked", async () => {
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

        let agendaRequests = 0;
        pageA.on("request", (request) => {
          if (
            request.method() === "POST" &&
            new URL(request.url()).pathname.endsWith(
              "/rest/v1/rpc/update_match_conversation_agenda",
            )
          ) {
            agendaRequests += 1;
          }
        });

        await pageA.route(
          "**/rest/v1/rpc/update_match_conversation_agenda",
          async (route) => {
            await new Promise((resolve) => setTimeout(resolve, 500));
            await route.continue();
          },
        );

        const updatePromise = pageA.waitForResponse(isAgendaUpdateResponse, {
          timeout: actionTimeout,
        });
        await pageA.getByTestId("match-stage-offer").click();

        await expect(pageA.getByTestId("match-stage-condition")).toBeDisabled();
        await expect(pageA.getByTestId("match-stage-logistics")).toBeDisabled();
        await expect(
          pageA.getByTestId("match-stage-complete-agreement"),
        ).toBeDisabled();
        await expect(
          pageA.getByTestId("match-stage-complete-offer"),
        ).toHaveText("Saving…");

        await pageA
          .getByTestId("match-stage-agreement")
          .evaluate((element) => (element as HTMLButtonElement).click());
        await pageA.waitForTimeout(100);
        expect(agendaRequests).toBe(1);

        const updateResponse = await updatePromise;
        const updateBody = await updateResponse.text();
        expect(
          updateResponse.ok(),
          `Agenda selection failed: ${updateResponse.status()} ${updateBody}`,
        ).toBe(true);
        await pageA.unroute(
          "**/rest/v1/rpc/update_match_conversation_agenda",
        );
      });

      await test.step("User B receives User A's active stage without reload", async () => {
        await expect(pageB.getByTestId("match-stage-offer")).toHaveAttribute(
          "aria-pressed",
          "true",
          { timeout: actionTimeout },
        );

        const completePromise = pageA.waitForResponse(isAgendaUpdateResponse, {
          timeout: actionTimeout,
        });
        await pageA.getByTestId("match-stage-complete-offer").click();
        expect((await completePromise).ok()).toBe(true);

        await expect(pageB.getByTestId("match-guide-progress")).toContainText(
          "3 of 5",
          { timeout: actionTimeout },
        );
        await expect(
          pageB.getByTestId("match-stage-complete-offer"),
        ).toHaveText("Reopen stage");
      });

      await test.step("User A receives User B's reopen without reload", async () => {
        const reopenPromise = pageB.waitForResponse(isAgendaUpdateResponse, {
          timeout: actionTimeout,
        });
        await pageB.getByTestId("match-stage-complete-offer").click();
        expect((await reopenPromise).ok()).toBe(true);

        await expect(pageA.getByTestId("match-guide-progress")).toContainText(
          "2 of 5",
          { timeout: actionTimeout },
        );
        await expect(
          pageA.getByTestId("match-stage-complete-offer"),
        ).toHaveText("Mark complete");
        await expect(pageA.getByTestId("match-stage-offer")).toHaveAttribute(
          "aria-pressed",
          "true",
        );
      });

      await test.step("reload keeps the shared final state", async () => {
        await pageA.reload({ waitUntil: "domcontentloaded" });
        await pageB.reload({ waitUntil: "domcontentloaded" });

        await expect(pageA.getByTestId("match-guide-progress")).toContainText(
          "2 of 5",
          { timeout: actionTimeout },
        );
        await expect(pageB.getByTestId("match-guide-progress")).toContainText(
          "2 of 5",
          { timeout: actionTimeout },
        );
        await expect(pageA.getByTestId("match-stage-offer")).toHaveAttribute(
          "aria-pressed",
          "true",
        );
        await expect(pageB.getByTestId("match-stage-offer")).toHaveAttribute(
          "aria-pressed",
          "true",
        );
      });

      await test.step("realtime agenda changes create no messages, duplicates, or Exchange", async () => {
        const conversationResponse = await pageA.request.get(
          `${restOrigin}/rest/v1/conversations?select=id,match_id,agenda_state&match_id=eq.${matchId}`,
          { headers: userAHeaders! },
        );
        const conversationBody = await expectJsonOk(
          conversationResponse,
          "Conversation uniqueness query",
        );
        const matchConversations = JSON.parse(conversationBody) as Array<{
          id: string;
          match_id: string;
          agenda_state: {
            active_stage?: string;
            completed_stages?: string[];
          };
        }>;
        expect(matchConversations).toHaveLength(1);
        expect(matchConversations[0]).toEqual(
          expect.objectContaining({
            id: conversationId,
            match_id: matchId,
            agenda_state: expect.objectContaining({
              active_stage: "offer",
              completed_stages: expect.arrayContaining([
                "condition",
                "logistics",
              ]),
            }),
          }),
        );
        expect(matchConversations[0].agenda_state.completed_stages).not.toContain(
          "offer",
        );

        const messagesResponse = await pageA.request.get(
          `${restOrigin}/rest/v1/messages?select=id&conversation_id=eq.${conversationId}`,
          { headers: userAHeaders! },
        );
        const messagesBody = await expectJsonOk(
          messagesResponse,
          "Message count after realtime agenda updates",
        );
        expect((JSON.parse(messagesBody) as unknown[]).length).toBe(
          initialMessageCount,
        );

        const matchResponse = await pageA.request.get(
          `${restOrigin}/rest/v1/matches?select=id,status,converted_swap_id&id=eq.${matchId}`,
          { headers: userAHeaders! },
        );
        const matchBody = await expectJsonOk(
          matchResponse,
          "Match remains accepted after realtime agenda updates",
        );
        expect(JSON.parse(matchBody)).toEqual([
          {
            id: matchId,
            status: "accepted",
            converted_swap_id: null,
          },
        ]);
      });

      await test.step("anonymous callers remain unable to read or update the agenda", async () => {
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
          "Anonymous realtime agenda update",
        );
      });
    } finally {
      await contextA.close().catch(() => undefined);
      await contextB.close().catch(() => undefined);
    }
  });
});
