import { expect, test, type Page, type Response } from "@playwright/test";
import { readFileSync } from "node:fs";
import {
  expectAuthenticatedSession,
  userAAuthFile,
  userBAuthFile,
} from "./two-user-auth.setup";

const messagesPath = "/en/messages";
const profilePath = "/en/profile";
const timeout = 20_000;

type ApiHeaders = {
  apikey: string;
  authorization: string;
  "content-type": string;
};

type ProfileSignals = {
  user_id: string;
  trust_level: string | null;
  trust_score: number | null;
  token_balance: number | null;
  lifetime_tokens: number | null;
};

type ItemState = {
  id: string;
  status: string;
  is_active: boolean;
  locked_by: string | null;
  locked_until: string | null;
  lock_reason: string | null;
};

function storage(path: string) {
  return JSON.parse(readFileSync(path, "utf8"));
}

async function prepare(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("cookie_consent", "rejected");
    localStorage.setItem("swaply_cookie_consent", "rejected");
  });
  await page.goto(profilePath, { waitUntil: "domcontentloaded" });
  await expectAuthenticatedSession(page, "Batch 60 participant");
}

function isConversationList(response: Response) {
  const url = new URL(response.url());
  return (
    response.request().method() === "GET" &&
    url.pathname.endsWith("/rest/v1/conversations") &&
    (url.searchParams.get("select") ?? "").includes("agenda_state")
  );
}

function isAgreementRpc(response: Response) {
  return (
    response.request().method() === "POST" &&
    new URL(response.url()).pathname.endsWith(
      "/rest/v1/rpc/update_match_conversation_agreement",
    )
  );
}

function isExchangeRpc(response: Response) {
  return (
    response.request().method() === "POST" &&
    new URL(response.url()).pathname.endsWith(
      "/rest/v1/rpc/create_exchange_from_match_agreement",
    )
  );
}

function headersFrom(response: Response): ApiHeaders {
  const headers = response.request().headers();
  expect(headers.apikey).toBeTruthy();
  expect(headers.authorization).toBeTruthy();
  return {
    apikey: headers.apikey!,
    authorization: headers.authorization!,
    "content-type": "application/json",
  };
}

function revision(text: string) {
  const value = Number(text.match(/\d+/)?.[0]);
  expect(Number.isFinite(value)).toBe(true);
  return value;
}

async function currentUserId(
  page: Page,
  restOrigin: string,
  headers: ApiHeaders,
) {
  const response = await page.request.get(`${restOrigin}/auth/v1/user`, {
    headers,
  });
  expect(response.ok()).toBe(true);
  const user = (await response.json()) as { id: string };
  expect(user.id).toBeTruthy();
  return user.id;
}

async function profileSignals(
  page: Page,
  restOrigin: string,
  headers: ApiHeaders,
  userId: string,
): Promise<ProfileSignals> {
  const response = await page.request.get(
    `${restOrigin}/rest/v1/profiles?select=user_id,trust_level,trust_score,token_balance,lifetime_tokens&user_id=eq.${userId}`,
    { headers },
  );
  expect(response.ok()).toBe(true);
  const rows = (await response.json()) as ProfileSignals[];
  expect(rows).toHaveLength(1);
  return rows[0];
}

async function notificationCount(
  page: Page,
  restOrigin: string,
  headers: ApiHeaders,
  userId: string,
) {
  const response = await page.request.get(
    `${restOrigin}/rest/v1/notifications?select=id&user_id=eq.${userId}`,
    { headers },
  );
  expect(response.ok()).toBe(true);
  return ((await response.json()) as unknown[]).length;
}

async function itemStateForOwner(
  page: Page,
  restOrigin: string,
  headers: ApiHeaders,
  itemId: string,
): Promise<ItemState> {
  const response = await page.request.get(
    `${restOrigin}/rest/v1/items?select=id,status,is_active,locked_by,locked_until,lock_reason&id=eq.${itemId}`,
    { headers },
  );
  expect(response.ok()).toBe(true);
  const rows = (await response.json()) as ItemState[];
  expect(rows).toHaveLength(1);
  return rows[0];
}

async function confirmIfNeeded(page: Page) {
  const button = page.getByTestId("match-agreement-confirm");
  if ((await button.count()) === 0 || !(await button.isVisible())) return;
  const response = page.waitForResponse(isAgreementRpc, { timeout });
  await button.click();
  expect((await response).ok()).toBe(true);
}

function sortRows<T extends { id: string }>(rows: T[]) {
  return [...rows].sort((a, b) => a.id.localeCompare(b.id));
}

async function cleanupExchange(input: {
  page: Page;
  restOrigin: string;
  initiatorHeaders: ApiHeaders;
  participantHeaders: ApiHeaders;
  matchId: string;
  conversationId: string;
  swapId: string;
}) {
  const {
    page,
    restOrigin,
    initiatorHeaders,
    participantHeaders,
    matchId,
    conversationId,
    swapId,
  } = input;

  const resetMatch = await page.request.patch(
    `${restOrigin}/rest/v1/matches?id=eq.${matchId}`,
    {
      headers: {
        ...initiatorHeaders,
        Prefer: "return=minimal",
      },
      data: {
        status: "accepted",
        converted_swap_id: null,
        updated_at: new Date().toISOString(),
      },
    },
  );
  expect(resetMatch.ok()).toBe(true);

  const conversationResponse = await page.request.get(
    `${restOrigin}/rest/v1/conversations?select=agenda_state&id=eq.${conversationId}`,
    { headers: participantHeaders },
  );
  expect(conversationResponse.ok()).toBe(true);
  const conversationRows = (await conversationResponse.json()) as Array<{
    agenda_state: Record<string, unknown>;
  }>;
  expect(conversationRows).toHaveLength(1);
  const cleanedAgenda = { ...(conversationRows[0].agenda_state ?? {}) };
  delete cleanedAgenda.exchange_swap_id;
  delete cleanedAgenda.exchange_created_at;
  cleanedAgenda.updated_at = new Date().toISOString();

  const resetConversation = await page.request.patch(
    `${restOrigin}/rest/v1/conversations?id=eq.${conversationId}`,
    {
      headers: {
        ...participantHeaders,
        Prefer: "return=minimal",
      },
      data: {
        swap_id: null,
        status: "active",
        agenda_state: cleanedAgenda,
        summary: null,
        summary_approved_by: null,
        updated_at: new Date().toISOString(),
      },
    },
  );
  expect(resetConversation.ok()).toBe(true);

  const removeSwap = await page.request.delete(
    `${restOrigin}/rest/v1/swaps?id=eq.${swapId}`,
    {
      headers: {
        ...initiatorHeaders,
        Prefer: "return=minimal",
      },
    },
  );
  expect(removeSwap.ok()).toBe(true);
}

test.describe("Train C Batch 60 explicit Exchange handoff", () => {
  test("creates one idempotent Exchange only after an explicit click", async ({
    browser,
  }) => {
    test.setTimeout(240_000);

    const contextA = await browser.newContext({ storageState: storage(userAAuthFile) });
    const contextB = await browser.newContext({ storageState: storage(userBAuthFile) });
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    let restOrigin = "";
    let headersA: ApiHeaders | null = null;
    let headersB: ApiHeaders | null = null;
    let initiatorHeaders: ApiHeaders | null = null;
    let initiatorItemHeaders: ApiHeaders | null = null;
    let targetItemHeaders: ApiHeaders | null = null;
    let conversationId = "";
    let matchId = "";
    let swapId = "";

    try {
      await prepare(pageA);
      await prepare(pageB);

      let userAId = "";
      let userBId = "";
      let currentRevision = 0;
      let match: {
        id: string;
        status: string;
        converted_swap_id: string | null;
        initiator_id: string;
        target_user_id: string;
        initiator_item_id: string;
        target_item_id: string;
      };
      let itemStateBefore: ItemState[] = [];
      let profileABefore: ProfileSignals;
      let profileBBefore: ProfileSignals;
      let notificationsABefore = 0;
      let notificationsBBefore = 0;

      await test.step("open the same unconverted accepted match", async () => {
        const listA = pageA.waitForResponse(isConversationList, { timeout });
        await pageA.goto(messagesPath, { waitUntil: "domcontentloaded" });
        const responseA = await listA;
        const rows = (await responseA.json()) as Array<{
          id: string;
          match_id: string | null;
          swap_id: string | null;
        }>;
        const conversation = rows.find((row) => row.match_id && !row.swap_id);
        expect(conversation).toBeTruthy();

        conversationId = conversation!.id;
        matchId = conversation!.match_id!;
        restOrigin = new URL(responseA.url()).origin;
        headersA = headersFrom(responseA);

        await pageA.getByTestId(`conversation-select-${conversationId}`).click();
        await expect(pageA.getByTestId("match-agreement-panel")).toBeVisible();

        const listB = pageB.waitForResponse(isConversationList, { timeout });
        await pageB.goto(`${messagesPath}?conversation=${conversationId}`, {
          waitUntil: "domcontentloaded",
        });
        const responseB = await listB;
        headersB = headersFrom(responseB);
        await pageB.getByTestId(`conversation-select-${conversationId}`).click();
        await expect(pageB.getByTestId("match-agreement-panel")).toBeVisible();

        userAId = await currentUserId(pageA, restOrigin, headersA);
        userBId = await currentUserId(pageB, restOrigin, headersB);
        currentRevision = revision(
          await pageA.getByTestId("match-agreement-revision").innerText(),
        );

        const matchResponse = await pageA.request.get(
          `${restOrigin}/rest/v1/matches?select=id,status,converted_swap_id,initiator_id,target_user_id,initiator_item_id,target_item_id&id=eq.${matchId}`,
          { headers: headersA },
        );
        expect(matchResponse.ok()).toBe(true);
        const matchRows = (await matchResponse.json()) as typeof match[];
        expect(matchRows).toHaveLength(1);
        match = matchRows[0];
        expect(match.status).toBe("accepted");
        expect(match.converted_swap_id).toBeNull();
        expect([match.initiator_id, match.target_user_id].sort()).toEqual(
          [userAId, userBId].sort(),
        );

        initiatorHeaders = match.initiator_id === userAId ? headersA : headersB;
        initiatorItemHeaders = initiatorHeaders;
        targetItemHeaders = match.target_user_id === userAId ? headersA : headersB;

        itemStateBefore = sortRows([
          await itemStateForOwner(
            pageA,
            restOrigin,
            initiatorItemHeaders,
            match.initiator_item_id,
          ),
          await itemStateForOwner(
            pageB,
            restOrigin,
            targetItemHeaders,
            match.target_item_id,
          ),
        ]);
        expect(itemStateBefore).toHaveLength(2);

        profileABefore = await profileSignals(pageA, restOrigin, headersA, userAId);
        profileBBefore = await profileSignals(pageB, restOrigin, headersB, userBId);
        notificationsABefore = await notificationCount(
          pageA,
          restOrigin,
          headersA,
          userAId,
        );
        notificationsBBefore = await notificationCount(
          pageB,
          restOrigin,
          headersB,
          userBId,
        );

        const noSwapYet = await pageA.request.get(
          `${restOrigin}/rest/v1/swaps?select=id&conversation_id=eq.${conversationId}`,
          { headers: headersA },
        );
        expect(await noSwapYet.json()).toEqual([]);
      });

      await test.step("confirm the current revision without creating an Exchange", async () => {
        await confirmIfNeeded(pageA);
        await confirmIfNeeded(pageB);

        await expect(
          pageA.getByTestId("match-agreement-create-exchange"),
        ).toBeVisible({ timeout });
        await expect(
          pageB.getByTestId("match-agreement-create-exchange"),
        ).toBeVisible({ timeout });

        const noSwapYet = await pageA.request.get(
          `${restOrigin}/rest/v1/swaps?select=id&conversation_id=eq.${conversationId}`,
          { headers: headersA! },
        );
        expect(await noSwapYet.json()).toEqual([]);
      });

      await test.step("create once and open the same Exchange for both users", async () => {
        const createResponse = pageA.waitForResponse(isExchangeRpc, { timeout });
        await pageA.getByTestId("match-agreement-create-exchange").click();
        const response = await createResponse;
        expect(response.ok()).toBe(true);
        const payload = (await response.json()) as {
          swap_id: string;
          created: boolean;
          agreement_revision: number;
        };
        swapId = payload.swap_id;
        expect(payload.created).toBe(true);
        expect(payload.agreement_revision).toBe(currentRevision);
        expect(swapId).toBeTruthy();

        await expect(pageA).toHaveURL(
          new RegExp(`/en/exchange/${swapId.replaceAll("-", "\\-")}`),
          { timeout },
        );

        await expect(
          pageB.getByTestId("match-agreement-open-exchange"),
        ).toBeVisible({ timeout });
        await pageB.getByTestId("match-agreement-open-exchange").click();
        await expect(pageB).toHaveURL(
          new RegExp(`/en/exchange/${swapId.replaceAll("-", "\\-")}`),
          { timeout },
        );
      });

      await test.step("verify atomic links, frozen snapshot and idempotency", async () => {
        const swapsResponse = await pageA.request.get(
          `${restOrigin}/rest/v1/swaps?select=id,status,requester_id,responder_id,offered_item_id,requested_item_id,conversation_id,swap_metadata,exchange_data&conversation_id=eq.${conversationId}`,
          { headers: headersA! },
        );
        expect(swapsResponse.ok()).toBe(true);
        const swaps = (await swapsResponse.json()) as Array<{
          id: string;
          status: string;
          requester_id: string;
          responder_id: string;
          offered_item_id: string;
          requested_item_id: string;
          conversation_id: string;
          swap_metadata: {
            source: string;
            match_id: string;
            agreement_revision: number;
            agreement_snapshot: {
              revision: number;
              confirmed_by: string[];
            };
          };
          exchange_data: {
            agreement_snapshot: { revision: number };
          };
        }>;
        expect(swaps).toHaveLength(1);
        expect(swaps[0]).toEqual(
          expect.objectContaining({
            id: swapId,
            status: "accepted",
            conversation_id: conversationId,
          }),
        );
        expect(swaps[0].swap_metadata).toEqual(
          expect.objectContaining({
            source: "match_bilateral_agreement",
            match_id: matchId,
            agreement_revision: currentRevision,
          }),
        );
        expect(swaps[0].swap_metadata.agreement_snapshot.revision).toBe(
          currentRevision,
        );
        expect(swaps[0].swap_metadata.agreement_snapshot.confirmed_by).toHaveLength(2);
        expect(swaps[0].exchange_data.agreement_snapshot.revision).toBe(
          currentRevision,
        );

        const conversationResponse = await pageA.request.get(
          `${restOrigin}/rest/v1/conversations?select=swap_id,status,agenda_state,summary,summary_approved_by&id=eq.${conversationId}`,
          { headers: headersA! },
        );
        const conversations = (await conversationResponse.json()) as Array<{
          swap_id: string;
          status: string;
          agenda_state: Record<string, unknown>;
          summary: { swapTitle: string; approvedBy: string[] };
          summary_approved_by: string[];
        }>;
        expect(conversations).toHaveLength(1);
        expect(conversations[0].swap_id).toBe(swapId);
        expect(conversations[0].status).toBe("agreed");
        expect(conversations[0].agenda_state.exchange_swap_id).toBe(swapId);
        expect(conversations[0].summary.swapTitle).toContain("↔");
        expect(conversations[0].summary.approvedBy).toHaveLength(2);
        expect(conversations[0].summary_approved_by).toHaveLength(2);

        const matchResponse = await pageA.request.get(
          `${restOrigin}/rest/v1/matches?select=status,converted_swap_id&id=eq.${matchId}`,
          { headers: headersA! },
        );
        expect(await matchResponse.json()).toEqual([
          { status: "converted_to_swap", converted_swap_id: swapId },
        ]);

        const retry = await pageA.request.post(
          `${restOrigin}/rest/v1/rpc/create_exchange_from_match_agreement`,
          {
            headers: headersA!,
            data: {
              p_conversation_id: conversationId,
              p_expected_revision: currentRevision,
            },
          },
        );
        expect(retry.ok()).toBe(true);
        expect(await retry.json()).toEqual(
          expect.objectContaining({
            swap_id: swapId,
            created: false,
            agreement_revision: currentRevision,
          }),
        );

        const countAgain = await pageA.request.get(
          `${restOrigin}/rest/v1/swaps?select=id&conversation_id=eq.${conversationId}`,
          { headers: headersA! },
        );
        expect(await countAgain.json()).toEqual([{ id: swapId }]);
      });

      await test.step("verify no item, token, rank or notification side effects", async () => {
        const itemStateAfter = sortRows([
          await itemStateForOwner(
            pageA,
            restOrigin,
            initiatorItemHeaders!,
            match.initiator_item_id,
          ),
          await itemStateForOwner(
            pageB,
            restOrigin,
            targetItemHeaders!,
            match.target_item_id,
          ),
        ]);
        expect(itemStateAfter).toEqual(itemStateBefore);

        expect(
          await profileSignals(pageA, restOrigin, headersA!, userAId),
        ).toEqual(profileABefore);
        expect(
          await profileSignals(pageB, restOrigin, headersB!, userBId),
        ).toEqual(profileBBefore);
        expect(
          await notificationCount(pageA, restOrigin, headersA!, userAId),
        ).toBe(notificationsABefore);
        expect(
          await notificationCount(pageB, restOrigin, headersB!, userBId),
        ).toBe(notificationsBBefore);

        const tokenRowsA = await pageA.request.get(
          `${restOrigin}/rest/v1/user_tokens?select=id&reference_id=eq.${swapId}`,
          { headers: headersA! },
        );
        const tokenRowsB = await pageB.request.get(
          `${restOrigin}/rest/v1/user_tokens?select=id&reference_id=eq.${swapId}`,
          { headers: headersB! },
        );
        expect(await tokenRowsA.json()).toEqual([]);
        expect(await tokenRowsB.json()).toEqual([]);
      });

      await test.step("clean up the Exchange by immutable IDs", async () => {
        await cleanupExchange({
          page: pageA,
          restOrigin,
          initiatorHeaders: initiatorHeaders!,
          participantHeaders: headersA!,
          matchId,
          conversationId,
          swapId,
        });

        const removed = await pageA.request.get(
          `${restOrigin}/rest/v1/swaps?select=id&id=eq.${swapId}`,
          { headers: headersA! },
        );
        expect(await removed.json()).toEqual([]);

        const restoredMatch = await pageA.request.get(
          `${restOrigin}/rest/v1/matches?select=status,converted_swap_id&id=eq.${matchId}`,
          { headers: headersA! },
        );
        expect(await restoredMatch.json()).toEqual([
          { status: "accepted", converted_swap_id: null },
        ]);
      });
    } finally {
      if (
        swapId &&
        restOrigin &&
        initiatorHeaders &&
        headersA &&
        matchId &&
        conversationId
      ) {
        await cleanupExchange({
          page: pageA,
          restOrigin,
          initiatorHeaders,
          participantHeaders: headersA,
          matchId,
          conversationId,
          swapId,
        }).catch(() => undefined);
      }
      await contextA.close().catch(() => undefined);
      await contextB.close().catch(() => undefined);
    }
  });
});
