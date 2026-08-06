import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { chromium, devices } from "@playwright/test";

const require = createRequire(import.meta.url);
const axePath = require.resolve("axe-core/axe.min.js");

const baseUrl = process.env.V10921_BASE_URL ?? "http://127.0.0.1:3000";
const outputDir = "audit-results/v1-09-2-1";
const routes = [
  "/en/home",
  "/en/explore",
  "/en/objects",
  "/en/properties",
  "/en/services",
  "/en/events",
  "/en/blog",
  "/en/stories",
  "/en/about",
  "/en/contact",
  "/en/login",
  "/en/register",
];

const profiles = [
  { name: "desktop", context: { viewport: { width: 1440, height: 1000 } } },
  { name: "mobile", context: { ...devices["iPhone 13"] } },
];

function serializeViolation(violation) {
  return {
    id: violation.id,
    impact: violation.impact,
    description: violation.description,
    help: violation.help,
    helpUrl: violation.helpUrl,
    tags: violation.tags,
    nodes: violation.nodes.map((node) => ({
      target: node.target,
      html: node.html,
      failureSummary: node.failureSummary,
    })),
  };
}

async function keyboardEvidence(page) {
  await page.locator("body").click({ position: { x: 1, y: 1 } });
  await page.keyboard.press("Tab");
  const first = await page.evaluate(() => {
    const element = document.activeElement;
    if (!(element instanceof HTMLElement)) return null;
    const style = getComputedStyle(element);
    return {
      tag: element.tagName.toLowerCase(),
      role: element.getAttribute("role"),
      ariaLabel: element.getAttribute("aria-label"),
      text: element.innerText?.trim().slice(0, 120) ?? "",
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      boxShadow: style.boxShadow,
      focusVisible: element.matches(":focus-visible"),
    };
  });

  const sequence = [];
  for (let index = 0; index < 12; index += 1) {
    await page.keyboard.press("Tab");
    const entry = await page.evaluate(() => {
      const element = document.activeElement;
      if (!(element instanceof HTMLElement)) return null;
      return {
        tag: element.tagName.toLowerCase(),
        role: element.getAttribute("role"),
        href: element.getAttribute("href"),
        ariaLabel: element.getAttribute("aria-label"),
        text: element.innerText?.trim().slice(0, 80) ?? "",
      };
    });
    if (entry) sequence.push(entry);
  }

  return {
    firstTabTarget: first,
    sampledTabSequence: sequence,
    focusReachedInteractiveElement: Boolean(
      first && ["a", "button", "input", "select", "textarea"].includes(first.tag),
    ),
    focusIndicatorDetected: Boolean(
      first
      && first.focusVisible
      && (first.outlineStyle !== "none" || first.outlineWidth !== "0px" || first.boxShadow !== "none"),
    ),
  };
}

async function dialogEvidence(page) {
  const triggers = page.locator(
    'button[aria-haspopup="dialog"], button[aria-controls], [data-testid*="drawer"], [data-testid*="modal"]',
  );
  const triggerCount = await triggers.count();
  if (triggerCount === 0) {
    return { triggerFound: false, opened: false, focusContained: null, escapeClosed: null };
  }

  const trigger = triggers.first();
  try {
    await trigger.click({ timeout: 2_000 });
    const dialog = page.locator('[role="dialog"], [aria-modal="true"]').first();
    const opened = await dialog.isVisible({ timeout: 2_000 }).catch(() => false);
    if (!opened) return { triggerFound: true, opened: false, focusContained: null, escapeClosed: null };

    const focusContained = await page.evaluate(() => {
      const dialogElement = document.querySelector('[role="dialog"], [aria-modal="true"]');
      return Boolean(dialogElement && dialogElement.contains(document.activeElement));
    });
    await page.keyboard.press("Escape");
    const escapeClosed = !(await dialog.isVisible().catch(() => false));
    return { triggerFound: true, opened, focusContained, escapeClosed };
  } catch (error) {
    return {
      triggerFound: true,
      opened: false,
      focusContained: null,
      escapeClosed: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function auditRoute(browser, profile, route) {
  const context = await browser.newContext({
    ...profile.context,
    reducedMotion: "reduce",
    locale: "en-US",
  });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  const url = `${baseUrl}${route}`;
  const startedAt = Date.now();
  try {
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await page.locator("body").waitFor({ state: "visible", timeout: 15_000 });
    await page.waitForTimeout(1_500);
    await page.addScriptTag({ path: axePath });
    const axe = await page.evaluate(async () => window.axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
      resultTypes: ["violations", "incomplete", "passes"],
    }));
    const keyboard = await keyboardEvidence(page);
    const dialog = await dialogEvidence(page);
    const reducedMotion = await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches);

    return {
      route,
      profile: profile.name,
      url,
      status: response?.status() ?? null,
      durationMs: Date.now() - startedAt,
      axe: {
        violationCount: axe.violations.length,
        incompleteCount: axe.incomplete.length,
        passCount: axe.passes.length,
        violations: axe.violations.map(serializeViolation),
        incomplete: axe.incomplete.map(serializeViolation),
      },
      keyboard,
      dialog,
      reducedMotionPreferenceApplied: reducedMotion,
      consoleErrors,
    };
  } catch (error) {
    return {
      route,
      profile: profile.name,
      url,
      durationMs: Date.now() - startedAt,
      fatalError: error instanceof Error ? error.message : String(error),
      consoleErrors,
    };
  } finally {
    await context.close();
  }
}

async function main() {
  const browser = await chromium.launch();
  const results = [];
  try {
    for (const profile of profiles) {
      for (const route of routes) {
        results.push(await auditRoute(browser, profile, route));
      }
    }
  } finally {
    await browser.close();
  }

  const fatalCount = results.filter((entry) => entry.fatalError).length;
  const violationCount = results.reduce((sum, entry) => sum + (entry.axe?.violationCount ?? 0), 0);
  const criticalOrSeriousCount = results.reduce(
    (sum, entry) => sum + (entry.axe?.violations ?? []).filter(
      (violation) => violation.impact === "critical" || violation.impact === "serious",
    ).length,
    0,
  );
  const focusFailures = results.filter(
    (entry) => entry.keyboard && (!entry.keyboard.focusReachedInteractiveElement || !entry.keyboard.focusIndicatorDetected),
  ).length;

  const evidence = {
    generatedAt: new Date().toISOString(),
    package: "V1-09",
    batch: "V1-09.2.1",
    baselineType: "AUTOMATED_AUDIT_NOT_SIGN_OFF",
    baseUrl,
    routeCount: routes.length,
    profileCount: profiles.length,
    executionCount: results.length,
    summary: {
      fatalCount,
      violationCount,
      criticalOrSeriousCount,
      focusFailures,
      dialogSamples: results.filter((entry) => entry.dialog?.triggerFound).length,
    },
    passCriteria: {
      infrastructurePass: fatalCount === 0,
      accessibilitySignOff: false,
      note: "This batch inventories defects. Remediation and replay are required before sign-off.",
    },
    results,
  };

  await mkdir(outputDir, { recursive: true });
  await writeFile(`${outputDir}/accessibility-audit.json`, `${JSON.stringify(evidence, null, 2)}\n`);

  const markdown = [
    "# V1-09.2.1 Accessibility Audit",
    "",
    `- Generated: ${evidence.generatedAt}`,
    `- Routes: ${routes.length}`,
    `- Profiles: ${profiles.length}`,
    `- Executions: ${results.length}`,
    `- Fatal audit errors: ${fatalCount}`,
    `- axe violations: ${violationCount}`,
    `- Critical/serious violations: ${criticalOrSeriousCount}`,
    `- Keyboard/focus samples failing baseline: ${focusFailures}`,
    "",
    "This is an automated inventory, not accessibility sign-off.",
  ].join("\n");
  await writeFile(`${outputDir}/accessibility-audit.md`, `${markdown}\n`);

  console.log(JSON.stringify(evidence.summary, null, 2));
  if (fatalCount > 0) process.exitCode = 1;
}

void main();
