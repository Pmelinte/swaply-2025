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

function storage(path: string) {
  return JSON.parse(readFileSync(path, "utf8"));
}

async function prepare(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("cookie_consent", "rejected");
    localStorage.setItem("swaply_cookie_consent", "rejected");
  });
  await page.goto(profilePath, { waitUntil: "domcontentloaded" });
  await expectAuthenticatedSession(page, "Batch 59 participant");
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

function headersFrom(response: Response) {
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

test.describe("Train C Batch 59 bilateral agreement", () => {
  test("syncs one agreement revision and requires two confirmations", async ({
    browser,
  }) => {
    test.setTimeout(180_000);

    const contextA = await browser.newContext({ storageState: storage(userAAuthFile) });
    const contextB = await browser.newContext({ storageState: storage(userBAuthFile) });
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    try {
      await prepare(pageA);
      await prepare(pageB);

      let conversationId = "";
      let matchId = "";
      let restOrigin = "";
      let authHeaders: ReturnType<typeof headersFrom> | null = null;
      let anonApiKey = "";
      let initialMessages = 0;

      await test.step("open the same accepted match conversation", async () => {
        const listA = pageA.waitForResponse(isConversationList, { timeout });
        await pageA.goto(messagesPath, { waitUntil: "domcontentloaded" });
        const responseA = await listA;
        const rows = (await responseA.json()) as Array<{
          id: string;
          match_id: string | null;
        }>;
        const conversation = rows.find((row) => row.match_id);
        expect(conversation).toBeTruthy();

        conversationId = conversation!.id;
        matchId = conversation!.match_id!;
        restOrigin = new URL(responseA.url()).origin;
        authHeaders = headersFrom(responseA);

        await pageA.getByTestId(`conversation-select-${conversationId}`).click();
        await expect(pageA.getByTestId("match-agreement-panel")).toBeVisible();

        const listB = pageB.waitForResponse(isConversationList, { timeout });
        await pageB.goto(`${messagesPath}?conversation=${conversationId}`, {
          waitUntil: "domcontentloaded",
        });
        const responseB = await listB;
        anonApiKey = headersFrom(responseB).apikey;
        await pageB.getByTestId(`conversation-select-${conversationId}`).click();
        await expect(pageB.getByTestId("match-agreement-panel")).toBeVisible();

        const messages = await pageA.request.get(
          `${restOrigin}/rest/v1/messages?select=id&conversation_id=eq.${conversationId}`,
          { headers: authHeaders! },
        );
        expect(messages.ok()).toBe(true);
        initialMessages = ((await messages.json()) as unknown[]).length;

        await pageA.waitForTimeout(750);
      });

      const before = revision(
        await pageA.getByTestId("match-agreement-revision").innerText(),
      );

      await test.step("save and synchronize a new revision", async () => {
        await pageA
          .getByTestId("match-agreement-condition")
          .fill("Both participants reviewed the visible condition notes.");
        await pageA
          .getByTestId("match-agreement-offer")
          .fill("The two listed items are exchanged directly.");
        await pageA
          .getByTestId("match-agreement-logistics-method")
          .selectOption("local_handover");
        await pageA
          .getByTestId("match-agreement-logistics-notes")
          .fill("Meet in a safe public place.");
        await pageA
          .getByTestId("match-agreement-additional")
          .fill("No automatic Exchange is created.");

        const save = pageA.waitForResponse(isAgreementRpc, { timeout });
        await pageA.getByTestId("match-agreement-save").click();
        expect((await save).ok()).toBe(true);

        await expect(pageB.getByTestId("match-agreement-revision")).toContainText(
          String(before + 1),
          { timeout },
        );
        await expect(pageB.getByTestId("match-agreement-offer")).toHaveValue(
          "The two listed items are exchanged directly.",
        );
      });

      await test.step("both users confirm the same revision", async () => {
        const confirmA = pageA.waitForResponse(isAgreementRpc, { timeout });
        await pageA.getByTestId("match-agreement-confirm").click();
        expect((await confirmA).ok()).toBe(true);
        await expect(
          pageB.getByTestId("match-agreement-partner-status"),
        ).toContainText("Partner confirmed", { timeout });

        const confirmB = pageB.waitForResponse(isAgreementRpc, { timeout });
        await pageB.getByTestId("match-agreement-confirm").click();
        expect((await confirmB).ok()).toBe(true);

        await expect(
          pageA.getByTestId("match-agreement-overall-status"),
        ).toContainText("confirmed by both", { timeout });
        await expect(
          pageA.getByTestId("match-stage-complete-agreement"),
        ).toContainText("Both confirmed");
      });

      await test.step("editing resets both confirmations", async () => {
        await pageA
          .getByTestId("match-agreement-additional")
          .fill("Updated terms after both confirmations.");
        const save = pageA.waitForResponse(isAgreementRpc, { timeout });
        await pageA.getByTestId("match-agreement-save").click();
        expect((await save).ok()).toBe(true);

        await expect(pageB.getByTestId("match-agreement-revision")).toContainText(
          String(before + 2),
          { timeout },
        );
        await expect(pageA.getByTestId("match-agreement-self-status")).toContainText(
          "pending",
        );
        await expect(
          pageB.getByTestId("match-agreement-partner-status"),
        ).toContainText("pending");
      });

      await test.step("persist without side effects and deny anonymous updates", async () => {
        await pageA.reload({ waitUntil: "domcontentloaded" });
        await expect(pageA.getByTestId("match-agreement-revision")).toContainText(
          String(before + 2),
          { timeout },
        );

        const conversations = await pageA.request.get(
          `${restOrigin}/rest/v1/conversations?select=id,swap_id,agenda_state&match_id=eq.${matchId}`,
          { headers: authHeaders! },
        );
        expect(conversations.ok()).toBe(true);
        const rows = (await conversations.json()) as Array<{
          swap_id: string | null;
          agenda_state: {
            completed_stages: string[];
            agreement: { revision: number; confirmed_by: string[] };
          };
        }>;
        expect(rows).toHaveLength(1);
        expect(rows[0].swap_id).toBeNull();
        expect(rows[0].agenda_state.agreement).toEqual(
          expect.objectContaining({
            revision: before + 2,
            confirmed_by: [],
          }),
        );
        expect(rows[0].agenda_state.completed_stages).not.toContain("agreement");

        const messages = await pageA.request.get(
          `${restOrigin}/rest/v1/messages?select=id&conversation_id=eq.${conversationId}`,
          { headers: authHeaders! },
        );
        expect(((await messages.json()) as unknown[]).length).toBe(initialMessages);

        const match = await pageA.request.get(
          `${restOrigin}/rest/v1/matches?select=status,converted_swap_id&id=eq.${matchId}`,
          { headers: authHeaders! },
        );
        expect(await match.json()).toEqual([
          { status: "accepted", converted_swap_id: null },
        ]);

        const anonymous = await pageB.request.post(
          `${restOrigin}/rest/v1/rpc/update_match_conversation_agreement`,
          {
            headers: {
              apikey: anonApiKey,
              "content-type": "application/json",
            },
            data: {
              p_conversation_id: conversationId,
              p_action: "confirm",
              p_expected_revision: before + 2,
              p_payload: {},
            },
          },
        );
        expect([401, 403]).toContain(anonymous.status());
      });
    } finally {
      await contextA.close().catch(() => undefined);
      await contextB.close().catch(() => undefined);
    }
  });
});
