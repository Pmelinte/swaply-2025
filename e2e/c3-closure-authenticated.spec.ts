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
    [key: string]: unknown;
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

type ProfileStats = {
  tokens?: number;
  completedSwaps?: number;
  reputation?: string;
};

type ProfileSignals = {
  user_id: string;
  trust_level: string | null;
  trust_score: number | null;
  swaps_completed: number | null;
  swaps_cancelled: number | null;
  swaps_disputed: number | null;
  id_verified: boolean | null;
  phone_verified: boolean | null;
  response_rate_pct: number | null;
  rating: number | null;
  rating_count: number | null;
  stats: ProfileStats | null;
};

type CompletionPayload = {
  swap: SwapRow;
  replayed: boolean;
  idempotency_key: string;
  both_confirmed: boolean;
  confirmed_by: string[];
  effects_applied: boolean;
};

type NotificationRow = {
  id: string;
  user_id: string;
  type: string;
  dedupe_key: string | null;
  title_key: string | null;
  body_key: string | null;
  is_read: boolean;
  read: boolean;
  read_at: string | null;
};

type TokenRow = {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  reference_id: string | null;
};

type ReviewRow = {
  id: string;
  swap_id: string;
  reviewer_id: string;
  reviewed_id: string;
  rating: number;
  comment: string;
  response: string | null;
};

type CanonicalReviewPayload = {
  review: ReviewRow;
  replayed: boolean;
  idempotency_key?: string;
};

type CleanupPayload = {
  swap_id: string;
  replayed: boolean;
  deleted: boolean;
  completion_effect_rows: number;
  post_effect_rows: number;
  reward_rows: number;
  reward_amount: number;
  notification_rows: number;
  review_rows: number;
};

type ItemSnapshot = {
  headers: ApiHeaders;
  state: ItemState;
};

function storage(path: string) {
  return JSON.parse(readFileSync(path, "utf8"));
}

async function expectOk(response: APIResponse, label: string) {
  const body = await response.text();
  expect(response.ok(), `${label}: ${response.status()} ${body}`).toBe(true);
  return body;
}

async function prepare(page: Page, label: string) {
  await page.addInitScript(() => {
    localStorage.setItem("cookie_consent", "rejected");
    localStorage.setItem("swaply_cookie_consent", "rejected");
  });
  await page.goto(profilePath, { waitUntil: "domcontentloaded" });
  await expectAuthenticatedSession(page, label);
  await expect(
    page.getByRole("button", { name: "Notifications", exact: true }),
  ).toBeVisible({ timeout });
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
  const body = await expectOk(response, "Current authenticated user");
  const user = JSON.parse(body) as { id: string };
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
    `${restOrigin}/rest/v1/profiles?select=user_id,trust_level,trust_score,swaps_completed,swaps_cancelled,swaps_disputed,id_verified,phone_verified,response_rate_pct,rating,rating_count,stats&user_id=eq.${userId}`,
    { headers },
  );
  const body = await expectOk(response, `Profile signals for ${userId}`);
  const rows = JSON.parse(body) as ProfileSignals[];
  expect(rows).toHaveLength(1);
  return rows[0];
}

function numeric(value: number | null | undefined) {
  return value ?? 0;
}

function stat(stats: ProfileStats | null, key: keyof ProfileStats) {
  const value = stats?.[key];
  return typeof value === "number" ? value : 0;
}

function expectedTrust(profile: ProfileSignals) {
  let score = Math.min(numeric(profile.swaps_completed) * 20, 400);
  score -= numeric(profile.swaps_cancelled) * 10;
  score -= numeric(profile.swaps_disputed) * 25;
  if (profile.id_verified) score += 150;
  if (profile.phone_verified) score += 50;
  if (numeric(profile.rating) > 0) score += Math.round(numeric(profile.rating) * 40);
  score += numeric(profile.response_rate_pct);
  score = Math.max(0, Math.min(1000, score));

  const level =
    score >= 800
      ? "ambassador"
      : score >= 500
        ? "trusted"
        : score >= 200
          ? "verified"
          : "starter";

  return { score, level };
}

function expectTrustContract(profile: ProfileSignals) {
  const expected = expectedTrust(profile);
  expect(profile.trust_score).toBe(expected.score);
  expect(profile.trust_level).toBe(expected.level);
}

function expectedAverage(
  before: ProfileSignals,
  incomingRating: number,
) {
  const count = numeric(before.rating_count);
  const total = numeric(before.rating) * count + incomingRating;
  return Number((total / (count + 1)).toFixed(2));
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
  const body = await expectOk(response, `Item state for ${itemId}`);
  const rows = JSON.parse(body) as ItemState[];
  expect(rows).toHaveLength(1);
  return rows[0];
}

async function ownNotificationsForSwap(
  page: Page,
  restOrigin: string,
  headers: ApiHeaders,
  userId: string,
  swapId: string,
) {
  const response = await page.request.get(
    `${restOrigin}/rest/v1/notifications?select=id,user_id,type,dedupe_key,title_key,body_key,is_read,read,read_at&user_id=eq.${userId}&source_type=eq.swap&source_id=eq.${swapId}&order=created_at.asc`,
    { headers },
  );
  const body = await expectOk(response, `Notifications for ${userId}`);
  return JSON.parse(body) as NotificationRow[];
}

async function ownTokensForSwap(
  page: Page,
  restOrigin: string,
  headers: ApiHeaders,
  userId: string,
  swapId: string,
) {
  const response = await page.request.get(
    `${restOrigin}/rest/v1/user_tokens?select=id,user_id,amount,reason,reference_id&user_id=eq.${userId}&reason=eq.swap_completed&reference_id=eq.${swapId}`,
    { headers },
  );
  const body = await expectOk(response, `Swap reward for ${userId}`);
  return JSON.parse(body) as TokenRow[];
}

async function reviewsForSwap(
  page: Page,
  restOrigin: string,
  headers: ApiHeaders,
  swapId: string,
) {
  const response = await page.request.get(
    `${restOrigin}/rest/v1/reviews?select=id,swap_id,reviewer_id,reviewed_id,rating,comment,response&swap_id=eq.${swapId}&order=created_at.asc`,
    { headers },
  );
  const body = await expectOk(response, "Canonical Reviews for Swap");
  return JSON.parse(body) as ReviewRow[];
}

async function restoreStructuralFixture(input: {
  page: Page;
  restOrigin: string;
  participantHeaders: ApiHeaders;
  initiatorHeaders: ApiHeaders;
  matchId: string;
  conversationId: string;
  itemSnapshots: ItemSnapshot[];
}) {
  const {
    page,
    restOrigin,
    participantHeaders,
    initiatorHeaders,
    matchId,
    conversationId,
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
  await expectOk(resetMatch, "Restore accepted Match");

  const conversationResponse = await page.request.get(
    `${restOrigin}/rest/v1/conversations?select=agenda_state&id=eq.${conversationId}`,
    { headers: participantHeaders },
  );
  const conversationBody = await expectOk(
    conversationResponse,
    "Read conversation before cleanup",
  );
  const conversationRows = JSON.parse(conversationBody) as Array<{
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
  await expectOk(resetConversation, "Restore active conversation");

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
    await expectOk(restored, `Restore item ${snapshot.state.id}`);
  }
}

async function cleanupFixture(input: {
  page: Page;
  restOrigin: string;
  participantHeaders: ApiHeaders;
  initiatorHeaders: ApiHeaders;
  matchId: string;
  conversationId: string;
  swapId: string;
  itemSnapshots: ItemSnapshot[];
}) {
  await restoreStructuralFixture(input);

  const cleanup = await input.page.request.post(
    `${input.restOrigin}/rest/v1/rpc/cleanup_c3_e2e_fixture_v1`,
    {
      headers: input.participantHeaders,
      data: { p_swap_id: input.swapId },
    },
  );
  const body = await expectOk(cleanup, "Guarded immutable-ID C3 cleanup");
  return JSON.parse(body) as CleanupPayload;
}

test.describe("Train C Batch 62.3 authenticated C3 closure", () => {
  test.describe.configure({ mode: "serial", retries: 0 });

  test("closes C3 with two users, retry, concurrency, Realtime, Review authority and cleanup", async ({
    browser,
  }) => {
    test.setTimeout(420_000);

    const contextA = await browser.newContext({ storageState: storage(userAAuthFile) });
    const contextB = await browser.newContext({ storageState: storage(userBAuthFile) });
    const outsiderContext = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();
    const outsiderPage = await outsiderContext.newPage();

    let restOrigin = "";
    let headersA: ApiHeaders | null = null;
    let headersB: ApiHeaders | null = null;
    let initiatorHeaders: ApiHeaders | null = null;
    let matchId = "";
    let conversationId = "";
    let swapId = "";
    let itemSnapshots: ItemSnapshot[] = [];
    let profileABefore: ProfileSignals | null = null;
    let profileBBefore: ProfileSignals | null = null;

    try {
      await prepare(pageA, "Batch 62.3 User A");
      await prepare(pageB, "Batch 62.3 User B");

      let userAId = "";
      let userBId = "";
      let match: MatchRow;
      let swap: SwapRow;

      await test.step("reuse the confirmed two-user agreement and create one explicit Exchange", async () => {
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
        const matchBody = await expectOk(matchResponse, "Confirmed Match fixture");
        const matches = JSON.parse(matchBody) as MatchRow[];
        expect(matches).toHaveLength(1);
        match = matches[0];
        expect(match.status).toBe("accepted");
        expect(match.converted_swap_id).toBeNull();

        initiatorHeaders = match.initiator_id === userAId ? headersA : headersB;
        const initiatorItemHeaders =
          match.initiator_id === userAId ? headersA : headersB;
        const targetItemHeaders =
          match.target_user_id === userAId ? headersA : headersB;

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

        profileABefore = await profileSignals(
          pageA,
          restOrigin,
          headersA,
          userAId,
        );
        profileBBefore = await profileSignals(
          pageB,
          restOrigin,
          headersB,
          userBId,
        );

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
        const createBody = await expectOk(create, "Explicit Exchange handoff");
        const created = JSON.parse(createBody) as {
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
        const swapBody = await expectOk(swapResponse, "Created Exchange");
        const swaps = JSON.parse(swapBody) as SwapRow[];
        expect(swaps).toHaveLength(1);
        swap = swaps[0];
        expect(swap.status).toBe("accepted");

        // Both top bars now hold live authenticated Postgres Changes channels.
        await pageA.waitForTimeout(1_000);
      });

      const appOrigin = new URL(pageA.url()).origin;
      const completionEndpoint = `${appOrigin}/api/swaps/${encodeURIComponent(swapId)}/complete`;
      const keyA = `c3-close-a:${swapId}:${Date.now()}`;
      const keyB = `c3-close-b:${swapId}:${Date.now()}`;

      await test.step("deny the outsider and malformed idempotency requests", async () => {
        const outsider = await outsiderPage.request.post(completionEndpoint, {
          headers: {
            "content-type": "application/json",
            "idempotency-key": `outsider:${swapId}`,
          },
          data: { idempotencyKey: `outsider:${swapId}` },
        });
        expect(outsider.status()).toBe(401);

        const whitespace = await pageA.request.post(completionEndpoint, {
          headers: {
            "content-type": "application/json",
            "idempotency-key": "   ",
          },
          data: {},
        });
        expect(whitespace.status()).toBe(422);
      });

      await test.step("prove the first confirmation has zero C3 side effects", async () => {
        const first = await pageA.request.post(completionEndpoint, {
          headers: {
            "content-type": "application/json",
            "idempotency-key": keyA,
          },
          data: { idempotencyKey: keyA },
        });
        const firstBody = await expectOk(first, "First completion confirmation");
        const payload = JSON.parse(firstBody) as CompletionPayload;
        expect(payload).toEqual(
          expect.objectContaining({
            replayed: false,
            both_confirmed: false,
            effects_applied: false,
          }),
        );
        expect(payload.swap.status).toBe("accepted");
        expect(payload.confirmed_by).toHaveLength(1);

        expect(
          await ownTokensForSwap(pageA, restOrigin, headersA!, userAId, swapId),
        ).toEqual([]);
        expect(
          await ownTokensForSwap(pageB, restOrigin, headersB!, userBId, swapId),
        ).toEqual([]);
        expect(
          await ownNotificationsForSwap(
            pageA,
            restOrigin,
            headersA!,
            userAId,
            swapId,
          ),
        ).toEqual([]);
        expect(
          await ownNotificationsForSwap(
            pageB,
            restOrigin,
            headersB!,
            userBId,
            swapId,
          ),
        ).toEqual([]);
        expect(
          await profileSignals(pageA, restOrigin, headersA!, userAId),
        ).toEqual(profileABefore);
        expect(
          await profileSignals(pageB, restOrigin, headersB!, userBId),
        ).toEqual(profileBBefore);
      });

      await test.step("race the second confirmation against the first participant replay", async () => {
        const [second, replayRace] = await Promise.all([
          pageB.request.post(completionEndpoint, {
            headers: {
              "content-type": "application/json",
              "idempotency-key": keyB,
            },
            data: { idempotencyKey: keyB },
          }),
          pageA.request.post(completionEndpoint, {
            headers: {
              "content-type": "application/json",
              "idempotency-key": keyA,
            },
            data: { idempotencyKey: keyA },
          }),
        ]);

        const secondPayload = JSON.parse(
          await expectOk(second, "Second completion confirmation"),
        ) as CompletionPayload;
        const replayPayload = JSON.parse(
          await expectOk(replayRace, "Concurrent completion replay"),
        ) as CompletionPayload;

        expect(secondPayload).toEqual(
          expect.objectContaining({
            replayed: false,
            both_confirmed: true,
            effects_applied: true,
          }),
        );
        expect(secondPayload.swap.status).toBe("completed");
        expect(secondPayload.confirmed_by).toHaveLength(2);

        expect(replayPayload).toEqual(
          expect.objectContaining({
            replayed: true,
            both_confirmed: true,
            effects_applied: true,
          }),
        );

        const stableReplay = await pageA.request.post(completionEndpoint, {
          headers: {
            "content-type": "application/json",
            "idempotency-key": keyA,
          },
          data: { idempotencyKey: keyA },
        });
        expect(JSON.parse(await expectOk(stableReplay, "Stable completion replay"))).toEqual(
          expect.objectContaining({
            replayed: true,
            both_confirmed: true,
            effects_applied: true,
          }),
        );
      });

      await test.step("receive both completion notifications through Realtime without reload", async () => {
        for (const page of [pageA, pageB]) {
          const bell = page.getByRole("button", {
            name: "Notifications",
            exact: true,
          });
          await expect(bell.locator("span")).toHaveText("2", { timeout });
          await bell.click();
          await expect(page.getByText("Swap completed", { exact: true })).toBeVisible({
            timeout,
          });
          await expect(
            page.getByText("Feedback requested", { exact: true }),
          ).toBeVisible({ timeout });
          await page.keyboard.press("Escape");
        }
      });

      await test.step("verify exactly-once ledger, notifications, counters, trust and structural closure", async () => {
        const swapResponse = await pageA.request.get(
          `${restOrigin}/rest/v1/swaps?select=id,status,requester_id,responder_id,offered_item_id,requested_item_id,conversation_id,requester_confirmed,responder_confirmed,confirmed_by,completed_at&id=eq.${swapId}`,
          { headers: headersA! },
        );
        const swaps = JSON.parse(
          await expectOk(swapResponse, "Completed Exchange row"),
        ) as SwapRow[];
        expect(swaps).toHaveLength(1);
        swap = swaps[0];
        expect(swap).toEqual(
          expect.objectContaining({
            status: "completed",
            requester_confirmed: true,
            responder_confirmed: true,
          }),
        );
        expect(swap.confirmed_by).toHaveLength(2);
        expect(swap.completed_at).toBeTruthy();

        const rewardA = await ownTokensForSwap(
          pageA,
          restOrigin,
          headersA!,
          userAId,
          swapId,
        );
        const rewardB = await ownTokensForSwap(
          pageB,
          restOrigin,
          headersB!,
          userBId,
          swapId,
        );
        expect(rewardA).toHaveLength(1);
        expect(rewardB).toHaveLength(1);
        expect(rewardA[0]).toEqual(
          expect.objectContaining({
            user_id: userAId,
            amount: 30,
            reason: "swap_completed",
            reference_id: swapId,
          }),
        );
        expect(rewardB[0]).toEqual(
          expect.objectContaining({
            user_id: userBId,
            amount: 30,
            reason: "swap_completed",
            reference_id: swapId,
          }),
        );

        const notificationsA = await ownNotificationsForSwap(
          pageA,
          restOrigin,
          headersA!,
          userAId,
          swapId,
        );
        const notificationsB = await ownNotificationsForSwap(
          pageB,
          restOrigin,
          headersB!,
          userBId,
          swapId,
        );
        for (const rows of [notificationsA, notificationsB]) {
          expect(rows).toHaveLength(2);
          expect(rows.map((row) => row.type).sort()).toEqual([
            "feedback_requested",
            "swap_completed",
          ]);
          expect(new Set(rows.map((row) => row.dedupe_key)).size).toBe(2);
          expect(rows.every((row) => row.is_read === false && row.read === false)).toBe(
            true,
          );
        }
        expect(
          new Set(
            [...notificationsA, ...notificationsB].map((row) => row.dedupe_key),
          ).size,
        ).toBe(4);

        const profileAAfterCompletion = await profileSignals(
          pageA,
          restOrigin,
          headersA!,
          userAId,
        );
        const profileBAfterCompletion = await profileSignals(
          pageB,
          restOrigin,
          headersB!,
          userBId,
        );
        expect(profileAAfterCompletion.swaps_completed).toBe(
          numeric(profileABefore!.swaps_completed) + 1,
        );
        expect(profileBAfterCompletion.swaps_completed).toBe(
          numeric(profileBBefore!.swaps_completed) + 1,
        );
        expect(stat(profileAAfterCompletion.stats, "tokens")).toBe(
          stat(profileABefore!.stats, "tokens") + 30,
        );
        expect(stat(profileBAfterCompletion.stats, "tokens")).toBe(
          stat(profileBBefore!.stats, "tokens") + 30,
        );
        expect(stat(profileAAfterCompletion.stats, "completedSwaps")).toBe(
          stat(profileABefore!.stats, "completedSwaps") + 1,
        );
        expect(stat(profileBAfterCompletion.stats, "completedSwaps")).toBe(
          stat(profileBBefore!.stats, "completedSwaps") + 1,
        );
        expectTrustContract(profileAAfterCompletion);
        expectTrustContract(profileBAfterCompletion);

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
        expect(JSON.parse(await expectOk(conversation, "Completed conversation"))).toEqual([
          { status: "completed" },
        ]);
      });

      let reviewA: CanonicalReviewPayload;
      let reviewB: CanonicalReviewPayload;
      const reviewKeyA = `review-a:${swapId}:${Date.now()}`;
      const reviewKeyB = `review-b:${swapId}:${Date.now()}`;

      await test.step("submit both canonical Reviews concurrently and enforce replay semantics", async () => {
        const reviewEndpoint = `${appOrigin}/api/swaps/${encodeURIComponent(swapId)}/reviews`;
        const [responseA, responseB] = await Promise.all([
          pageA.request.post(reviewEndpoint, {
            headers: {
              "content-type": "application/json",
              "idempotency-key": reviewKeyA,
            },
            data: {
              rating: 5,
              comment: "Batch 62.3 review from User A",
              tags: ["clear", "safe"],
              photos: [],
              idempotencyKey: reviewKeyA,
            },
          }),
          pageB.request.post(reviewEndpoint, {
            headers: {
              "content-type": "application/json",
              "idempotency-key": reviewKeyB,
            },
            data: {
              rating: 4,
              comment: "Batch 62.3 review from User B",
              tags: ["completed"],
              photos: [],
              idempotencyKey: reviewKeyB,
            },
          }),
        ]);

        expect(responseA.status()).toBe(201);
        expect(responseB.status()).toBe(201);
        reviewA = (await responseA.json()) as CanonicalReviewPayload;
        reviewB = (await responseB.json()) as CanonicalReviewPayload;
        expect(reviewA.replayed).toBe(false);
        expect(reviewB.replayed).toBe(false);
        expect(reviewA.review.reviewer_id).toBe(userAId);
        expect(reviewA.review.reviewed_id).toBe(userBId);
        expect(reviewB.review.reviewer_id).toBe(userBId);
        expect(reviewB.review.reviewed_id).toBe(userAId);

        const replay = await pageA.request.post(reviewEndpoint, {
          headers: {
            "content-type": "application/json",
            "idempotency-key": reviewKeyA,
          },
          data: {
            rating: 5,
            comment: "Batch 62.3 review from User A",
            tags: ["clear", "safe"],
            photos: [],
            idempotencyKey: reviewKeyA,
          },
        });
        expect(replay.status()).toBe(200);
        expect(await replay.json()).toEqual(
          expect.objectContaining({ replayed: true }),
        );

        const conflict = await pageA.request.post(reviewEndpoint, {
          headers: {
            "content-type": "application/json",
            "idempotency-key": reviewKeyA,
          },
          data: {
            rating: 1,
            comment: "Conflicting payload must be denied",
            tags: [],
            photos: [],
            idempotencyKey: reviewKeyA,
          },
        });
        expect(conflict.status()).toBe(409);

        const outsiderReview = await outsiderPage.request.post(reviewEndpoint, {
          headers: { "content-type": "application/json" },
          data: { rating: 5, comment: "Outsider", tags: [], photos: [] },
        });
        expect(outsiderReview.status()).toBe(401);
      });

      await test.step("enforce reviewed-user-only response authority", async () => {
        const responseEndpoint = `${appOrigin}/api/reviews/${encodeURIComponent(reviewA.review.id)}/response`;

        const reviewerAttempt = await pageA.request.post(responseEndpoint, {
          headers: { "content-type": "application/json" },
          data: { response: "A reviewer cannot answer their own Review." },
        });
        expect(reviewerAttempt.status()).toBe(403);

        const reviewedResponse = await pageB.request.post(responseEndpoint, {
          headers: { "content-type": "application/json" },
          data: { response: "Thank you for the clear exchange." },
        });
        expect(reviewedResponse.status()).toBe(200);
        const payload = (await reviewedResponse.json()) as CanonicalReviewPayload;
        expect(payload.review.response).toBe("Thank you for the clear exchange.");
      });

      await test.step("derive rating aggregates and trust from the two immutable Reviews", async () => {
        const reviews = await reviewsForSwap(
          pageA,
          restOrigin,
          headersA!,
          swapId,
        );
        expect(reviews).toHaveLength(2);
        expect(new Set(reviews.map((row) => row.reviewer_id))).toEqual(
          new Set([userAId, userBId]),
        );

        const profileAAfterReview = await profileSignals(
          pageA,
          restOrigin,
          headersA!,
          userAId,
        );
        const profileBAfterReview = await profileSignals(
          pageB,
          restOrigin,
          headersB!,
          userBId,
        );

        expect(profileAAfterReview.rating_count).toBe(
          numeric(profileABefore!.rating_count) + 1,
        );
        expect(profileBAfterReview.rating_count).toBe(
          numeric(profileBBefore!.rating_count) + 1,
        );
        expect(profileAAfterReview.rating).toBe(expectedAverage(profileABefore!, 4));
        expect(profileBAfterReview.rating).toBe(expectedAverage(profileBBefore!, 5));
        expectTrustContract(profileAAfterReview);
        expectTrustContract(profileBAfterReview);
      });

      await test.step("keep is_read canonical while synchronizing the legacy read field", async () => {
        const notifications = await ownNotificationsForSwap(
          pageA,
          restOrigin,
          headersA!,
          userAId,
          swapId,
        );
        const target = notifications.find((row) => row.type === "swap_completed");
        expect(target).toBeTruthy();

        const markRead = await pageA.request.post(`${appOrigin}/api/notifications`, {
          headers: { "content-type": "application/json" },
          data: { action: "mark_one", notificationId: target!.id },
        });
        await expectOk(markRead, "Mark canonical notification read");

        const updated = await ownNotificationsForSwap(
          pageA,
          restOrigin,
          headersA!,
          userAId,
          swapId,
        );
        expect(updated.find((row) => row.id === target!.id)).toEqual(
          expect.objectContaining({
            is_read: true,
            read: true,
            read_at: expect.any(String),
          }),
        );
      });

      await test.step("clean every fixture effect by immutable identifiers and restore both accounts", async () => {
        const cleanup = await cleanupFixture({
          page: pageA,
          restOrigin,
          participantHeaders: headersA!,
          initiatorHeaders: initiatorHeaders!,
          matchId,
          conversationId,
          swapId,
          itemSnapshots,
        });

        expect(cleanup).toEqual(
          expect.objectContaining({
            swap_id: swapId,
            replayed: false,
            deleted: true,
            completion_effect_rows: 1,
            post_effect_rows: 1,
            reward_rows: 2,
            reward_amount: 60,
            notification_rows: 4,
            review_rows: 2,
          }),
        );

        const removedSwap = await pageA.request.get(
          `${restOrigin}/rest/v1/swaps?select=id&id=eq.${swapId}`,
          { headers: headersA! },
        );
        expect(JSON.parse(await expectOk(removedSwap, "Removed test Swap"))).toEqual([]);

        expect(
          await ownTokensForSwap(pageA, restOrigin, headersA!, userAId, swapId),
        ).toEqual([]);
        expect(
          await ownTokensForSwap(pageB, restOrigin, headersB!, userBId, swapId),
        ).toEqual([]);
        expect(
          await ownNotificationsForSwap(
            pageA,
            restOrigin,
            headersA!,
            userAId,
            swapId,
          ),
        ).toEqual([]);
        expect(
          await ownNotificationsForSwap(
            pageB,
            restOrigin,
            headersB!,
            userBId,
            swapId,
          ),
        ).toEqual([]);
        expect(
          await reviewsForSwap(pageA, restOrigin, headersA!, swapId),
        ).toEqual([]);

        const restoredMatch = await pageA.request.get(
          `${restOrigin}/rest/v1/matches?select=status,converted_swap_id&id=eq.${matchId}`,
          { headers: headersA! },
        );
        expect(JSON.parse(await expectOk(restoredMatch, "Restored Match"))).toEqual([
          { status: "accepted", converted_swap_id: null },
        ]);

        const restoredConversation = await pageA.request.get(
          `${restOrigin}/rest/v1/conversations?select=status,swap_id&id=eq.${conversationId}`,
          { headers: headersA! },
        );
        expect(
          JSON.parse(
            await expectOk(restoredConversation, "Restored conversation"),
          ),
        ).toEqual([{ status: "active", swap_id: null }]);

        for (const snapshot of itemSnapshots) {
          expect(
            await itemState(pageA, restOrigin, snapshot.headers, snapshot.state.id),
          ).toEqual(snapshot.state);
        }

        const profileAAfterCleanup = await profileSignals(
          pageA,
          restOrigin,
          headersA!,
          userAId,
        );
        const profileBAfterCleanup = await profileSignals(
          pageB,
          restOrigin,
          headersB!,
          userBId,
        );

        for (const [restored, before] of [
          [profileAAfterCleanup, profileABefore!],
          [profileBAfterCleanup, profileBBefore!],
        ] as const) {
          expect(restored.swaps_completed).toBe(before.swaps_completed);
          expect(restored.rating).toBe(before.rating);
          expect(restored.rating_count).toBe(before.rating_count);
          expect(restored.trust_score).toBe(before.trust_score);
          expect(restored.trust_level).toBe(before.trust_level);
          expect(stat(restored.stats, "tokens")).toBe(stat(before.stats, "tokens"));
          expect(stat(restored.stats, "completedSwaps")).toBe(
            stat(before.stats, "completedSwaps"),
          );
        }

        swapId = "";
      });
    } finally {
      if (
        swapId &&
        restOrigin &&
        headersA &&
        initiatorHeaders &&
        matchId &&
        conversationId &&
        itemSnapshots.length === 2
      ) {
        await cleanupFixture({
          page: pageA,
          restOrigin,
          participantHeaders: headersA,
          initiatorHeaders,
          matchId,
          conversationId,
          swapId,
          itemSnapshots,
        }).catch(() => undefined);
      }

      await contextA.close().catch(() => undefined);
      await contextB.close().catch(() => undefined);
      await outsiderContext.close().catch(() => undefined);
    }
  });
});
