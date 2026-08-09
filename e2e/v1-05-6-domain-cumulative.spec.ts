import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { FORBIDDEN_PUBLIC_LOGIN_WALL_PATTERNS } from "../src/lib/public-pages/loginWallGuards";

const screenshotRoot = path.join(
  process.cwd(),
  "playwright-v1-05-6-screenshots",
);

const domains = [
  { key: "properties", route: "/en/properties", createPath: "/properties/new" },
  { key: "services", route: "/en/services", createPath: "/services/new" },
  { key: "events", route: "/en/events", createPath: "/events/new" },
] as const;

const viewports = [
  { name: "desktop", width: 1440, height: 1100 },
  { name: "mobile", width: 390, height: 844 },
] as const;

function screenshotPath(viewportName: string, domain: string) {
  const folder = path.join(screenshotRoot, viewportName);
  mkdirSync(folder, { recursive: true });
  return path.join(folder, `${domain}.png`);
}

async function assertHealthyPublicDomainPage(
  page: Page,
  route: string,
): Promise<void> {
  const response = await page.goto(route, { waitUntil: "domcontentloaded" });
  const status = response?.status();

  expect(status, `${route} must return a response`).toBeDefined();
  expect(status, `${route} must be publicly reachable`).toBeLessThan(400);

  await page
    .waitForLoadState("networkidle", { timeout: 5_000 })
    .catch(() => undefined);

  const body = page.locator("body");
  await expect(body).toBeVisible();
  await expect(body).not.toContainText("Application error");
  await expect(body).not.toContainText("Unhandled Runtime Error");
  await expect(body).not.toContainText("This page could not be found");

  const bodyText = await body.innerText();
  for (const pattern of FORBIDDEN_PUBLIC_LOGIN_WALL_PATTERNS) {
    expect(
      pattern.test(bodyText),
      `${route} must not degrade into a login wall matching ${pattern}`,
    ).toBe(false);
  }

  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
}

async function findVisibleCreateHandoff(
  page: Page,
  expectedPath: string,
): Promise<string | null> {
  return page.locator("a[href]").evaluateAll(
    (links, createPath) => {
      const localizedCreatePath = `/en${createPath}`;

      for (const element of links) {
        const anchor = element as HTMLAnchorElement;
        const href = anchor.getAttribute("href");
        if (!href) continue;

        const rect = anchor.getBoundingClientRect();
        const style = window.getComputedStyle(anchor);
        const isVisible =
          rect.width > 0 &&
          rect.height > 0 &&
          style.display !== "none" &&
          style.visibility !== "hidden";

        if (!isVisible) continue;

        const url = new URL(href, window.location.origin);
        const directAuthenticatedHandoff =
          url.pathname === localizedCreatePath;
        const guestReturnTo = url.searchParams.get("returnTo");
        const guestRegistrationHandoff =
          url.pathname === "/en/register" &&
          (guestReturnTo === createPath ||
            guestReturnTo === localizedCreatePath);

        if (directAuthenticatedHandoff || guestRegistrationHandoff) {
          return href;
        }
      }

      return null;
    },
    expectedPath,
  );
}

test.describe("V1-05.6 cumulative public domain journeys", () => {
  for (const viewport of viewports) {
    test.describe(viewport.name, () => {
      test.use({ viewport });

      for (const domain of domains) {
        test(`${domain.key} exposes browse, create handoff and contextual controls`, async ({
          page,
        }, testInfo) => {
          await assertHealthyPublicDomainPage(page, domain.route);

          await expect(
            page.locator('input[type="text"]').first(),
            `${domain.route} must expose a public search control`,
          ).toBeVisible();

          const createHandoffHref = await findVisibleCreateHandoff(
            page,
            domain.createPath,
          );
          expect(
            createHandoffHref,
            `${domain.route} must preserve its authenticated or guest create handoff`,
          ).not.toBeNull();

          await expect(
            page.getByRole("navigation", { name: "Branch navigation" }),
            `${domain.route} must not expose the four-domain selector outside Explore`,
          ).toHaveCount(0);

          await page
            .getByRole("button", { name: /context menu/i })
            .first()
            .click();

          const drawer = page.getByRole("dialog", {
            name: /context menu/i,
          });
          await expect(drawer).toBeVisible();
          await expect(
            drawer.locator(`[data-drawer-page="${domain.key}"]`),
            `${domain.route} must expose its own drawer identity`,
          ).toBeVisible();

          expect(
            await drawer.locator('a[href], button:not([disabled])').count(),
            `${domain.route} drawer must expose useful contextual controls`,
          ).toBeGreaterThan(1);

          const filePath = screenshotPath(viewport.name, domain.key);
          await page.screenshot({
            path: filePath,
            fullPage: true,
            animations: "disabled",
          });
          await testInfo.attach(
            `${viewport.name}-${domain.key}-cumulative`,
            {
              path: filePath,
              contentType: "image/png",
            },
          );
        });
      }
    });
  }

  test("four-domain selection lives only in Explore and preserves each public handoff", async ({
    page,
  }) => {
    const keys = ["objects", "properties", "services", "events"] as const;

    await assertHealthyPublicDomainPage(page, "/en/explore");

    const branchNavigation = page.getByRole("navigation", {
      name: "Branch navigation",
    });
    await expect(branchNavigation).toBeVisible();

    for (const key of keys) {
      await expect(
        branchNavigation.locator(`a[href="/en/${key}"]`),
        `Explore must expose the ${key} domain handoff`,
      ).toBeVisible();
    }

    for (const key of keys) {
      await branchNavigation.locator(`a[href="/en/${key}"]`).click();
      await expect(page).toHaveURL(new RegExp(`/en/${key}/?$`));
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      await expect(
        page.getByRole("navigation", { name: "Branch navigation" }),
      ).toHaveCount(0);

      if (key !== keys.at(-1)) {
        await assertHealthyPublicDomainPage(page, "/en/explore");
      }
    }
  });

  for (const domain of domains) {
    test(`${domain.key} invalid detail identity fails cleanly`, async ({
      page,
    }) => {
      const response = await page.goto(
        `${domain.route}/00000000-0000-4000-8000-000000000000`,
        { waitUntil: "domcontentloaded" },
      );
      const status = response?.status();

      expect(status, `${domain.key} invalid detail must return a response`).toBeDefined();
      expect(
        status,
        `${domain.key} invalid detail must not become a server failure`,
      ).toBeLessThan(500);

      const body = page.locator("body");
      await expect(body).toBeVisible();
      await expect(body).not.toContainText("Application error");
      await expect(body).not.toContainText("Unhandled Runtime Error");
    });
  }
});
