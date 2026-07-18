import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { locales, type Locale } from "../src/i18n/config";
import { getLocaleDirection } from "../src/i18n/direction";

const screenshotRoot = path.join(process.cwd(), "playwright-i18n-screenshots");
const deepAuditLocales = ["en", "ro", "de", "ar", "zh", "yi"] as const satisfies readonly Locale[];

function screenshotPath(locale: Locale, viewport: "desktop-light" | "mobile-dark") {
  mkdirSync(screenshotRoot, { recursive: true });
  return path.join(screenshotRoot, `${locale}-${viewport}.png`);
}

async function assertLocalizedPageIsHealthy(page: Page, locale: Locale, route = "") {
  const response = await page.goto(`/${locale}${route}`, {
    waitUntil: "domcontentloaded",
  });
  const status = response?.status();

  expect(status, `${locale}${route} must return a response`).toBeDefined();
  expect(status, `${locale}${route} must not redirect to an error`).toBeLessThan(400);

  const html = page.locator("html");
  await expect(html).toHaveAttribute("lang", locale);
  await expect(html).toHaveAttribute("dir", getLocaleDirection(locale));

  const body = page.locator("body");
  await expect(body).toBeVisible();
  await expect(body).not.toContainText("This page could not be found");
  await expect(body).not.toContainText("Application error");
  await expect(body).not.toContainText("Unhandled Runtime Error");
  await expect(body).not.toContainText("MISSING_MESSAGE");
  await expect(body).not.toContainText("IntlError");
}

test.describe("Batch 66 — 43 locale routing smoke", () => {
  for (const locale of locales) {
    test(`${locale} home and Objects routes load with the canonical document language`, async ({ page }) => {
      await assertLocalizedPageIsHealthy(page, locale);
      await assertLocalizedPageIsHealthy(page, locale, "/objects");
    });
  }
});

test.describe("Batch 66 — deep global layout samples", () => {
  for (const locale of deepAuditLocales) {
    test(`${locale} renders desktop light and mobile dark without horizontal document overflow`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
      await assertLocalizedPageIsHealthy(page, locale, "/objects");

      const desktopPath = screenshotPath(locale, "desktop-light");
      await page.screenshot({ path: desktopPath, fullPage: true, animations: "disabled" });
      await testInfo.attach(`${locale}-desktop-light`, {
        path: desktopPath,
        contentType: "image/png",
      });

      await page.setViewportSize({ width: 390, height: 844 });
      await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
      await page.reload({ waitUntil: "domcontentloaded" });

      const documentWidth = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(
        documentWidth.scrollWidth,
        `${locale} must not overflow the mobile document viewport`,
      ).toBeLessThanOrEqual(documentWidth.clientWidth + 1);

      const mobilePath = screenshotPath(locale, "mobile-dark");
      await page.screenshot({ path: mobilePath, fullPage: true, animations: "disabled" });
      await testInfo.attach(`${locale}-mobile-dark`, {
        path: mobilePath,
        contentType: "image/png",
      });
    });
  }
});
