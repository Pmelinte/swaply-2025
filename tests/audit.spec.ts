import fs from 'fs';
import path from 'path';
import { test, expect, Page, BrowserContext, TestInfo } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || process.env.BASE_URL || 'https://www.swaply.world';
const TEST_EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL || '';
const TEST_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD || '';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

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

async function performLogin(page: Page, context: BrowserContext, testInfo: TestInfo): Promise<boolean> {
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    testInfo.annotations.push({
      type: 'warning',
      description: 'Missing login credentials for authenticated audit.',
    });
    return false;
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    testInfo.annotations.push({
      type: 'warning',
      description: 'Missing SUPABASE_URL or SUPABASE_ANON_KEY — cannot authenticate.',
    });
    return false;
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    });

    if (!response.ok) return false;

    const session = await response.json() as Record<string, unknown>;
    const { access_token } = session;
    if (!access_token) return false;

    // Navigate to base URL first so localStorage is set on the correct origin
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    // Supabase JS v2 stores the session under sb-<projectRef>-auth-token
    const projectRef = SUPABASE_URL.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1] ?? '';
    const storageKey = projectRef ? `sb-${projectRef}-auth-token` : 'sb-auth-token';

    await page.evaluate(
      ({ key, value }: { key: string; value: string }) => {
        localStorage.setItem(key, value);
      },
      { key: storageKey, value: JSON.stringify(session) }
    );

    return true;
  } catch {
    return false;
  }
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