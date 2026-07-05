import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const baseUrl = process.env.BASE_URL || 'https://www.swaply.world';
const routes = [
  '/en',
  '/en/objects',
  '/en/explore',
  '/en/matching',
  '/en/messages',
  '/en/exchange',
  '/en/chat',
  '/en/properties',
  '/en/services',
  '/en/events',
  '/en/about',
  '/en/contact',
];

await fs.mkdir('test-results', { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const failures = [];

for (const route of routes) {
  const url = new URL(route, baseUrl).toString();
  const name = route.replace(/^\/en\/?/, '') || 'home';
  const safeName = name.replaceAll('/', '-') || 'home';

  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `test-results/${safeName}.png`, fullPage: true });

    const status = response?.status() ?? 0;
    console.log(`${route} -> HTTP ${status} -> ${page.url()}`);

    if (status >= 500 || status === 0) {
      failures.push(`${route} returned HTTP ${status}`);
    }
  } catch (error) {
    failures.push(`${route}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

await browser.close();

if (failures.length > 0) {
  console.error('Smoke failures:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Smoke passed.');
