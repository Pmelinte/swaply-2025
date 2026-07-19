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
const ROUTE_BATCH_SIZE = 8;

function screenshotPath(locale: Locale, viewport: "desktop-light" | "mobile-dark") {
  mkdirSync(screenshotRoot, { recursive: true });
  return path.join(screenshotRoot, `${locale}-${viewport}.png`);
}

async function assertLocalizedResponseIsHealthy(
  request: APIRequestContext,
  locale: Locale,
  route = "",
) {
  const response = await request.get(`/${locale}${route}`);
  const body = await response.text();

  expect(response.status(), `${locale}${route} must not redirect to an error`).toBeLessThan(400);
  expect(body).toContain(`lang="${locale}"`);
  expect(body).toContain(`dir="${getLocaleDirection(locale)}"`);
  expect(body).not.toContain("This page could not be found");
  expect(body).not.toContain("Application error");
  expect(body).not.toContain("Unhandled Runtime Error");
  expect(body).not.toContain("MISSING_MESSAGE");
  expect(body).not.toContain("IntlError");
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
  test("all locale-prefixed Home and Objects routes expose the canonical document contract", async ({
    request,
  }) => {
    test.setTimeout(180_000);

    const routeChecks = locales.flatMap((locale) => [
      { locale, route: "" },
      { locale, route: "/objects" },
    ]);

    for (let index = 0; index < routeChecks.length; index += ROUTE_BATCH_SIZE) {
      const batch = routeChecks.slice(index, index + ROUTE_BATCH_SIZE);
      await Promise.all(
        batch.map(({ locale, route }) =>
          assertLocalizedResponseIsHealthy(request, locale, route),
        ),
      );
    }
  });
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
