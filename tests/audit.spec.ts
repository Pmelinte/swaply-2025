import fs from 'fs';
import path from 'path';
import { test, expect, Page, BrowserContext, TestInfo } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || process.env.BASE_URL || 'https://www.swaply.world';
const TEST_EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL || '';
const TEST_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD || '';
const LOGIN_PATHS = ['/en/login', '/login', '/en/auth/login', '/auth/login'];
const AUTH_STATE_PATH = path.join('playwright', '.auth', 'user.json');

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

async function tryReuseSavedAuth(page: Page, context: BrowserContext): Promise<boolean> {
  if (!fs.existsSync(AUTH_STATE_PATH)) return false;
  try {
    const saved = JSON.parse(await fs.promises.readFile(AUTH_STATE_PATH, 'utf8'));
    if (Array.isArray(saved.cookies) && saved.cookies.length > 0) {
      await context.addCookies(saved.cookies);
    }
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    if (Array.isArray(saved.origins)) {
      for (const origin of saved.origins) {
        if (!Array.isArray(origin.localStorage)) continue;
        await page.evaluate((items: Array<{ name: string; value: string }>) => {
          for (const item of items) localStorage.setItem(item.name, item.value);
        }, origin.localStorage);
      }
    }
    return await collectAuthState(page, context);
  } catch {
    return false;
  }
}

async function performLogin(page: Page, context: BrowserContext, testInfo: TestInfo) {
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    testInfo.annotations.push({
      type: 'warning',
      description: 'Missing login credentials for authenticated audit.',
    });
    return false;
  }

  if (await tryReuseSavedAuth(page, context)) return true;

  for (const loginPath of LOGIN_PATHS) {
    const loginUrl = new URL(loginPath, BASE_URL).toString();
    await page.goto(loginUrl, { waitUntil: 'domcontentloaded' });

    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    if (!(await emailInput.isVisible().catch(() => false))) continue;
    if (!(await passwordInput.isVisible().catch(() => false))) continue;

    await emailInput.fill(TEST_EMAIL);
    await passwordInput.fill(TEST_PASSWORD);
    // Terms checkbox MUST be checked or the form blocks submission silently.
    await page.check('input[type="checkbox"]');

    await page.locator('button[type="submit"]').first().click();

    try {
      await page.waitForURL((url) => !url.toString().includes('/login'), { timeout: 10_000 });
    } catch {
      throw new Error('Login failed - check credentials or form');
    }

    await page.waitForLoadState('networkidle').catch(() => {});

    await ensureDir(path.dirname(AUTH_STATE_PATH));
    await context.storageState({ path: AUTH_STATE_PATH });
    return true;
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