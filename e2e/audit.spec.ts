import { test, expect, Page, BrowserContext, TestInfo } from '@playwright/test';
import fs from 'fs';
import path from 'path';

type AuditPage = {
  name: string;
  path: string;
  requiresAuth?: boolean;
};

type NavCheck = {
  label: string;
  visible: boolean;
  expectedPath: string;
  href: string | null;
  actualPath: string | null;
  ok: boolean;
  note?: string;
};

type PageAuditResult = {
  name: string;
  path: string;
  finalUrl: string;
  status: number | null;
  title: string;
  redirectedToLogin: boolean;
  loginFormVisible: boolean;
  authStateDetected: boolean;
  dialogCount: number;
  visibleDialogCount: number;
  duplicateNavLabels: string[];
  duplicateTextSequences: string[];
  bottomNavFound: boolean;
  bottomNavChecks: NavCheck[];
  emptyPage: boolean;
  emptyReason: string[];
  visibleTabLikeElementsInDialogs: string[];
  belowFoldHasContent: boolean;
  belowFoldHasCTA: boolean;
  mainTextLength: number;
  mainChildCount: number;
  visibleHeadings: string[];
  visibleButtons: string[];
  consoleErrors: string[];
  pageErrors: string[];
  requestFailures: string[];
  screenshots: {
    desktop: string;
    mobile: string;
  };
};

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'https://www.swaply.world';
const TEST_EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL || '';
const TEST_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD || '';
const LOGIN_PATHS = ['/en/login', '/login', '/en/auth/login', '/auth/login'];

const PAGES: AuditPage[] = [
  { name: 'objects', path: '/en/objects' },
  { name: 'explore', path: '/en/explore' },
  { name: 'matching', path: '/en/matching', requiresAuth: true },
  { name: 'messages', path: '/en/messages', requiresAuth: true },
  { name: 'exchange', path: '/en/exchange', requiresAuth: true },
  { name: 'chat', path: '/en/chat', requiresAuth: true },
  { name: 'properties', path: '/en/properties' },
  { name: 'services', path: '/en/services' },
  { name: 'events', path: '/en/events' },
  { name: 'blog', path: '/en/blog' },
  { name: 'about', path: '/en/about' },
  { name: 'contact', path: '/en/contact' },
];

const EXPECTED_BOTTOM_NAV: Array<{ label: string; path: string }> = [
  { label: 'Home', path: '/en' },
  { label: 'Explore', path: '/en/explore' },
  { label: 'Matching', path: '/en/matching' },
  { label: 'Messages', path: '/en/messages' },
  { label: 'Exchange', path: '/en/exchange' },
];

function slugify(input: string): string {
  return input
    .replace(/^\/+|\/+$/g, '')
    .replace(/[^\w/-]+/g, '')
    .replace(/\//g, '__') || 'home';
}

function normalizeText(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

async function ensureDir(dirPath: string) {
  await fs.promises.mkdir(dirPath, { recursive: true });
}

async function dismissCookieBanners(page: Page) {
  const selectors = [
    'button:has-text("Accept")',
    'button:has-text("I agree")',
    'button:has-text("Allow all")',
    'button:has-text("Accept all")',
    'button:has-text("OK")',
    '[aria-label*="Accept"]',
  ];

  for (const selector of selectors) {
    const candidate = page.locator(selector).first();
    if (await candidate.isVisible().catch(() => false)) {
      await candidate.click({ timeout: 1500 }).catch(() => {});
      break;
    }
  }
}

async function collectAuthState(page: Page, context: BrowserContext) {
  const cookies = await context.cookies();
  const authCookies = cookies.filter((cookie) =>
    /sb-|supabase|auth|session|token/i.test(cookie.name)
  );

  const localStorageSnapshot = await page.evaluate(() => {
    const out: Array<{ key: string; value: string }> = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key) continue;
      const value = localStorage.getItem(key) ?? '';
      out.push({ key, value: value.slice(0, 300) });
    }
    return out;
  });

  const authStorage = localStorageSnapshot.filter(
    (item) =>
      /supabase|auth|session|token|user/i.test(item.key) ||
      /access_token|refresh_token|currentSession|authenticated/i.test(item.value)
  );

  const loginFormVisible = await isLoginFormVisible(page);

  const authStateDetected =
    authCookies.length > 0 ||
    authStorage.length > 0 ||
    (!loginFormVisible &&
      (await page.locator('text=/logout|sign out|my profile|profile|settings/i').count().catch(() => 0)) > 0);

  return {
    authStateDetected,
    loginFormVisible,
    authCookies: authCookies.map((cookie) => cookie.name),
    authStorageKeys: authStorage.map((item) => item.key),
  };
}

async function isLoginFormVisible(page: Page): Promise<boolean> {
  const emailInput = page.locator(
    'input[type="email"], input[name="email"], input[autocomplete="email"], input[placeholder*="email" i]'
  );
  const passwordInput = page.locator(
    'input[type="password"], input[name="password"], input[autocomplete="current-password"], input[placeholder*="password" i]'
  );
  const submitButton = page.locator(
    'button[type="submit"], button:has-text("Sign in"), button:has-text("Login"), button:has-text("Log in"), button:has-text("Continue")'
  );

  const emailVisible = await emailInput.first().isVisible().catch(() => false);
  const passwordVisible = await passwordInput.first().isVisible().catch(() => false);
  const submitVisible = await submitButton.first().isVisible().catch(() => false);

  return (emailVisible && passwordVisible) || (passwordVisible && submitVisible);
}

async function performLogin(page: Page, context: BrowserContext, testInfo: TestInfo): Promise<boolean> {
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    testInfo.annotations.push({
      type: 'warning',
      description: 'PLAYWRIGHT_TEST_EMAIL / PLAYWRIGHT_TEST_PASSWORD are not set. Login checks may be incomplete.',
    });
    return false;
  }

  for (const loginPath of LOGIN_PATHS) {
    const url = new URL(loginPath, BASE_URL).toString();
    const response = await page.goto(url, { waitUntil: 'domcontentloaded' }).catch(() => null);
    if (!response) continue;

    await page.waitForTimeout(1200);
    await dismissCookieBanners(page);

    const emailInput = page
      .locator('input[type="email"], input[name="email"], input[autocomplete="email"], input[placeholder*="email" i]')
      .first();
    const passwordInput = page
      .locator(
        'input[type="password"], input[name="password"], input[autocomplete="current-password"], input[placeholder*="password" i]'
      )
      .first();

    const emailVisible = await emailInput.isVisible().catch(() => false);
    const passwordVisible = await passwordInput.isVisible().catch(() => false);

    if (!emailVisible || !passwordVisible) {
      continue;
    }

    await emailInput.fill(TEST_EMAIL);
    await passwordInput.fill(TEST_PASSWORD);

    const submitCandidates = [
      page.locator('button[type="submit"]').first(),
      page.locator('button:has-text("Sign in")').first(),
      page.locator('button:has-text("Login")').first(),
      page.locator('button:has-text("Log in")').first(),
      page.locator('button:has-text("Continue")').first(),
    ];

    let submitted = false;
    for (const button of submitCandidates) {
      if (await button.isVisible().catch(() => false)) {
        await Promise.all([
          page.waitForLoadState('networkidle').catch(() => {}),
          button.click().catch(() => {}),
        ]);
        submitted = true;
        break;
      }
    }

    if (!submitted) {
      await passwordInput.press('Enter').catch(() => {});
      await page.waitForLoadState('networkidle').catch(() => {});
    }

    await page.waitForTimeout(2000);
    const authState = await collectAuthState(page, context);

    if (authState.authStateDetected && !authState.loginFormVisible) {
      return true;
    }
  }

  return false;
}

async function findVisibleBottomNav(page: Page) {
  return page.locator(`
    nav:visible,
    [role="navigation"]:visible,
    [data-testid*="bottom-nav"]:visible,
    [class*="bottom-nav"]:visible,
    [class*="bottomNav"]:visible,
    [class*="fixed"][class*="bottom"]:visible,
    [class*="sticky"][class*="bottom"]:visible
  `);
}

async function getBottomMostNav(page: Page) {
  const navs = page.locator('nav, [role="navigation"], [data-testid*="bottom-nav"], [class*="bottom-nav"], [class*="bottomNav"]');
  const count = await navs.count();
  if (count === 0) return null;

  let bestIndex = -1;
  let bestTop = -Infinity;

  for (let i = 0; i < count; i += 1) {
    const nav = navs.nth(i);
    const visible = await nav.isVisible().catch(() => false);
    if (!visible) continue;

    const box = await nav.boundingBox().catch(() => null);
    if (!box) continue;

    if (box.y > bestTop) {
      bestTop = box.y;
      bestIndex = i;
    }
  }

  return bestIndex >= 0 ? navs.nth(bestIndex) : null;
}

async function inspectBottomNav(page: Page): Promise<{ found: boolean; checks: NavCheck[] }> {
  const bottomNav = await getBottomMostNav(page);
  if (!bottomNav) {
    return { found: false, checks: [] };
  }

  const checks: NavCheck[] = [];

  for (const expected of EXPECTED_BOTTOM_NAV) {
    const link = bottomNav
      .locator(`a:has-text("${expected.label}"), button:has-text("${expected.label}")`)
      .first();

    const visible = await link.isVisible().catch(() => false);
    if (!visible) {
      checks.push({
        label: expected.label,
        visible: false,
        expectedPath: expected.path,
        href: null,
        actualPath: null,
        ok: false,
        note: 'Tab not visible in bottom navigation',
      });
      continue;
    }

    const href = await link.getAttribute('href').catch(() => null);
    let actualPath: string | null = null;
    let ok = false;
    let note = '';

    if (href) {
      try {
        const resolved = new URL(href, BASE_URL);
        actualPath = resolved.pathname;
        ok = actualPath === expected.path;
        if (!ok) {
          note = `Expected ${expected.path} but href points to ${actualPath}`;
        }
      } catch {
        actualPath = href;
        ok = href === expected.path;
      }
    } else {
      note = 'Tab is a button without href';
      ok = false;
    }

    checks.push({
      label: expected.label,
      visible,
      expectedPath: expected.path,
      href,
      actualPath,
      ok,
      note: note || undefined,
    });
  }

  return { found: true, checks };
}

async function inspectDialogs(page: Page) {
  const dialogs = page.locator('[role="dialog"], dialog, [aria-modal="true"]');
  const count = await dialogs.count();
  const visibleDialogTexts: string[] = [];

  for (let i = 0; i < count; i += 1) {
    const dlg = dialogs.nth(i);
    if (!(await dlg.isVisible().catch(() => false))) continue;
    const txt = normalizeText((await dlg.innerText().catch(() => ''))).slice(0, 180);
    if (txt) visibleDialogTexts.push(txt);
  }

  const visibleTabLikeElementsInDialogs = await page.evaluate(() => {
    const dialogNodes = Array.from(
      document.querySelectorAll('[role="dialog"], dialog, [aria-modal="true"]')
    ).filter((node) => {
      const el = node as HTMLElement;
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    });

    const labels = new Set<string>();

    const isVisible = (el: Element) => {
      const h = el as HTMLElement;
      const style = window.getComputedStyle(h);
      const rect = h.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };

    for (const dialog of dialogNodes) {
      const tabCandidates = dialog.querySelectorAll(
        '[role="tab"], [role="tablist"], .tabs, [class*="tabs"], [class*="Tabs"], button[aria-selected], [data-state="active"]'
      );
      tabCandidates.forEach((node) => {
        if (!isVisible(node)) return;
        const text = (node.textContent || '').replace(/\s+/g, ' ').trim();
        if (text) labels.add(text.slice(0, 120));
      });
    }

    return Array.from(labels);
  });

  return {
    dialogCount: count,
    visibleDialogCount: visibleDialogTexts.length,
    visibleDialogTexts,
    visibleTabLikeElementsInDialogs,
  };
}

async function inspectNavDuplicateLabels(page: Page) {
  return page.evaluate(() => {
    const normalize = (text: string) => text.replace(/\s+/g, ' ').trim();

    const isVisible = (el: Element) => {
      const h = el as HTMLElement;
      const style = window.getComputedStyle(h);
      const rect = h.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };

    const navContainers = Array.from(document.querySelectorAll('nav, [role="navigation"], header'));
    const labelCounts = new Map<string, number>();
    const duplicateSequences = new Set<string>();

    for (const nav of navContainers) {
      const clickable = nav.querySelectorAll('a, button, [role="tab"], [role="menuitem"]');

      clickable.forEach((node) => {
        if (!isVisible(node)) return;
        const label = normalize(node.textContent || '');
        if (!label || label.length < 2) return;
        labelCounts.set(label, (labelCounts.get(label) || 0) + 1);

        const words = label.split(' ').map((word) => word.trim()).filter(Boolean);
        for (let i = 0; i < words.length - 1; i += 1) {
          if (words[i].toLowerCase() === words[i + 1].toLowerCase()) {
            duplicateSequences.add(`${words[i]} ${words[i + 1]}`);
          }
        }
      });
    }

    const duplicateLabels = Array.from(labelCounts.entries())
      .filter(([, count]) => count > 1)
      .map(([label]) => label);

    return {
      duplicateLabels,
      duplicateSequences: Array.from(duplicateSequences),
    };
  });
}

async function inspectMainContent(page: Page) {
  return page.evaluate(() => {
    const normalize = (text: string) => text.replace(/\s+/g, ' ').trim();

    const isVisible = (el: Element | null) => {
      if (!el) return false;
      const h = el as HTMLElement;
      const style = window.getComputedStyle(h);
      const rect = h.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };

    const candidates = [
      document.querySelector('main'),
      document.querySelector('[role="main"]'),
      document.querySelector('#__next main'),
      document.querySelector('body'),
    ].filter(Boolean) as Element[];

    const main = candidates[0] || document.body;

    const nav = document.querySelector('nav');
    const header = document.querySelector('header');
    const footer = document.querySelector('footer');

    const directChildren = Array.from(main.children).filter((el) => isVisible(el));
    const contentChildren = directChildren.filter((el) => el !== nav && el !== header && el !== footer);

    const visibleText = normalize(main.textContent || '');
    const headings = Array.from(main.querySelectorAll('h1,h2,h3'))
      .filter((el) => isVisible(el))
      .map((el) => normalize(el.textContent || ''))
      .filter(Boolean)
      .slice(0, 12);

    const buttons = Array.from(main.querySelectorAll('button, a[role="button"], a'))
      .filter((el) => isVisible(el))
      .map((el) => normalize(el.textContent || ''))
      .filter(Boolean)
      .slice(0, 20);

    const contentBlocks = Array.from(
      main.querySelectorAll('section, article, ul, ol, form, [data-testid], [class*="card"], [class*="Card"], [class*="grid"], [class*="list"]')
    ).filter((el) => isVisible(el));

    const textWithoutNavFooter = normalize(
      Array.from(main.querySelectorAll('*'))
        .filter((el) => {
          if (!isVisible(el)) return false;
          if (header?.contains(el) || nav?.contains(el) || footer?.contains(el)) return false;
          const tag = el.tagName.toLowerCase();
          return ['p', 'span', 'div', 'li', 'h1', 'h2', 'h3', 'h4', 'a', 'button'].includes(tag);
        })
        .map((el) => normalize(el.textContent || ''))
        .join(' ')
    );

    const viewportH = window.innerHeight;

    const belowFoldNodes = Array.from(main.querySelectorAll('section, article, div, form, a, button, h2, h3, p'))
      .filter((el) => {
        if (!isVisible(el)) return false;
        if (header?.contains(el) || nav?.contains(el) || footer?.contains(el)) return false;
        const rect = (el as HTMLElement).getBoundingClientRect();
        return rect.top >= viewportH - 16;
      });

    const belowFoldVisibleText = normalize(
      belowFoldNodes
        .map((el) => normalize(el.textContent || ''))
        .filter(Boolean)
        .join(' ')
    );

    const belowFoldHasCTA = belowFoldNodes.some((el) => {
      const tag = el.tagName.toLowerCase();
      const text = normalize(el.textContent || '').toLowerCase();
      return (
        tag === 'button' ||
        tag === 'a' ||
        /sign up|register|get started|learn more|explore|contact|read more|discover|join|start|continue|see more/i.test(text)
      );
    });

    const emptyReason: string[] = [];
    const meaningfulTextLength = textWithoutNavFooter.length;

    if (contentChildren.length === 0) emptyReason.push('No visible content children inside main');
    if (contentBlocks.length === 0) emptyReason.push('No visible section/article/list/form/card/grid content blocks');
    if (meaningfulTextLength < 80) emptyReason.push(`Very low non-nav/footer text length (${meaningfulTextLength})`);
    if (headings.length === 0) emptyReason.push('No visible headings in main content');

    const emptyPage = emptyReason.length >= 2;

    return {
      emptyPage,
      emptyReason,
      mainTextLength: meaningfulTextLength,
      mainChildCount: contentChildren.length,
      visibleHeadings: headings,
      visibleButtons: buttons,
      belowFoldHasContent: belowFoldVisibleText.length > 50 || belowFoldNodes.length >= 3,
      belowFoldHasCTA,
    };
  });
}

async function captureScreenshots(page: Page, pageName: string, testInfo: TestInfo) {
  const screenshotsDir = testInfo.outputPath('screenshots');
  await ensureDir(screenshotsDir);

  const desktopFile = path.join(screenshotsDir, `${pageName}__desktop.png`);
  const mobileFile = path.join(screenshotsDir, `${pageName}__mobile_390x844.png`);

  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.waitForTimeout(700);
  await page.screenshot({ path: desktopFile, fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(700);
  await page.screenshot({ path: mobileFile, fullPage: true });

  await page.setViewportSize({ width: 1440, height: 1200 });

  return {
    desktop: desktopFile,
    mobile: mobileFile,
  };
}

async function waitForStablePage(page: Page) {
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 7000 }).catch(() => {});
  await page.waitForTimeout(1200);
  await dismissCookieBanners(page);
}

async function auditSinglePage(
  page: Page,
  context: BrowserContext,
  auditPage: AuditPage,
  testInfo: TestInfo,
  authStateAlreadyDetected: boolean
): Promise<PageAuditResult> {
  const pageUrl = new URL(auditPage.path, BASE_URL).toString();
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const requestFailures: string[] = [];

  const onConsole = (msg: any) => {
    if (msg.type() === 'error') {
      const text = normalizeText(msg.text());
      if (text) consoleErrors.push(text);
    }
  };

  const onPageError = (error: Error) => {
    pageErrors.push(normalizeText(error.message));
  };

  const onRequestFailed = (request: any) => {
    const failure = request.failure();
    const text = `${request.method()} ${request.url()} :: ${failure?.errorText || 'requestfailed'}`;
    requestFailures.push(normalizeText(text));
  };

  page.on('console', onConsole);
  page.on('pageerror', onPageError);
  page.on('requestfailed', onRequestFailed);

  let responseStatus: number | null = null;
  const response = await page.goto(pageUrl, { waitUntil: 'domcontentloaded' }).catch(() => null);
  if (response) responseStatus = response.status();

  await waitForStablePage(page);

  const finalUrl = page.url();
  const title = await page.title().catch(() => '');
  const redirectedToLogin = /\/login|\/auth\/login/i.test(new URL(finalUrl).pathname);

  const authSnapshot = await collectAuthState(page, context);
  const navDuplicates = await inspectNavDuplicateLabels(page);
  const bottomNav = await inspectBottomNav(page);
  const dialogs = await inspectDialogs(page);
  const main = await inspectMainContent(page);
  const screenshots = await captureScreenshots(page, slugify(auditPage.path), testInfo);

  page.off('console', onConsole);
  page.off('pageerror', onPageError);
  page.off('requestfailed', onRequestFailed);

  return {
    name: auditPage.name,
    path: auditPage.path,
    finalUrl,
    status: responseStatus,
    title,
    redirectedToLogin,
    loginFormVisible: authSnapshot.loginFormVisible,
    authStateDetected: authSnapshot.authStateDetected || authStateAlreadyDetected,
    dialogCount: dialogs.dialogCount,
    visibleDialogCount: dialogs.visibleDialogCount,
    duplicateNavLabels: unique(navDuplicates.duplicateLabels),
    duplicateTextSequences: unique(navDuplicates.duplicateSequences),
    bottomNavFound: bottomNav.found,
    bottomNavChecks: bottomNav.checks,
    emptyPage: main.emptyPage,
    emptyReason: main.emptyReason,
    visibleTabLikeElementsInDialogs: dialogs.visibleTabLikeElementsInDialogs,
    belowFoldHasContent: main.belowFoldHasContent,
    belowFoldHasCTA: main.belowFoldHasCTA,
    mainTextLength: main.mainTextLength,
    mainChildCount: main.mainChildCount,
    visibleHeadings: main.visibleHeadings,
    visibleButtons: main.visibleButtons,
    consoleErrors: unique(consoleErrors),
    pageErrors: unique(pageErrors),
    requestFailures: unique(requestFailures),
    screenshots,
  };
}

function buildMarkdownReport(results: PageAuditResult[], loginWorked: boolean) {
  const lines: string[] = [];
  lines.push('# Swaply Playwright Audit');
  lines.push('');
  lines.push(`- Base URL: ${BASE_URL}`);
  lines.push(`- Login worked: ${loginWorked ? 'YES' : 'NO'}`);
  lines.push(`- Generated: ${new Date().toISOString()}`);
  lines.push('');

  for (const result of results) {
    lines.push(`## ${result.path}`);
    lines.push('');
    lines.push(`- Final URL: ${result.finalUrl}`);
    lines.push(`- HTTP status: ${result.status ?? 'n/a'}`);
    lines.push(`- Title: ${result.title || '(empty)'}`);
    lines.push(`- Auth state detected: ${result.authStateDetected ? 'YES' : 'NO'}`);
    lines.push(`- Redirected to login: ${result.redirectedToLogin ? 'YES' : 'NO'}`);
    lines.push(`- Login form visible: ${result.loginFormVisible ? 'YES' : 'NO'}`);
    lines.push(`- Dialog count: ${result.dialogCount}`);
    lines.push(`- Visible dialog count: ${result.visibleDialogCount}`);
    lines.push(`- Empty page: ${result.emptyPage ? 'YES' : 'NO'}`);
    lines.push(`- Bottom nav found: ${result.bottomNavFound ? 'YES' : 'NO'}`);
    lines.push(`- Below fold has content: ${result.belowFoldHasContent ? 'YES' : 'NO'}`);
    lines.push(`- Below fold has CTA: ${result.belowFoldHasCTA ? 'YES' : 'NO'}`);
    lines.push(`- Main text length: ${result.mainTextLength}`);
    lines.push(`- Main child count: ${result.mainChildCount}`);
    lines.push(`- Duplicate nav labels: ${result.duplicateNavLabels.join(' | ') || '(none)'}`);
    lines.push(`- Duplicate text sequences: ${result.duplicateTextSequences.join(' | ') || '(none)'}`);
    lines.push(
      `- Tab-like elements inside dialogs: ${
        result.visibleTabLikeElementsInDialogs.join(' | ') || '(none)'
      }`
    );
    lines.push(`- Visible headings: ${result.visibleHeadings.join(' | ') || '(none)'}`);
    lines.push(`- Visible buttons/links: ${result.visibleButtons.join(' | ') || '(none)'}`);
    lines.push(`- Empty reason: ${result.emptyReason.join(' | ') || '(none)'}`);
    lines.push(`- Desktop screenshot: ${result.screenshots.desktop}`);
    lines.push(`- Mobile screenshot: ${result.screenshots.mobile}`);
    lines.push('');

    if (result.bottomNavChecks.length) {
      lines.push('### Bottom nav checks');
      lines.push('');
      for (const check of result.bottomNavChecks) {
        lines.push(
          `- ${check.label}: visible=${check.visible ? 'YES' : 'NO'}, expected=${check.expectedPath}, href=${
            check.href ?? '(none)'
          }, actual=${check.actualPath ?? '(none)'}, ok=${check.ok ? 'YES' : 'NO'}${check.note ? `, note=${check.note}` : ''}`
        );
      }
      lines.push('');
    }

    if (result.consoleErrors.length) {
      lines.push('### Console errors');
      lines.push('');
      for (const entry of result.consoleErrors) lines.push(`- ${entry}`);
      lines.push('');
    }

    if (result.pageErrors.length) {
      lines.push('### Page errors');
      lines.push('');
      for (const entry of result.pageErrors) lines.push(`- ${entry}`);
      lines.push('');
    }

    if (result.requestFailures.length) {
      lines.push('### Request failures');
      lines.push('');
      for (const entry of result.requestFailures) lines.push(`- ${entry}`);
      lines.push('');
    }
  }

  return lines.join('\n');
}

test.describe('swaply.world comprehensive audit', () => {
  test('audits public + logged-in pages with UI/content/navigation checks', async ({ page, context }, testInfo) => {
    test.setTimeout(15 * 60 * 1000);

    const resultsDir = testInfo.outputPath('audit-results');
    await ensureDir(resultsDir);

    await page.setViewportSize({ width: 1440, height: 1200 });

    const loginWorked = await test.step('login and confirm auth state', async () => {
      return performLogin(page, context, testInfo);
    });

    const authAfterLogin = await collectAuthState(page, context);

    expect.soft(
      loginWorked || !TEST_EMAIL || !TEST_PASSWORD,
      'Login did not complete successfully even though credentials were provided'
    ).toBeTruthy();

    expect.soft(
      authAfterLogin.authStateDetected || !TEST_EMAIL || !TEST_PASSWORD,
      'No authenticated state detected after login'
    ).toBeTruthy();

    const results: PageAuditResult[] = [];

    for (const auditPage of PAGES) {
      const result = await test.step(`audit ${auditPage.path}`, async () => {
        return auditSinglePage(page, context, auditPage, testInfo, authAfterLogin.authStateDetected);
      });

      results.push(result);

      expect.soft(result.status, `${auditPage.path} should return HTTP 200`).toBe(200);
      expect.soft(result.dialogCount <= 1, `${auditPage.path} has more than one dialog open simultaneously`).toBeTruthy();
      expect.soft(
        result.duplicateTextSequences.length === 0,
        `${auditPage.path} has duplicated text sequences in navigation: ${result.duplicateTextSequences.join(', ')}`
      ).toBeTruthy();

      const incorrectBottomNavTargets = result.bottomNavChecks.filter((check) => !check.ok);
      expect.soft(
        incorrectBottomNavTargets.length === 0 || !result.bottomNavFound,
        `${auditPage.path} has broken bottom nav targets: ${incorrectBottomNavTargets
          .map((check) => `${check.label}=>${check.actualPath ?? check.href ?? 'none'}`)
          .join(', ')}`
      ).toBeTruthy();

      expect.soft(
        !result.emptyPage,
        `${auditPage.path} looks empty: ${result.emptyReason.join(' | ')}`
      ).toBeTruthy();

      expect.soft(
        result.visibleTabLikeElementsInDialogs.length === 0,
        `${auditPage.path} has visible tab-like elements inside dialogs: ${result.visibleTabLikeElementsInDialogs.join(' | ')}`
      ).toBeTruthy();

      expect.soft(
        result.belowFoldHasContent || result.belowFoldHasCTA,
        `${auditPage.path} has no visible content or CTA below the fold`
      ).toBeTruthy();

      if (auditPage.requiresAuth) {
        expect.soft(
          result.authStateDetected && !result.redirectedToLogin,
          `${auditPage.path} should be accessible after login but still looks unauthenticated`
        ).toBeTruthy();
      }
    }

    const jsonPath = path.join(resultsDir, 'swaply-audit-results.json');
    const mdPath = path.join(resultsDir, 'swaply-audit-results.md');

    await fs.promises.writeFile(jsonPath, JSON.stringify({ baseUrl: BASE_URL, loginWorked, results }, null, 2), 'utf8');
    await fs.promises.writeFile(mdPath, buildMarkdownReport(results, loginWorked), 'utf8');

    await testInfo.attach('swaply-audit-results.json', {
      path: jsonPath,
      contentType: 'application/json',
    });

    await testInfo.attach('swaply-audit-results.md', {
      path: mdPath,
      contentType: 'text/markdown',
    });
  });
});
