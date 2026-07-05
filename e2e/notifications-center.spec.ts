import { test, expect } from "@playwright/test";

test.describe("Notifications center", () => {
  test("renders the notifications page", async ({ page }) => {
    await page.goto("/en/notifications", { waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/en\/notifications/);
    await expect(page.getByText("Notifications")).toBeVisible();
    await page.screenshot({ path: "test-results/notifications-center.png", fullPage: true });
  });
});
