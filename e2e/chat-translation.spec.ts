import { test, expect } from "@playwright/test";

test.describe("Chat translation", () => {
  test("chat page exposes translation controls @auth", async ({ page }) => {
    await page.goto("/en/chat", { waitUntil: "networkidle" });

    await expect(page.getByText("Translate to")).toBeVisible();
    await expect(page.locator("select").first()).toBeVisible();

    await page.screenshot({ path: "test-results/chat-translation.png", fullPage: true });
  });
});
