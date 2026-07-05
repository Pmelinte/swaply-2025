import { test, expect } from "@playwright/test";

const ROUTES = [
  "/en/",
  "/en/explore",
  "/en/matching",
  "/en/chat",
  "/en/exchange",
  "/en/notifications",
  "/en/profile",
  "/en/objects",
  "/en/properties",
  "/en/services",
  "/en/events",
];

test.describe("Release smoke routes", () => {
  for (const route of ROUTES) {
    test(`renders ${route}`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: "networkidle" });
      expect(response?.status(), `${route} should not return 5xx`).toBeLessThan(500);
      await expect(page.locator("body")).toBeVisible();
    });
  }
});
