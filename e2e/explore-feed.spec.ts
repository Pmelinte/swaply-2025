import { test, expect } from "@playwright/test";

test.describe("Explore feed", () => {
  test("renders trending and recommended section", async ({ page }) => {
    await page.goto("/en/explore", { waitUntil: "networkidle" });

    await expect(page.getByText("Trending & recommended")).toBeVisible();
    await expect(page.getByText("AI ranked")).toBeVisible();

    await page.screenshot({
      path: "test-results/explore-feed.png",
      fullPage: true,
    });
  });
});
