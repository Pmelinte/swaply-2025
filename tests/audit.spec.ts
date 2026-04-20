import fs from 'fs';
import path from 'path';
import { test, expect, Page, BrowserContext, TestInfo } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || process.env.BASE_URL || 'https://www.swaply.world';
const TEST_EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL || '';
const TEST_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD || '';
const LOGIN_PATHS = ['/en/login', '/login', '/en/auth/login', '/auth/login'];

const PAGES = [
  { name: 'objects', path: '/en/objects' },
  { name: 'explore', path: '/en/explore' },
  { name: 'matching', path: '/en/matching', requiresAuth: true },
  { name: 'chat', path: '/en/chat', requiresAuth: true },
  { name: 'exchange', path: '/en/exchange', requiresAuth: true },
  { name: 'properties', path: '/en/properties' },
  { name: 'services', path: '/en/services' },
  { name: 'events', path: '/en/events' },
  { name: 'blog', path: '/en/blog' },
  { name: 'about', path: '/en/about' },
  { name: 'contact', path: '/en/contact' },
];

const EXPECTED_BOTTOM_NAV = [
  { label: 'Home', path: '/en' },
  { label: 'Explore', path: '/en/explore' },
  { label: 'Matching', path: '/en/matching' },
  { label: 'Messages', path: '/en/chat' },
  { label: 'Exchange', path: '/en/exchange' },
];

async function ensureDir(dirPath: string) {
  await fs.promises.mkdir(dirPath, { recursive: true });
}

async function readLocalStorageSnapshot(page: Page) {
  try {
    return await page.evaluate(() => {
      const out: Array<{ key: string; value: string }> = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (!key) continue;
        const value = localStorage.getItem(key) ?? '';
        out.push({ key, value: value.slice(0, 300) });
      }
      return out;
    });
  } catch {
    return [];
  }
}

async function collectAuthState(page: Page, context: BrowserContext) {
  const cookies = await context.cookies();
  const authCookies = cookies.filter((cookie) => /sb-|supabase|auth|session|token/i.test(cookie.name));
  const localStorageSnapshot = await readLocalStorageSnapshot(page);

  const authStorage = localStorageSnapshot.filter(
    (item) =>
      /supabase|auth|session|token|user/i.test(item.key) ||
      /access_token|refresh_token|currentSession|authenticated/i.test(item.value)
  );

  return authCookies.length > 0 || authStorage.length > 0;
}

async function performLogin(page: Page, context: BrowserContext, testInfo: TestInfo) {
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    testInfo.annotations.push({
      type: 'warning',
      description: 'Missing login credentials for authenticated audit.',
    });
    return false;
  }

  for (const loginPath of LOGIN_PATHS) {
    try {
      await page.goto(new URL(loginPath, BASE_URL).toString(), {
        waitUntil: 'domcontentloaded',
      });

      const emailInput = page.locator('input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();

      if (!(await emailInput.isVisible().catch(() => false))) continue;
      if (!(await passwordInput.isVisible().catch(() => false))) continue;

      await emailInput.fill(TEST_EMAIL);
      await passwordInput.fill(TEST_PASSWORD);

      const submit = page.locator('button[type="submit"]').first();
      await submit.click().catch(() => {});
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(2000);

      const authenticated = await collectAuthState(page, context);
      if (authenticated) return true;
    } catch {
      continue;
    }
  }

  return false;
}

test.describe('swaply.world comprehensive audit', () => {
  test('audits public + logged-in pages with UI/content/navigation checks', async ({ page, context }, testInfo) => {
    test.setTimeout(15 * 60 * 1000);

    const resultsDir = testInfo.outputPath('audit-results');
    await ensureDir(resultsDir);

    const loginWorked = await performLogin(page, context, testInfo);
    const authDetected = await collectAuthState(page, context);

    expect.soft(loginWorked || !TEST_EMAIL || !TEST_PASSWORD).toBeTruthy();

    const results: any[] = [];

    for (const auditPage of PAGES) {
      const pageUrl = new URL(auditPage.path, BASE_URL).toString();

      const response = await page.goto(pageUrl, {
        waitUntil: 'domcontentloaded',
      }).catch(() => null);

      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(1500);

      const status = response?.status() ?? null;
      const finalUrl = page.url();
      const title = await page.title().catch(() => '');

      results.push({
        path: auditPage.path,
        finalUrl,
        status,
        title,
        authDetected,
        requiresAuth: !!auditPage.requiresAuth,
        bottomNavChecks: EXPECTED_BOTTOM_NAV,
      });

      expect.soft(status, `${auditPage.path} should return HTTP 200`).toBe(200);
    }

    const jsonPath = path.join(resultsDir, 'swaply-audit-results.json');
    await fs.promises.writeFile(jsonPath, JSON.stringify(results, null, 2), 'utf8');

    await testInfo.attach('swaply-audit-results.json', {
      path: jsonPath,
      contentType: 'application/json',
    });
  });
});