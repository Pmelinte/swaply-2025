import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const PORT = 3210;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const EXPECTED_LOCALE_COUNT = 43;

const DETAIL_ROUTES = [
  "/en",
  "/en/pricing",
  "/en/about",
  "/en/info",
  "/en/integrations",
  "/en/safety",
  "/en/match",
];

const FORBIDDEN_MARKERS = [
  "$3.99",
  "$9.99",
  "$39.99 / year",
  "Choose Premium",
  "Upgrade now",
  "Buy Tokens",
  "or PayPal",
  "Redirecting to PayPal",
  "Card (Stripe)",
  "Secure payment via Stripe",
  "permanently verified identity",
  "Upload a photo of your government-issued ID",
  "Upload a selfie holding your ID next to your face",
  "Submit for review",
  "All messages are automatically moderated",
  "Attachments are scanned for safety",
  "Permanently preserved history",
  "Automatic anti-spam moderation",
  "reviews all reports within 24 hours",
  "support@swaply.app",
  "privacy@swaply.app",
  "dpo@swaply.app",
  "safety@swaply.app",
  "Both guarantees are active",
  "the deposit returns automatically",
  "After 21 days, an admin review is triggered",
  "Basic - Free",
  "Plus - €2.99",
  "Full - €4.99",
  "Up to €200",
  "Up to €500",
  "Up to €2000",
  "Items with photos get 4x more proposals",
  "Items with 3+ photos get 4x more swap proposals",
  "Each reused object avoids ~4.2 kg CO₂",
  "Real exchanges that happened on Swaply",
  "full protection",
  "recommended courier",
  "30 bonus tokens",
  "Upgrade to Premium",
  "Premium and Platinum users are visible on the map",
  "Global visibility · Priority matching",
  "Discover Premium and Platinum advantages",
  "Spend your earned tokens on boosts and premium features",
  "Accept escrow",
  "Requires escrow",
  "AI auto-fill",
  "AI will auto-fill",
  "AI analyzes compatibility",
  "Top 3 AI Picks",
  "Semantic AI",
  "AI-generated description",
  "secure chat",
  "secure moderated chat",
  "moderated, secure conversations",
  "Let AI find matches",
  "We respond within 24 hours",
  "We'll get back to you within 24 hours",
  "within 2-3 business days",
  "Please allow 2-3 business days",
];

const REQUIRED_SAFE_MARKERS = [
  "Paid production plans are not currently offered",
  "support@swaply.world",
  "not currently available",
  "Production availability is not implied",
];

const REQUIRED_LOCALE_GUARD_MARKERS = [
  "Production availability is not implied",
  "Not currently offered in Production",
];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadCanonicalLocales() {
  const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
  const configPath = path.join(scriptDirectory, "..", "src", "i18n", "config.ts");
  const source = readFileSync(configPath, "utf8");
  const localeBlock = source.match(/export const locales\s*=\s*\[([\s\S]*?)\]\s*as const;/);

  if (!localeBlock) {
    throw new Error("Could not read canonical locale list from src/i18n/config.ts");
  }

  const locales = [...localeBlock[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);

  if (locales.length !== EXPECTED_LOCALE_COUNT) {
    throw new Error(
      `Expected ${EXPECTED_LOCALE_COUNT} canonical locales, found ${locales.length}: ${locales.join(", ")}`,
    );
  }

  if (new Set(locales).size !== locales.length) {
    throw new Error("Canonical locale list contains duplicate locale identifiers");
  }

  return locales;
}

async function waitForServer(child) {
  const deadline = Date.now() + 30_000;
  let lastError;

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Next.js server exited early with code ${child.exitCode}`);
    }

    try {
      const response = await fetch(`${BASE_URL}/en/pricing`, {
        redirect: "manual",
      });
      if (response.status >= 200 && response.status < 500) return;
    } catch (error) {
      lastError = error;
    }

    await delay(500);
  }

  throw new Error(
    `Timed out waiting for Next.js server${lastError ? `: ${lastError}` : ""}`,
  );
}

async function fetchHtml(route) {
  const response = await fetch(`${BASE_URL}${route}`);
  if (!response.ok) {
    throw new Error(`${route} returned HTTP ${response.status}`);
  }
  return response.text();
}

function assertNoForbiddenMarkers(route, html) {
  const lowerHtml = html.toLocaleLowerCase("en-US");
  const matches = FORBIDDEN_MARKERS.filter((marker) =>
    lowerHtml.includes(marker.toLocaleLowerCase("en-US")),
  );

  if (matches.length > 0) {
    throw new Error(
      `${route} serialized forbidden public-truth marker(s): ${matches.join(", ")}`,
    );
  }
}

function assertRequiredMarkers(scope, html, markers) {
  const missing = markers.filter((marker) => !html.includes(marker));

  if (missing.length > 0) {
    throw new Error(
      `${scope} is missing expected evidence-safe marker(s): ${missing.join(", ")}`,
    );
  }
}

async function main() {
  const locales = loadCanonicalLocales();
  const localeRoutes = locales.map((locale) => `/${locale}`);
  const routes = [...new Set([...DETAIL_ROUTES, ...localeRoutes])];

  const child = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "start", "-p", String(PORT)],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NODE_ENV: "production",
        NEXT_TELEMETRY_DISABLED: "1",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => {
    stdout += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  try {
    await waitForServer(child);

    const rendered = new Map();
    for (const route of routes) {
      const html = await fetchHtml(route);
      assertNoForbiddenMarkers(route, html);
      rendered.set(route, html);
    }

    for (const locale of locales) {
      const route = `/${locale}`;
      const html = rendered.get(route);
      if (!html) {
        throw new Error(`Missing rendered payload for canonical locale ${locale}`);
      }
      assertRequiredMarkers(route, html, REQUIRED_LOCALE_GUARD_MARKERS);
    }

    const detailCombined = DETAIL_ROUTES.map((route) => rendered.get(route) ?? "").join("\n");
    assertRequiredMarkers("Rendered English public payload", detailCombined, REQUIRED_SAFE_MARKERS);

    console.log(
      `V1-11 public payload gate passed for ${locales.length}/${EXPECTED_LOCALE_COUNT} canonical locales, ${routes.length} rendered routes and ${FORBIDDEN_MARKERS.length} forbidden markers.`,
    );
  } catch (error) {
    if (stdout.trim()) console.error("--- next stdout ---\n" + stdout.trim());
    if (stderr.trim()) console.error("--- next stderr ---\n" + stderr.trim());
    throw error;
  } finally {
    if (child.exitCode === null) {
      child.kill("SIGTERM");
      await Promise.race([
        new Promise((resolve) => child.once("exit", resolve)),
        delay(5_000),
      ]);
      if (child.exitCode === null) child.kill("SIGKILL");
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
