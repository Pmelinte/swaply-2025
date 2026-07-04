import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

const CANONICAL_PUBLIC_ROUTES = [
  "/en",
  "/en/objects",
  "/en/explore",
  "/en/matching",
  "/en/properties",
  "/en/services",
  "/en/events",
  "/en/blog",
  "/en/about",
  "/en/contact",
];

const LEGACY_ROUTES = [
  { from: "/en/match", to: /\/en\/matching/ },
  { from: "/en/change", to: /\/en\/exchange/ },
  { from: "/en/items", to: /\/en\/objects/ },
];

test.use({ viewport: { width: 1280, height: 800 } });

test("canonical public routes respond", async ({ page }) => {
  const failures: string[] = [];

  for (const route of CANONICAL_PUBLIC_ROUTES) {
    const response = await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle" });
    const status = response?.status() ?? 0;
    await page.screenshot({
      path: `test-results/canonical-${route.replace(/^\/en\/?/, "home").replaceAll("/", "-")}.png`,
      fullPage: true,
    });

    if (status >= 500) {
      failures.push(`${route} returned HTTP ${status}`);
    }
  }

  expect(failures, failures.join("\n")).toHaveLength(0);
});

test("legacy routes redirect to canonical routes", async ({ page }) => {
  for (const route of LEGACY_ROUTES) {
    await page.goto(`${BASE_URL}${route.from}`, { waitUntil: "networkidle" });
    await expect(page).toHaveURL(route.to);
  }
});

test("admin canonical page has a response", async ({ page }) => {
  try {
    const response = await page.goto(`${BASE_URL}/en/admin/canonical`, { waitUntil: "networkidle" });
    expect(response?.status() ?? 0).toBeLessThan(500);
  } finally {
    await page.screenshot({ path: "test-results/admin-canonical.png", fullPage: true });
  }
});
