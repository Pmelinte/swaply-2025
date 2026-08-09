import { spawn } from "node:child_process";

const PORT = 3210;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const ROUTES = [
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
  "moderated, secure conversations",
  "We respond within 24 hours",
  "within 2-3 business days",
];

const REQUIRED_SAFE_MARKERS = [
  "Paid production plans are not currently offered",
  "support@swaply.world",
  "not currently available",
  "Production availability is not implied",
];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

async function main() {
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
    for (const route of ROUTES) {
      const html = await fetchHtml(route);
      assertNoForbiddenMarkers(route, html);
      rendered.set(route, html);
    }

    const combined = [...rendered.values()].join("\n");
    const missingSafeMarkers = REQUIRED_SAFE_MARKERS.filter(
      (marker) => !combined.includes(marker),
    );

    if (missingSafeMarkers.length > 0) {
      throw new Error(
        `Rendered public payload is missing expected evidence-safe marker(s): ${missingSafeMarkers.join(", ")}`,
      );
    }

    console.log(
      `V1-11 public payload gate passed for ${ROUTES.length} rendered routes and ${FORBIDDEN_MARKERS.length} forbidden markers.`,
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
