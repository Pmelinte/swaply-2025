import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const BASE_URL = process.env.V10932_BASE_URL || "http://127.0.0.1:3000";
const EMAIL = process.env.E2E_USER_A_EMAIL;
const PASSWORD = process.env.E2E_USER_A_PASSWORD;
const OUTPUT_DIR = path.join(process.cwd(), "audit-results", "v1-09-3-2");
const OUTPUT_PATH = path.join(OUTPUT_DIR, "properties-layout-diagnostic.json");

if (!EMAIL || !PASSWORD) throw new Error("Authenticated test credentials are required.");

async function authenticate(page) {
  await page.goto(`${BASE_URL}/en/login`, { waitUntil: "domcontentloaded", timeout: 45_000 });
  await page.locator('input[type="email"]').fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  const checkbox = page.locator('input[type="checkbox"]').first();
  if ((await checkbox.count()) > 0) await checkbox.check();
  await Promise.all([
    page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 20_000 }),
    page.locator('button[type="submit"]').click(),
  ]);
}

function localeFromUrl(rawUrl) {
  const first = new URL(rawUrl).pathname.split("/").filter(Boolean)[0];
  if (!first) throw new Error(`Cannot resolve locale from ${rawUrl}`);
  return first;
}

async function installObserver(page) {
  await page.addInitScript(() => {
    const cleanText = (node) => (node?.textContent || "").replace(/\s+/g, " ").trim().slice(0, 140);
    const describe = (node) => {
      if (!(node instanceof Element)) return null;
      return {
        tag: node.tagName.toLowerCase(),
        id: node.id || null,
        className: typeof node.className === "string" ? node.className : null,
        text: cleanText(node),
      };
    };
    const rect = (node) => {
      if (!(node instanceof Element)) return null;
      const r = node.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height, top: r.top, right: r.right, bottom: r.bottom, left: r.left };
    };
    const snapshot = () => {
      const main = document.querySelector("main");
      const topBar = document.querySelector("div.sticky.top-0");
      const branchBar = document.querySelector('nav[aria-label="Branch navigation"]');
      const ad = document.querySelector('.swaply-ad[data-placement="inline_feed"]');
      const resultCount = Array.from(document.querySelectorAll("p.mb-3.text-xs.text-zinc-400")).find((el) => /Propriet/i.test(cleanText(el)));
      const pageContainer = document.querySelector("main > div > div.mx-auto.max-w-6xl.px-4.py-6") || document.querySelector("div.mx-auto.max-w-6xl.px-4.py-6");
      return {
        at: performance.now(),
        main: { node: describe(main), rect: rect(main) },
        topBar: { node: describe(topBar), rect: rect(topBar) },
        branchBar: { node: describe(branchBar), rect: rect(branchBar) },
        ad: { node: describe(ad), rect: rect(ad) },
        resultCount: { node: describe(resultCount), rect: rect(resultCount) },
        pageContainer: { node: describe(pageContainer), rect: rect(pageContainer) },
      };
    };

    window.__propertiesLayoutDiagnostic = { shifts: [], snapshots: [] };
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.hadRecentInput) continue;
          window.__propertiesLayoutDiagnostic.shifts.push({
            value: entry.value,
            startTime: entry.startTime,
            sources: Array.from(entry.sources || []).map((source) => ({
              node: describe(source.node),
              previousRect: source.previousRect ? { x: source.previousRect.x, y: source.previousRect.y, width: source.previousRect.width, height: source.previousRect.height, top: source.previousRect.top, right: source.previousRect.right, bottom: source.previousRect.bottom, left: source.previousRect.left } : null,
              currentRect: source.currentRect ? { x: source.currentRect.x, y: source.currentRect.y, width: source.currentRect.width, height: source.currentRect.height, top: source.currentRect.top, right: source.currentRect.right, bottom: source.currentRect.bottom, left: source.currentRect.left } : null,
            })),
            pageSnapshot: snapshot(),
          });
        }
      });
      observer.observe({ type: "layout-shift", buffered: true });
    } catch {}

    let samples = 0;
    const timer = setInterval(() => {
      window.__propertiesLayoutDiagnostic.snapshots.push(snapshot());
      samples += 1;
      if (samples >= 60) clearInterval(timer);
    }, 100);
  });
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  try {
    await authenticate(page);
    await page.goto(`${BASE_URL}/en`, { waitUntil: "load", timeout: 45_000 });
    await page.waitForTimeout(1_500);
    const locale = localeFromUrl(page.url());
    await installObserver(page);

    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 150,
      downloadThroughput: (1600 * 1024) / 8,
      uploadThroughput: (750 * 1024) / 8,
      connectionType: "cellular4g",
    });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

    const startedAt = Date.now();
    await page.goto(`${BASE_URL}/${locale}/properties`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForLoadState("load", { timeout: 30_000 }).catch(() => {});
    await page.waitForTimeout(6_000);
    const diagnostic = await page.evaluate(() => window.__propertiesLayoutDiagnostic || null);
    fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify({ generatedAt: new Date().toISOString(), route: `/${locale}/properties`, wallClockMs: Date.now() - startedAt, diagnostic }, null, 2)}\n`);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
