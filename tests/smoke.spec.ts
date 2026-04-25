import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

test.use({ viewport: { width: 1280, height: 800 } });

test("home page renders", async ({ page }) => {
  await page.goto(`${BASE_URL}/en`, { waitUntil: "networkidle" });
  await expect(page).toHaveURL(/\/en/);
  await page.screenshot({ path: "test-results/home.png", fullPage: true });
});

test("chat page renders (public demo)", async ({ page }) => {
  await page.goto(`${BASE_URL}/en/chat`, { waitUntil: "networkidle" });
  await expect(page).toHaveURL(/\/en\/chat/);
  await page.screenshot({ path: "test-results/chat.png", fullPage: true });
});

test("matching page renders (public demo)", async ({ page }) => {
  await page.goto(`${BASE_URL}/en/matching`, { waitUntil: "networkidle" });
  await expect(page).toHaveURL(/\/en\/matching/);
  await page.screenshot({ path: "test-results/matching.png", fullPage: true });
});
