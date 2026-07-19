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
const ROUTE_BATCH_SIZE = 4;
const ROUTE_ATTEMPTS = 2;
const ERROR_MARKERS = [
  "This page could not be found",
  "Application error",
  "Unhandled Runtime Error",
  "MISSING_MESSAGE",
  "IntlError",
] as const;

function screenshotPath(locale: Locale, viewport: "desktop-light" | "mobile-dark") {
  mkdirSync(screenshotRoot, { recursive: true });
  return path.join(screenshotRoot, `${locale}-${viewport}.png`);
}

async function assertLocalizedResponseIsHealthy(
  request: APIRequestContext,
  locale: Locale,
  route = "",
) {
  const pathName = `/${locale}${route}`;
  let lastStatus: number | undefined;
  let lastBody = "";
  let lastError: unknown;

  for (let attempt = 1; attempt <= ROUTE_ATTEMPTS; attempt += 1) {
    try {
      const response = await request.get(pathName, {
        timeout: 45_000,
      });
      lastStatus = response.status();
      lastBody = await response.text();
      lastError = undefined;

      const hasCanonicalDocumentContract =
        lastStatus < 400
        && lastBody.includes(`lang="${locale}"`)
        && lastBody.includes(`dir="${getLocaleDirection(locale)}"`)
        && ERROR_MARKERS.every((marker) => !lastBody.includes(marker));

      if (hasCanonicalDocumentContract) {
        return;
      }
    } catch (error) {
      lastError = error;
    }

    if (attempt < ROUTE_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, 750));
    }
  }

  const marker = ERROR_MARKERS.find((candidate) => lastBody.includes(candidate));
  const diagnostic = [
    `${pathName} failed the canonical document contract after ${ROUTE_ATTEMPTS} attempts`,
    `status=${lastStatus ?? "request-error"}`,
    `expected-lang=${locale}`,
    `expected-dir=${getLocaleDirection(locale)}`,
    marker ? `error-marker=${marker}` : undefined,
    lastError instanceof Error ? `request-error=${lastError.message}` : undefined,
  ].filter(Boolean).join("; ");

  expect(lastStatus, diagnostic).toBeDefined();
  expect(lastStatus, diagnostic).toBeLessThan(400);
  expect(lastBody, diagnostic).toContain(`lang="${locale}"`);
  expect(lastBody, diagnostic).toContain(`dir="${getLocaleDirection(locale)}"`);

  for (const errorMarker of ERROR_MARKERS) {
    expect(lastBody, diagnostic).not.toContain(errorMarker);
  }
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
  for (const marker of ERROR_MARKERS) {
    await expect(body, `${locale}${route} must not expose ${marker}`).not.toContainText(marker);
  }
}

test.describe("Batch 66 — 43 locale routing smoke", () => {
  test("all locale-prefixed Home and Objects routes expose the canonical document contract", async ({
    request,
  }) => {
    test.setTimeout(480_000);

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
      test.setTimeout(90_000);

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

      await assertLocalizedPageIsHealthy(page, locale, "/objects");

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
