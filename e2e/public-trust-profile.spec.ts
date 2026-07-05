import { test, expect } from "@playwright/test";

test.describe("Public trust profile", () => {
  test("profile page exposes trust card for authenticated users @auth", async ({ page }) => {
    await page.goto("/en/profile", { waitUntil: "networkidle" });

    await expect(page.getByText("Trust profile")).toBeVisible();
    await expect(page.getByText(/Trust score/)).toBeVisible();

    await page.screenshot({ path: "test-results/public-trust-profile.png", fullPage: true });
  });
});
