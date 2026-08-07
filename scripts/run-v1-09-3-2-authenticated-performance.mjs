import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const BASE_URL = process.env.V10932_BASE_URL || "http://127.0.0.1:3000";
const OUTPUT_DIR = path.join(process.cwd(), "audit-results", "v1-09-3-2");
const JSON_PATH = path.join(OUTPUT_DIR, "authenticated-constrained-performance.json");
const MD_PATH = path.join(OUTPUT_DIR, "authenticated-constrained-performance.md");

const EMAIL = process.env.E2E_USER_A_EMAIL;
const PASSWORD = process.env.E2E_USER_A_PASSWORD;

const ROUTE_SUFFIXES = [
  { id: "authenticated-home", suffix: "" },
  { id: "objects", suffix: "/objects" },
  { id: "matching", suffix: "/matching" },
  { id: "messages", suffix: "/messages" },
  { id: "exchange", suffix: "/exchange" },
  { id: "profile", suffix: "/profile" },
];

const NETWORK_PROFILE = {
  label: "Slow-4G-like",
  offline: false,
  latencyMs: 150,
  downloadKbps: 1600,
  uploadKbps: 750,
};

const CPU_THROTTLING_RATE = 4;

function assertRequiredEnvironment() {
  if (!EMAIL || !PASSWORD) {
    throw new Error(
      "E2E_USER_A_EMAIL and E2E_USER_A_PASSWORD are required for V1-09.3.2.",
    );
  }
}

async function validateAuthenticatedSession(page, label) {
  const response = await page.request.get(`${BASE_URL}/api/tokens/balance`);
  const body = response.ok() ? "" : await response.text();
  if (!response.ok()) {
    throw new Error(
      `${label} authenticated session validation failed: ${response.status()} ${body}`,
    );
  }
  return true;
}

function resolveLocaleFromUrl(rawUrl) {
  const url = new URL(rawUrl);
  const firstSegment = url.pathname.split("/").filter(Boolean)[0] || "";
  if (!/^[a-z]{2}(?:-[A-Za-z]{2})?$/.test(firstSegment)) {
    throw new Error(`Could not resolve authenticated locale from URL: ${rawUrl}`);
  }
  return firstSegment;
}

async function authenticate(page) {
  await page.goto(`${BASE_URL}/en/login`, {
    waitUntil: "domcontentloaded",
    timeout: 45_000,
  });

  await page.locator('input[type="email"]').fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);

  const checkbox = page.locator('input[type="checkbox"]').first();
  if ((await checkbox.count()) > 0) {
    await checkbox.check();
  }

  await Promise.all([
    page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 20_000 }),
    page.locator('button[type="submit"]').click(),
  ]);

  await validateAuthenticatedSession(page, "Initial login");
}

async function calibrateAuthenticatedLocale(page) {
  const calibrationResponse = await page.goto(`${BASE_URL}/en`, {
    waitUntil: "load",
    timeout: 45_000,
  });

  if (!calibrationResponse || calibrationResponse.status() < 200 || calibrationResponse.status() >= 400) {
    throw new Error(
      `Authenticated locale calibration failed with status ${calibrationResponse?.status() ?? "n/a"}.`,
    );
  }

  await page.waitForTimeout(1_500);
  await validateAuthenticatedSession(page, "Locale calibration");
  return resolveLocaleFromUrl(page.url());
}

async function installVitalsObservers(page) {
  await page.addInitScript(() => {
    function describeNode(node) {
      if (!(node instanceof Element)) return null;
      const tag = node.tagName.toLowerCase();
      const id = node.id ? `#${node.id}` : "";
      const classes = [...node.classList].slice(0, 4);
      const classSuffix = classes.length > 0 ? `.${classes.join(".")}` : "";
      const text = (node.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80);
      return {
        selector: `${tag}${id}${classSuffix}`,
        text,
      };
    }

    window.__swaplyV10932 = {
      lcp: 0,
      layoutShifts: [],
    };

    try {
      const lcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.__swaplyV10932.lcp = entry.startTime;
        }
      });
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
    } catch {}

    try {
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.hadRecentInput) continue;
          window.__swaplyV10932.layoutShifts.push({
            value: entry.value,
            startTime: entry.startTime,
            sources: Array.from(entry.sources || [])
              .map((source) => describeNode(source.node))
              .filter(Boolean),
          });
        }
      });
      clsObserver.observe({ type: "layout-shift", buffered: true });
    } catch {}
  });
}

async function applyConstraints(page) {
  const session = await page.context().newCDPSession(page);
  await session.send("Network.enable");
  await session.send("Network.emulateNetworkConditions", {
    offline: NETWORK_PROFILE.offline,
    latency: NETWORK_PROFILE.latencyMs,
    downloadThroughput: (NETWORK_PROFILE.downloadKbps * 1024) / 8,
    uploadThroughput: (NETWORK_PROFILE.uploadKbps * 1024) / 8,
    connectionType: "cellular4g",
  });
  await session.send("Emulation.setCPUThrottlingRate", {
    rate: CPU_THROTTLING_RATE,
  });
  return session;
}

async function measureRoute(page, route) {
  const startedAt = Date.now();
  const response = await page.goto(`${BASE_URL}${route.path}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });

  let loadCompleted = true;
  let loadError = null;
  try {
    await page.waitForLoadState("load", { timeout: 30_000 });
  } catch (error) {
    loadCompleted = false;
    loadError = error instanceof Error ? error.message : String(error);
  }

  await page.waitForTimeout(3_000);

  const authenticatedSessionValid = await validateAuthenticatedSession(page, route.id);
  const visiblePublicLoginLinks = await page.locator('a[href$="/login"]:visible').count();
  const authenticatedUiConfirmed = visiblePublicLoginLinks === 0;

  const metrics = await page.evaluate(() => {
    function calculateClsSessionWindow(entries) {
      const shifts = [...entries].sort((a, b) => a.startTime - b.startTime);
      let maxScore = 0;
      let maxWindow = [];
      let currentWindow = [];
      let currentScore = 0;
      let windowStart = 0;
      let previousTime = 0;

      for (const shift of shifts) {
        const startsNewWindow =
          currentWindow.length === 0 ||
          shift.startTime - previousTime > 1000 ||
          shift.startTime - windowStart > 5000;

        if (startsNewWindow) {
          currentWindow = [shift];
          currentScore = shift.value;
          windowStart = shift.startTime;
        } else {
          currentWindow.push(shift);
          currentScore += shift.value;
        }

        previousTime = shift.startTime;

        if (currentScore > maxScore) {
          maxScore = currentScore;
          maxWindow = [...currentWindow];
        }
      }

      return {
        score: maxScore,
        window: maxWindow,
      };
    }

    const navigation = performance.getEntriesByType("navigation")[0];
    const paints = performance.getEntriesByType("paint");
    const fcp = paints.find((entry) => entry.name === "first-contentful-paint");
    const vitals = window.__swaplyV10932 || { lcp: 0, layoutShifts: [] };
    const clsResult = calculateClsSessionWindow(vitals.layoutShifts || []);

    return {
      domContentLoadedMs: navigation?.domContentLoadedEventEnd || null,
      loadEventMs: navigation?.loadEventEnd || null,
      responseStartMs: navigation?.responseStart || null,
      transferSizeBytes: navigation?.transferSize ?? null,
      encodedBodySizeBytes: navigation?.encodedBodySize ?? null,
      fcpMs: fcp?.startTime ?? null,
      lcpMs: vitals.lcp || null,
      cls: Number.isFinite(clsResult.score) ? clsResult.score : null,
      clsWindow: clsResult.window,
      layoutShiftCount: Array.isArray(vitals.layoutShifts) ? vitals.layoutShifts.length : 0,
    };
  });

  const finalUrl = page.url();
  const redirectedToLogin = finalUrl.includes("/login");
  const localeRedirected = new URL(finalUrl).pathname !== route.path;
  const status = response?.status() ?? null;
  const okStatus = status !== null && status >= 200 && status < 400;
  const completeLoadMetrics =
    loadCompleted && metrics.loadEventMs !== null && metrics.loadEventMs > 0;

  return {
    id: route.id,
    route: route.path,
    status,
    finalUrl,
    redirectedToLogin,
    localeRedirected,
    authenticatedSessionValid,
    authenticatedUiConfirmed,
    visiblePublicLoginLinks,
    loadCompleted,
    loadError,
    wallClockMs: Date.now() - startedAt,
    ...metrics,
    pass:
      okStatus &&
      !redirectedToLogin &&
      !localeRedirected &&
      authenticatedSessionValid &&
      authenticatedUiConfirmed &&
      completeLoadMetrics,
  };
}

function renderMarkdown(report) {
  const lines = [
    "# V1-09.3.2 — Authenticated constrained-device/network performance",
    "",
    `- Generated: \`${report.generatedAt}\``,
    `- Baseline: \`${report.baseline}\``,
    `- Base URL: \`${report.baseUrl}\``,
    `- Authenticated locale: \`${report.authenticatedLocale}\``,
    `- Device: mobile viewport \`${report.device.viewport.width}x${report.device.viewport.height}\`, touch enabled`,
    `- CPU throttle: \`${report.device.cpuThrottlingRate}x\``,
    `- Network: \`${report.network.label}\` — ${report.network.downloadKbps} Kbps down / ${report.network.uploadKbps} Kbps up / ${report.network.latencyMs} ms latency`,
    `- Routes passed: **${report.summary.passed}/${report.summary.total}**`,
    "",
    "> This is a controlled laboratory baseline. It does not claim field INP or real-user Core Web Vitals sign-off.",
    "",
    "| Route | HTTP | FCP ms | LCP ms | CLS | Shifts | Load complete | Auth UI | Locale redirect | Wall ms | Result |",
    "|---|---:|---:|---:|---:|---:|---|---|---|---:|---|",
  ];

  const value = (input) =>
    input === null || input === undefined ? "n/a" : Math.round(input * 1000) / 1000;

  for (const item of report.routes) {
    lines.push(
      `| \`${item.route}\` | ${item.status ?? "n/a"} | ${value(item.fcpMs)} | ${value(item.lcpMs)} | ${value(item.cls)} | ${item.layoutShiftCount} | ${item.loadCompleted ? "yes" : "no"} | ${item.authenticatedUiConfirmed ? "yes" : "no"} | ${item.localeRedirected ? "yes" : "no"} | ${item.wallClockMs} | ${item.pass ? "PASS" : "FAIL"} |`,
    );
  }

  lines.push("", "## CLS session-window sources", "");

  for (const item of report.routes) {
    lines.push(`### \`${item.route}\` — CLS ${value(item.cls)}`, "");
    if (!item.clsWindow || item.clsWindow.length === 0) {
      lines.push("- No non-input layout shifts recorded in the winning CLS window.", "");
      continue;
    }

    for (const shift of item.clsWindow) {
      const sourceSummary = (shift.sources || [])
        .map((source) => `${source.selector}${source.text ? ` — ${source.text}` : ""}`)
        .join(" | ");
      lines.push(
        `- shift=${value(shift.value)} at ${value(shift.startTime)} ms${sourceSummary ? `: ${sourceSummary}` : ""}`,
      );
    }
    lines.push("");
  }

  lines.push(
    "## Interpretation boundary",
    "",
    "- The authenticated locale is calibrated after login using one unmeasured navigation, and every measured URL is then constructed directly in that settled locale.",
    "- CLS follows the Core Web Vitals session-window model: maximum 5-second window, ending when there is a gap greater than 1 second.",
    "- Every route re-validates the authenticated session and rejects visible public login fallback UI.",
    "- A load timeout is an incomplete measurement and fails the route instead of being silently ignored.",
    "- No data mutation is performed by this runner; authentication and read-only navigation only.",
    "- Slow external-provider fallback is not proven by this batch and remains a separate Performance requirement.",
    "- Field INP requires a distinct interaction/real-user evidence strategy and is not inferred from navigation timings.",
    "",
  );

  return `${lines.join("\n")}\n`;
}

async function main() {
  assertRequiredEnvironment();
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();

  try {
    await authenticate(page);
    const authenticatedLocale = await calibrateAuthenticatedLocale(page);
    const routesToMeasure = ROUTE_SUFFIXES.map((route) => ({
      ...route,
      path: `/${authenticatedLocale}${route.suffix}`,
    }));

    await installVitalsObservers(page);
    const cdpSession = await applyConstraints(page);

    const routes = [];
    for (const route of routesToMeasure) {
      routes.push(await measureRoute(page, route));
    }

    await cdpSession.send("Emulation.setCPUThrottlingRate", { rate: 1 });

    const report = {
      generatedAt: new Date().toISOString(),
      repository: "Pmelinte/swaply-2025",
      baseline: process.env.GITHUB_HEAD_SHA || process.env.GITHUB_SHA || "local-or-unknown",
      baseUrl: BASE_URL,
      authenticatedLocale,
      device: {
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        cpuThrottlingRate: CPU_THROTTLING_RATE,
      },
      network: NETWORK_PROFILE,
      routes,
      summary: {
        total: routes.length,
        passed: routes.filter((item) => item.pass).length,
        failed: routes.filter((item) => !item.pass).length,
      },
      caveat:
        "Controlled lab evidence only; field INP, real-user distributions and slow external-provider fallback require separate evidence.",
    };

    fs.writeFileSync(JSON_PATH, `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(MD_PATH, renderMarkdown(report));

    if (report.summary.failed > 0) {
      throw new Error(`${report.summary.failed} authenticated performance route(s) failed.`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
