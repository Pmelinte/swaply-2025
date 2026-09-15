import { test, expect, type Page, type Locator } from "@playwright/test";

const domains = ["objects", "properties", "services", "events"] as const;

async function ready(page: Page) {
  // React streaming may briefly retain an outgoing hidden tree. Require it to
  // settle to exactly one hero and one rendered canvas, rather than using first().
  await page.waitForFunction(() => {
    const heroes = document.querySelectorAll("[data-home-world-hero]");
    const canvases = document.querySelectorAll<HTMLCanvasElement>("[data-home-world-hero] canvas");
    return heroes.length === 1 && canvases.length === 1 && canvases[0].dataset.worldReady === "true";
  }, undefined, { timeout: 30000 });
  const hero = page.locator("[data-home-world-hero]");
  await expect(hero).toHaveCount(1);
  await expect(hero.locator("canvas")).toHaveCount(1);
  return { hero, canvas: hero.locator("canvas") };
}

async function pixels(canvas: Locator) {
  return canvas.evaluate((element: HTMLCanvasElement) => {
    const gl = element.getContext("webgl2");
    if (!gl) throw new Error("No real WebGL2 context");
    const data = new Uint8Array(element.width * element.height * 4);
    gl.readPixels(0, 0, element.width, element.height, gl.RGBA, gl.UNSIGNED_BYTE, data);
    let opaque = 0;
    const colours = new Set<string>();
    for (let i = 0; i < data.length; i += 256) {
      if (data[i + 3] > 128) opaque++;
      colours.add(`${data[i] >> 4},${data[i + 1] >> 4},${data[i + 2] >> 4}`);
    }
    return { error: gl.getError(), opaque, samples: Math.ceil(data.length / 256), colours: colours.size };
  });
}

for (const locale of ["en", "ro", "fr"]) {
  test(`Home ${locale}: actual WebGL, four domains, responsive links`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(`/${locale}`, { waitUntil: "domcontentloaded" });
    const { hero, canvas } = await ready(page);
    expect(Number(await canvas.getAttribute("data-world-triangles"))).toBeGreaterThan(30000);
    for (const domain of domains) {
      await expect(hero.locator(`[data-world-link="${domain}"]`)).toHaveAttribute("href", new RegExp(`/${locale}/${domain}$`));
      await hero.locator(`[data-world-select="${domain}"]`).click();
      await expect(canvas).toHaveAttribute("data-world-selected", domain);
    }
    await hero.locator("[data-world-reset]").click();
    await expect(canvas).toHaveAttribute("data-world-selected", "all");
    await page.waitForTimeout(300);
    const desktop = await pixels(canvas);
    expect(desktop.error).toBe(0);
    expect(desktop.opaque / desktop.samples).toBeGreaterThan(.25);
    expect(desktop.colours).toBeGreaterThan(20);
    await testInfo.attach("desktop-pixel-check", { body: JSON.stringify(desktop), contentType: "application/json" });
    await page.screenshot({ path: testInfo.outputPath(`home-${locale}-desktop.png`), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);
    await expect(hero.locator('[data-world-link="events"]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2)).toBe(true);
    const mobile = await pixels(canvas);
    expect(mobile.error).toBe(0);
    expect(mobile.opaque / mobile.samples).toBeGreaterThan(.25);
    expect(mobile.colours).toBeGreaterThan(20);
    await testInfo.attach("mobile-pixel-check", { body: JSON.stringify(mobile), contentType: "application/json" });
    await page.screenshot({ path: testInfo.outputPath(`home-${locale}-mobile.png`), fullPage: true });
    expect(errors.filter(error => /hydration|homeWorld|HomeWorldHero|WebGL|Shader/i.test(error))).toEqual([]);
  });
}

test("reduced motion, pointer orbit and rendering lifecycle", async ({ page }) => {
  await page.goto("/en", { waitUntil: "domcontentloaded" });
  const { hero, canvas } = await ready(page);
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
  await ready(page);
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
  await page.waitForFunction(() => {
    const heroes = document.querySelectorAll<HTMLElement>("[data-home-world-hero]");
    return heroes.length === 1 && heroes[0].dataset.sceneState === "unavailable";
  });
  const hero = page.locator("[data-home-world-hero]");
  await expect(hero.locator("a[data-analytics-event='hero_cta_primary']")).toBeVisible();
  for (const domain of domains) await expect(hero.locator(`[data-world-link="${domain}"]`)).toBeVisible();
  await expect(hero.locator("[role=status]")).toContainText("3D");
});

test("keyboard selection retains a visible, focused control", async ({ page }) => {
  await page.goto("/en", { waitUntil: "domcontentloaded" });
  const { hero } = await ready(page);
  const button = hero.locator('[data-world-select="objects"]');
  await button.focus();
  await page.keyboard.press("Enter");
  await expect(button).toBeFocused();
  await expect(button).toHaveAttribute("aria-pressed", "true");
});
