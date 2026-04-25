import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

test.use({ viewport: { width: 1280, height: 800 } });

test("home page renders", async ({ page }) => {
  try {
    await page.goto(`${BASE_URL}/en`, { waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/en/);
  } finally {
    await page.screenshot({ path: "test-results/home.png", fullPage: true });
  }
});

test("chat page renders (public demo)", async ({ page }) => {
  try {
    await page.goto(`${BASE_URL}/en/chat`, { waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/en\/chat/);
  } finally {
    await page.screenshot({ path: "test-results/chat.png", fullPage: true });
  }
});

test("match page renders (public demo)", async ({ page }) => {
  try {
    await page.goto(`${BASE_URL}/en/match`, { waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/en\/match/);
  } finally {
    await page.screenshot({ path: "test-results/match.png", fullPage: true });
  }
});
