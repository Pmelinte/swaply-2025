import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { locales, type Locale } from "../src/i18n/config";
import { getLocaleDirection } from "../src/i18n/direction";

const screenshotRoot = path.join(process.cwd(), "playwright-i18n-screenshots");
const deepAuditLocales = ["en", "ro", "de", "ar", "zh", "yi"] as const satisfies readonly Locale[];
const ROUTE_BATCH_SIZE = 10;

function screenshotPath(locale: Locale, viewport: "desktop-light" | "mobile-dark") {
  mkdirSync(screenshotRoot, { recursive: true });
  return path.join(screenshotRoot, `${locale}-${viewport}.png`);
}

async function assertLocalizedResponseIsHealthy(
  request: APIRequestContext,
  locale: Locale,
) {
  const response = await request.get(`/${locale}/objects`, {
    timeout: 30_000,
  });
  const body = await response.text();

  expect(response.status(), `${locale}/objects must not redirect to an error`).toBeLessThan(400);
  expect(body).toContain(`lang="${locale}"`);
  expect(body).toContain(`dir="${getLocaleDirection(locale)}"`);
}

async function assertLocalizedPageIsHealthy(page: Page, locale: Locale) {
  const response = await page.goto(`/${locale}/objects`, {
    waitUntil: "domcontentloaded",
  });
  const status = response?.status();

  expect(status, `${locale}/objects must return a response`).toBeDefined();
  expect(status, `${locale}/objects must not redirect to an error`).toBeLessThan(400);

  const html = page.locator("html");
  await expect(html).toHaveAttribute("lang", locale);
  await expect(html).toHaveAttribute("dir", getLocaleDirection(locale));

  const body = page.locator("body");
  await expect(body).toBeVisible();
  await expect(body).not.toContainText("This page could not be found");
  await expect(body).not.toContainText("Application error");
  await expect(body).not.toContainText("Unhandled Runtime Error");
}

test.describe("Batch 66 — 43 locale routing smoke", () => {
  test("all 43 locale-prefixed Objects routes expose the canonical document contract", async ({
    request,
  }) => {
    test.setTimeout(240_000);

    for (let index = 0; index < locales.length; index += ROUTE_BATCH_SIZE) {
      const batch = locales.slice(index, index + ROUTE_BATCH_SIZE);
      await Promise.all(
        batch.map((locale) => assertLocalizedResponseIsHealthy(request, locale)),
      );
    }
  });
});

test.describe("Batch 66 — deep global layout samples", () => {
  for (const locale of deepAuditLocales) {
    test(`${locale} renders desktop light and mobile dark`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
      await assertLocalizedPageIsHealthy(page, locale);

      const desktopPath = screenshotPath(locale, "desktop-light");
      await page.screenshot({ path: desktopPath, fullPage: true, animations: "disabled" });
      await testInfo.attach(`${locale}-desktop-light`, {
        path: desktopPath,
        contentType: "image/png",
      });

      await page.setViewportSize({ width: 390, height: 844 });
      await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
      await page.reload({ waitUntil: "domcontentloaded" });

      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator("html")).toHaveAttribute(
        "dir",
        getLocaleDirection(locale),
      );
      await expect(page.locator("body")).toBeVisible();

      const mobilePath = screenshotPath(locale, "mobile-dark");
      await page.screenshot({ path: mobilePath, fullPage: true, animations: "disabled" });
      await testInfo.attach(`${locale}-mobile-dark`, {
        path: mobilePath,
        contentType: "image/png",
      });
    });
  }
});
