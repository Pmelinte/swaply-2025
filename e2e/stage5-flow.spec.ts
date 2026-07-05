import { test, expect } from "@playwright/test";

const DEMO_CONVERSATION_ID = process.env.SWAPLY_DEMO_CONVERSATION_ID;

test.describe("Stage 5 real exchange flow", () => {
  test("real chat route exposes exchange controls @auth", async ({ page }) => {
    test.skip(!DEMO_CONVERSATION_ID, "Set SWAPLY_DEMO_CONVERSATION_ID to exercise a real conversation.");

    await page.goto(`/en/chat?conversation=${DEMO_CONVERSATION_ID}`, { waitUntil: "networkidle" });

    await expect(page.getByText("Swap conversation")).toBeVisible();
    await expect(page.getByText(/Swap:/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Accept swap" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Reject" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Complete swap|Completed|Completing/ })).toBeVisible();
    await expect(page.getByPlaceholder("Write a message...")).toBeVisible();
  });

  test("public matching and chat pages still render", async ({ page }) => {
    await page.goto("/en/matching", { waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/en\/matching/);
    await page.screenshot({ path: "test-results/stage5-matching.png", fullPage: true });

    await page.goto("/en/chat", { waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/en\/chat/);
    await page.screenshot({ path: "test-results/stage5-chat.png", fullPage: true });
  });
});
