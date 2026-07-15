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

type ConversationRow = {
  id: string;
  match_id: string | null;
  swap_id: string | null;
  status: string;
  agenda_state: {
    agreement?: {
      revision?: number;
      confirmed_by?: string[];
    };
  } | null;
};

type MatchRow = {
  id: string;
  status: string;
  converted_swap_id: string | null;
  initiator_id: string;
  target_user_id: string;
  initiator_item_id: string;
  target_item_id: string;
};

type SwapRow = {
  id: string;
  status: string;
  requester_id: string;
  responder_id: string;
  offered_item_id: string;
  requested_item_id: string;
  conversation_id: string;
  requester_confirmed: boolean;
  responder_confirmed: boolean;
  confirmed_by: string[];
  completed_at: string | null;
};

type ItemState = {
  id: string;
  status: string;
  is_active: boolean;
  locked_by: string | null;
  locked_until: string | null;
  lock_reason: string | null;
};

type ProfileSignals = {
  user_id: string;
  trust_level: string | null;
  trust_score: number | null;
  token_balance: number | null;
  lifetime_tokens: number | null;
  swaps_completed: number | null;
  rating: number | null;
  rating_count: number | null;
};

type CompletionPayload = {
  swap: SwapRow;
  replayed: boolean;
  idempotency_key: string;
  both_confirmed: boolean;
  confirmed_by: string[];
  effects_applied: boolean;
};

type ItemSnapshot = {
  headers: ApiHeaders;
  state: ItemState;
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
  await expectAuthenticatedSession(page, "Batch 61.4 participant");
}

function isConversationList(response: Response) {
  const url = new URL(response.url());
  return (
    response.request().method() === "GET" &&
    url.pathname.endsWith("/rest/v1/conversations") &&
    (url.searchParams.get("select") ?? "").includes("agenda_state")
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
    `${restOrigin}/rest/v1/profiles?select=user_id,trust_level,trust_score,token_balance,lifetime_tokens,swaps_completed,rating,rating_count&user_id=eq.${userId}`,
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

async function tokenCount(
  page: Page,
  restOrigin: string,
  headers: ApiHeaders,
  userId: string,
) {
  const response = await page.request.get(
    `${restOrigin}/rest/v1/user_tokens?select=id&user_id=eq.${userId}`,
    { headers },
  );
  expect(response.ok()).toBe(true);
  return ((await response.json()) as unknown[]).length;
}

async function itemState(
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

async function cleanup(input: {
  page: Page;
  restOrigin: string;
  participantHeaders: ApiHeaders;
  initiatorHeaders: ApiHeaders;
  requesterHeaders: ApiHeaders;
  matchId: string;
  conversationId: string;
  swapId: string;
  itemSnapshots: ItemSnapshot[];
}) {
  const {
    page,
    restOrigin,
    participantHeaders,
    initiatorHeaders,
    requesterHeaders,
    matchId,
    conversationId,
    swapId,
    itemSnapshots,
  } = input;

  const resetMatch = await page.request.patch(
    `${restOrigin}/rest/v1/matches?id=eq.${matchId}`,
    {
      headers: { ...initiatorHeaders, Prefer: "return=minimal" },
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
      headers: { ...participantHeaders, Prefer: "return=minimal" },
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

  for (const snapshot of itemSnapshots) {
    const restored = await page.request.patch(
      `${restOrigin}/rest/v1/items?id=eq.${snapshot.state.id}`,
      {
        headers: { ...snapshot.headers, Prefer: "return=minimal" },
        data: {
          status: snapshot.state.status,
          is_active: snapshot.state.is_active,
          locked_by: snapshot.state.locked_by,
          locked_until: snapshot.state.locked_until,
          lock_reason: snapshot.state.lock_reason,
          updated_at: new Date().toISOString(),
        },
      },
    );
    expect(restored.ok()).toBe(true);
  }

  const removeSwap = await page.request.delete(
    `${restOrigin}/rest/v1/swaps?id=eq.${swapId}`,
    {
      headers: { ...requesterHeaders, Prefer: "return=minimal" },
    },
  );
  expect(removeSwap.ok()).toBe(true);
}

test.describe("Train C Batch 61.4 HTTP bilateral completion", () => {
  test("serializes two authenticated completion requests exactly once", async ({
    browser,
  }) => {
    test.setTimeout(300_000);

    const contextA = await browser.newContext({ storageState: storage(userAAuthFile) });
    const contextB = await browser.newContext({ storageState: storage(userBAuthFile) });
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    let restOrigin = "";
    let headersA: ApiHeaders | null = null;
    let headersB: ApiHeaders | null = null;
    let initiatorHeaders: ApiHeaders | null = null;
    let requesterHeaders: ApiHeaders | null = null;
    let matchId = "";
    let conversationId = "";
    let swapId = "";
    let itemSnapshots: ItemSnapshot[] = [];

    try {
      await prepare(pageA);
      await prepare(pageB);

      let userAId = "";
      let userBId = "";
      let match: MatchRow;
      let profileABefore: ProfileSignals;
      let profileBBefore: ProfileSignals;
      let notificationsABefore = 0;
      let notificationsBBefore = 0;
      let tokensABefore = 0;
      let tokensBBefore = 0;

      await test.step("reuse the confirmed agreement after the Batch 60 cleanup", async () => {
        const listA = pageA.waitForResponse(isConversationList, { timeout });
        await pageA.goto(messagesPath, { waitUntil: "domcontentloaded" });
        const responseA = await listA;
        restOrigin = new URL(responseA.url()).origin;
        headersA = headersFrom(responseA);
        const conversations = (await responseA.json()) as ConversationRow[];

        const listB = pageB.waitForResponse(isConversationList, { timeout });
        await pageB.goto(messagesPath, { waitUntil: "domcontentloaded" });
        const responseB = await listB;
        headersB = headersFrom(responseB);

        userAId = await currentUserId(pageA, restOrigin, headersA);
        userBId = await currentUserId(pageB, restOrigin, headersB);

        const conversation = conversations.find((row) => {
          const confirmedBy = row.agenda_state?.agreement?.confirmed_by ?? [];
          return (
            Boolean(row.match_id) &&
            !row.swap_id &&
            [userAId, userBId].every((id) => confirmedBy.includes(id))
          );
        });
        expect(conversation).toBeTruthy();
        conversationId = conversation!.id;
        matchId = conversation!.match_id!;

        const revision = conversation!.agenda_state?.agreement?.revision;
        expect(Number.isInteger(revision)).toBe(true);

        const matchResponse = await pageA.request.get(
          `${restOrigin}/rest/v1/matches?select=id,status,converted_swap_id,initiator_id,target_user_id,initiator_item_id,target_item_id&id=eq.${matchId}`,
          { headers: headersA },
        );
        expect(matchResponse.ok()).toBe(true);
        const matches = (await matchResponse.json()) as MatchRow[];
        expect(matches).toHaveLength(1);
        match = matches[0];
        expect(match.status).toBe("accepted");
        expect(match.converted_swap_id).toBeNull();

        initiatorHeaders = match.initiator_id === userAId ? headersA : headersB;
        const initiatorItemHeaders = match.initiator_id === userAId ? headersA : headersB;
        const targetItemHeaders = match.target_user_id === userAId ? headersA : headersB;

        itemSnapshots = [
          {
            headers: initiatorItemHeaders,
            state: await itemState(
              pageA,
              restOrigin,
              initiatorItemHeaders,
              match.initiator_item_id,
            ),
          },
          {
            headers: targetItemHeaders,
            state: await itemState(
              pageA,
              restOrigin,
              targetItemHeaders,
              match.target_item_id,
            ),
          },
        ];

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
        tokensABefore = await tokenCount(pageA, restOrigin, headersA, userAId);
        tokensBBefore = await tokenCount(pageB, restOrigin, headersB, userBId);

        const create = await pageA.request.post(
          `${restOrigin}/rest/v1/rpc/create_exchange_from_match_agreement`,
          {
            headers: headersA,
            data: {
              p_conversation_id: conversationId,
              p_expected_revision: revision,
            },
          },
        );
        expect(create.ok()).toBe(true);
        const created = (await create.json()) as {
          swap_id: string;
          created: boolean;
          agreement_revision: number;
        };
        expect(created.created).toBe(true);
        expect(created.agreement_revision).toBe(revision);
        swapId = created.swap_id;

        const swapResponse = await pageA.request.get(
          `${restOrigin}/rest/v1/swaps?select=id,status,requester_id,responder_id,offered_item_id,requested_item_id,conversation_id,requester_confirmed,responder_confirmed,confirmed_by,completed_at&id=eq.${swapId}`,
          { headers: headersA },
        );
        expect(swapResponse.ok()).toBe(true);
        const swaps = (await swapResponse.json()) as SwapRow[];
        expect(swaps).toHaveLength(1);
        expect(swaps[0].status).toBe("accepted");
        requesterHeaders = swaps[0].requester_id === userAId ? headersA : headersB;
      });

      await test.step("reject a whitespace-only idempotency header", async () => {
        const appOrigin = new URL(pageA.url()).origin;
        const response = await pageA.request.post(
          `${appOrigin}/api/swaps/${encodeURIComponent(swapId)}/complete`,
          {
            headers: {
              "content-type": "application/json",
              "idempotency-key": "   ",
            },
            data: {},
          },
        );
        expect(response.status()).toBe(422);
        expect(await response.json()).toEqual({
          error: "Idempotency key is required",
        });
      });

      await test.step("send the two authenticated HTTP confirmations concurrently", async () => {
        const appOrigin = new URL(pageA.url()).origin;
        const endpoint = `${appOrigin}/api/swaps/${encodeURIComponent(swapId)}/complete`;
        const keyA = `http-race-a:${swapId}:${Date.now()}`;
        const keyB = `http-race-b:${swapId}:${Date.now()}`;

        const [responseA, responseB] = await Promise.all([
          pageA.request.post(endpoint, {
            headers: {
              "content-type": "application/json",
              "idempotency-key": keyA,
            },
            data: { idempotencyKey: keyA },
          }),
          pageB.request.post(endpoint, {
            headers: {
              "content-type": "application/json",
              "idempotency-key": keyB,
            },
            data: { idempotencyKey: keyB },
          }),
        ]);

        expect(responseA.ok()).toBe(true);
        expect(responseB.ok()).toBe(true);
        const payloadA = (await responseA.json()) as CompletionPayload;
        const payloadB = (await responseB.json()) as CompletionPayload;
        const payloads = [payloadA, payloadB];

        expect(payloads.map((payload) => payload.both_confirmed).sort()).toEqual([
          false,
          true,
        ]);
        expect(payloads.map((payload) => payload.swap.status).sort()).toEqual([
          "accepted",
          "completed",
        ]);
        expect(payloads.map((payload) => payload.confirmed_by.length).sort()).toEqual([
          1,
          2,
        ]);
        expect(payloads.map((payload) => payload.effects_applied).sort()).toEqual([
          false,
          true,
        ]);

        const retry = await pageA.request.post(endpoint, {
          headers: {
            "content-type": "application/json",
            "idempotency-key": keyA,
          },
          data: { idempotencyKey: keyA },
        });
        expect(retry.ok()).toBe(true);
        expect(await retry.json()).toEqual(
          expect.objectContaining({
            replayed: true,
            both_confirmed: true,
            effects_applied: true,
          }),
        );
      });

      await test.step("verify one completed Exchange and structural effects", async () => {
        const swapResponse = await pageA.request.get(
          `${restOrigin}/rest/v1/swaps?select=id,status,requester_id,responder_id,offered_item_id,requested_item_id,conversation_id,requester_confirmed,responder_confirmed,confirmed_by,completed_at&id=eq.${swapId}`,
          { headers: headersA! },
        );
        const swaps = (await swapResponse.json()) as SwapRow[];
        expect(swaps).toHaveLength(1);
        expect(swaps[0]).toEqual(
          expect.objectContaining({
            status: "completed",
            requester_confirmed: true,
            responder_confirmed: true,
          }),
        );
        expect(swaps[0].confirmed_by).toHaveLength(2);
        expect(swaps[0].completed_at).toBeTruthy();

        for (const snapshot of itemSnapshots) {
          expect(
            await itemState(pageA, restOrigin, snapshot.headers, snapshot.state.id),
          ).toEqual(
            expect.objectContaining({
              id: snapshot.state.id,
              status: "traded",
              is_active: false,
              locked_by: null,
              locked_until: null,
              lock_reason: null,
            }),
          );
        }

        const conversation = await pageA.request.get(
          `${restOrigin}/rest/v1/conversations?select=status&id=eq.${conversationId}`,
          { headers: headersA! },
        );
        expect(await conversation.json()).toEqual([{ status: "completed" }]);
      });

      await test.step("verify no C3 reward, trust or notification effects", async () => {
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
        expect(await tokenCount(pageA, restOrigin, headersA!, userAId)).toBe(
          tokensABefore,
        );
        expect(await tokenCount(pageB, restOrigin, headersB!, userBId)).toBe(
          tokensBBefore,
        );
      });

      await test.step("clean up by immutable IDs", async () => {
        await cleanup({
          page: pageA,
          restOrigin,
          participantHeaders: headersA!,
          initiatorHeaders: initiatorHeaders!,
          requesterHeaders: requesterHeaders!,
          matchId,
          conversationId,
          swapId,
          itemSnapshots,
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

        const restoredConversation = await pageA.request.get(
          `${restOrigin}/rest/v1/conversations?select=status,swap_id&id=eq.${conversationId}`,
          { headers: headersA! },
        );
        expect(await restoredConversation.json()).toEqual([
          { status: "active", swap_id: null },
        ]);

        for (const snapshot of itemSnapshots) {
          expect(
            await itemState(pageA, restOrigin, snapshot.headers, snapshot.state.id),
          ).toEqual(snapshot.state);
        }

        swapId = "";
      });
    } finally {
      if (
        swapId &&
        restOrigin &&
        headersA &&
        initiatorHeaders &&
        requesterHeaders &&
        matchId &&
        conversationId &&
        itemSnapshots.length === 2
      ) {
        await cleanup({
          page: pageA,
          restOrigin,
          participantHeaders: headersA,
          initiatorHeaders,
          requesterHeaders,
          matchId,
          conversationId,
          swapId,
          itemSnapshots,
        }).catch(() => undefined);
      }
      await contextA.close().catch(() => undefined);
      await contextB.close().catch(() => undefined);
    }
  });
});
