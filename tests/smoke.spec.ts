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

test("matching page renders (public demo)", async ({ page }) => {
  try {
    await page.goto(`${BASE_URL}/en/matching`, { waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/en\/matching/);
  } finally {
    await page.screenshot({ path: "test-results/matching.png", fullPage: true });
  }
});

test("admin diagnostic route is protected but reachable", async ({ page }) => {
  try {
    await page.goto(`${BASE_URL}/en/admin/diagnostic`, { waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/en\/admin\/diagnostic|\/en\/login/);
    await expect(page.getByText(/authenticate|access restricted|auth required|login|sign in/i).first()).toBeVisible({ timeout: 10_000 });
  } finally {
    await page.screenshot({ path: "test-results/admin-diagnostic.png", fullPage: true });
  }
});
