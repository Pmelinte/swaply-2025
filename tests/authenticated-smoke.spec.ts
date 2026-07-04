import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const TEST_EMAIL = process.env.SWAPLY_TEST_EMAIL;
const TEST_PASSWORD = process.env.SWAPLY_TEST_PASSWORD;

const DEMO_OBJECT_ID = process.env.SWAPLY_DEMO_OBJECT_ID;
const DEMO_PROFILE_ID = process.env.SWAPLY_DEMO_PROFILE_ID;
const DEMO_CHAT_ID = process.env.SWAPLY_DEMO_CHAT_ID;
const DEMO_EXCHANGE_ID = process.env.SWAPLY_DEMO_EXCHANGE_ID;

test.use({ viewport: { width: 1280, height: 900 } });

async function login(page: import("@playwright/test").Page) {
  test.skip(!TEST_EMAIL || !TEST_PASSWORD, "SWAPLY_TEST_EMAIL and SWAPLY_TEST_PASSWORD are required for authenticated smoke tests.");

  await page.goto(`${BASE_URL}/en/login?returnTo=/en/admin/diagnostic`, { waitUntil: "networkidle" });
  await page.locator('input[type="email"]').fill(TEST_EMAIL!);
  await page.locator('input[type="password"]').fill(TEST_PASSWORD!);

  const checkbox = page.locator('input[type="checkbox"]');
  if (await checkbox.count()) {
    await checkbox.first().check({ force: true });
  }

  await page.locator('button[type="submit"]').click();
  await page.waitForLoadState("networkidle");
}

test("authenticated admin diagnostic renders", async ({ page }) => {
  try {
    await login(page);
    await page.goto(`${BASE_URL}/en/admin/diagnostic`, { waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/en\/admin\/diagnostic/);
    await expect(page.getByText(/Swaply diagnostic/i)).toBeVisible({ timeout: 15_000 });
  } finally {
    await page.screenshot({ path: "test-results/auth-admin-diagnostic.png", fullPage: true });
  }
});

test("dynamic demo routes render when IDs are provided", async ({ page }) => {
  const routes = [
    DEMO_OBJECT_ID ? `/en/objects/${DEMO_OBJECT_ID}` : null,
    DEMO_PROFILE_ID ? `/en/profile/${DEMO_PROFILE_ID}` : null,
    DEMO_CHAT_ID ? `/en/chat/${DEMO_CHAT_ID}` : null,
    DEMO_EXCHANGE_ID ? `/en/exchange/${DEMO_EXCHANGE_ID}` : null,
  ].filter(Boolean) as string[];

  test.skip(routes.length === 0, "Set SWAPLY_DEMO_OBJECT_ID, SWAPLY_DEMO_PROFILE_ID, SWAPLY_DEMO_CHAT_ID, or SWAPLY_DEMO_EXCHANGE_ID to test dynamic demo routes.");

  const failures: string[] = [];

  for (const route of routes) {
    const response = await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle" });
    const status = response?.status() ?? 0;
    await page.screenshot({
      path: `test-results/dynamic-${route.replace(/^\/en\//, "").replaceAll("/", "-")}.png`,
      fullPage: true,
    });

    if (status >= 400) {
      failures.push(`${route} returned HTTP ${status}`);
    }
  }

  expect(failures, failures.join("\n")).toHaveLength(0);
});
