import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const BASE_URL = process.env.V10932_BASE_URL || "http://127.0.0.1:3000";
const OUTPUT_DIR = path.join(process.cwd(), "audit-results", "v1-09-3-2");
const JSON_PATH = path.join(OUTPUT_DIR, "authenticated-constrained-performance.json");
const MD_PATH = path.join(OUTPUT_DIR, "authenticated-constrained-performance.md");

const EMAIL = process.env.E2E_USER_A_EMAIL;
const PASSWORD = process.env.E2E_USER_A_PASSWORD;

const ROUTES = [
  { id: "authenticated-home", path: "/en" },
  { id: "objects", path: "/en/objects" },
  { id: "matching", path: "/en/matching" },
  { id: "messages", path: "/en/messages" },
  { id: "exchange", path: "/en/exchange" },
  { id: "profile", path: "/en/profile" },
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

  const sessionCheck = await page.request.get(`${BASE_URL}/api/tokens/balance`);
  if (!sessionCheck.ok()) {
    throw new Error(
      `Authenticated session validation failed: ${sessionCheck.status()} ${await sessionCheck.text()}`,
    );
  }
}

async function installVitalsObservers(page) {
  await page.addInitScript(() => {
    window.__swaplyV10932 = {
      lcp: 0,
      cls: 0,
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
      let cls = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) cls += entry.value;
        }
        window.__swaplyV10932.cls = cls;
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

  await page.waitForLoadState("load", { timeout: 30_000 }).catch(() => {});
  await page.waitForTimeout(3_000);

  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType("navigation")[0];
    const paints = performance.getEntriesByType("paint");
    const fcp = paints.find((entry) => entry.name === "first-contentful-paint");
    const vitals = window.__swaplyV10932 || { lcp: 0, cls: 0 };

    return {
      domContentLoadedMs: navigation?.domContentLoadedEventEnd ?? null,
      loadEventMs: navigation?.loadEventEnd ?? null,
      responseStartMs: navigation?.responseStart ?? null,
      transferSizeBytes: navigation?.transferSize ?? null,
      encodedBodySizeBytes: navigation?.encodedBodySize ?? null,
      fcpMs: fcp?.startTime ?? null,
      lcpMs: vitals.lcp || null,
      cls: Number.isFinite(vitals.cls) ? vitals.cls : null,
    };
  });

  const finalUrl = page.url();
  const redirectedToLogin = finalUrl.includes("/login");
  const status = response?.status() ?? null;
  const okStatus = status !== null && status >= 200 && status < 400;

  return {
    id: route.id,
    route: route.path,
    status,
    finalUrl,
    redirectedToLogin,
    wallClockMs: Date.now() - startedAt,
    ...metrics,
    pass: okStatus && !redirectedToLogin,
  };
}

function renderMarkdown(report) {
  const lines = [
    "# V1-09.3.2 — Authenticated constrained-device/network performance",
    "",
    `- Generated: \`${report.generatedAt}\``,
    `- Baseline: \`${report.baseline}\``,
    `- Base URL: \`${report.baseUrl}\``,
    `- Device: mobile viewport \`${report.device.viewport.width}x${report.device.viewport.height}\`, touch enabled`,
    `- CPU throttle: \`${report.device.cpuThrottlingRate}x\``,
    `- Network: \`${report.network.label}\` — ${report.network.downloadKbps} Kbps down / ${report.network.uploadKbps} Kbps up / ${report.network.latencyMs} ms latency`,
    `- Routes passed: **${report.summary.passed}/${report.summary.total}**`,
    "",
    "> This is a controlled laboratory baseline. It does not claim field INP or real-user Core Web Vitals sign-off.",
    "",
    "| Route | HTTP | FCP ms | LCP ms | CLS | DCL ms | Load ms | Wall ms | Result |",
    "|---|---:|---:|---:|---:|---:|---:|---:|---|",
  ];

  for (const item of report.routes) {
    const value = (input) => (input === null ? "n/a" : Math.round(input * 1000) / 1000);
    lines.push(
      `| \`${item.route}\` | ${item.status ?? "n/a"} | ${value(item.fcpMs)} | ${value(item.lcpMs)} | ${value(item.cls)} | ${value(item.domContentLoadedMs)} | ${value(item.loadEventMs)} | ${item.wallClockMs} | ${item.pass ? "PASS" : "FAIL"} |`,
    );
  }

  lines.push(
    "",
    "## Interpretation boundary",
    "",
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
    await installVitalsObservers(page);
    const cdpSession = await applyConstraints(page);

    const routes = [];
    for (const route of ROUTES) {
      routes.push(await measureRoute(page, route));
    }

    await cdpSession.send("Emulation.setCPUThrottlingRate", { rate: 1 });

    const report = {
      generatedAt: new Date().toISOString(),
      repository: "Pmelinte/swaply-2025",
      baseline: process.env.GITHUB_HEAD_SHA || process.env.GITHUB_SHA || "local-or-unknown",
      baseUrl: BASE_URL,
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
