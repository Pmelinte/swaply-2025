import { test, expect } from "@playwright/test";

const domains = ["objects", "properties", "services", "events"] as const;

for (const locale of ["en", "ro", "fr"]) {
  test(`Home ${locale}: actual WebGL, four domains, responsive links`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(`/${locale}`, { waitUntil: "domcontentloaded" });
    const hero = page.locator("[data-home-world-hero]");
    const canvas = hero.locator("canvas");
    await expect(canvas).toHaveAttribute("data-world-ready", "true", { timeout: 30000 });
    expect(Number(await canvas.getAttribute("data-world-triangles"))).toBeGreaterThan(30000);
    for (const domain of domains) {
      await expect(hero.locator(`[data-world-link="${domain}"]`)).toHaveAttribute("href", new RegExp(`/${locale}/${domain}$`));
      await hero.locator(`[data-world-select="${domain}"]`).click();
      await expect(canvas).toHaveAttribute("data-world-selected", domain);
    }
    await hero.locator("button[aria-label$='3D']").nth(1).click();
    await expect(canvas).toHaveAttribute("data-world-selected", "all");
    await page.screenshot({ path: testInfo.outputPath(`home-${locale}-desktop.png`), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(hero.locator('[data-world-link="events"]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`home-${locale}-mobile.png`), fullPage: true });
    expect(errors.filter(error => /hydration|homeWorld|HomeWorldHero|WebGL|Shader/i.test(error))).toEqual([]);
  });
}

test("reduced motion, pointer orbit and rendering lifecycle", async ({ page }) => {
  await page.goto("/en", { waitUntil: "domcontentloaded" });
  const hero = page.locator("[data-home-world-hero]"), canvas = hero.locator("canvas");
  await expect(canvas).toHaveAttribute("data-world-ready", "true");
  await page.waitForTimeout(500);
  const first = await canvas.getAttribute("data-world-frame");
  await page.waitForTimeout(400);
  expect(await canvas.getAttribute("data-world-frame")).toBe(first);
  const rect = await canvas.boundingBox();
  if (!rect) throw new Error("Canvas not laid out");
  await page.mouse.move(rect.x + rect.width * .68, rect.y + rect.height * .55);
  await page.mouse.down();
  await page.mouse.move(rect.x + rect.width * .78, rect.y + rect.height * .55, { steps: 6 });
  await page.mouse.up();
  expect(Number(await canvas.getAttribute("data-world-frame"))).toBeGreaterThan(Number(first));
  const toggle = hero.locator("button[aria-pressed]").first();
  await toggle.click();
  await expect(hero).toHaveAttribute("data-scene-state", "disabled");
  await expect(canvas).toHaveCount(0);
  for (const domain of domains) await expect(hero.locator(`[data-world-link="${domain}"]`)).toBeVisible();
  await toggle.click();
  await expect(hero.locator("canvas")).toHaveAttribute("data-world-ready", "true");
});

test("WebGL unavailable: useful content and navigation remain", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (...args: Parameters<typeof original>) {
      if (args[0] === "webgl2") return null;
      return original.apply(this, args);
    } as typeof original;
  });
  await page.goto("/en", { waitUntil: "domcontentloaded" });
  const hero = page.locator("[data-home-world-hero]");
  await expect(hero).toHaveAttribute("data-scene-state", "unavailable");
  await expect(hero.locator("a[data-analytics-event='hero_cta_primary']")).toBeVisible();
  for (const domain of domains) await expect(hero.locator(`[data-world-link="${domain}"]`)).toBeVisible();
  await expect(hero.locator("[role=status]")).toContainText("3D");
});

test("keyboard selection retains a visible, focused control", async ({ page }) => {
  await page.goto("/en", { waitUntil: "domcontentloaded" });
  const hero = page.locator("[data-home-world-hero]");
  await expect(hero.locator("canvas")).toHaveAttribute("data-world-ready", "true");
  const button = hero.locator('[data-world-select="objects"]');
  await button.focus();
  await page.keyboard.press("Enter");
  await expect(button).toBeFocused();
  await expect(button).toHaveAttribute("aria-pressed", "true");
});
