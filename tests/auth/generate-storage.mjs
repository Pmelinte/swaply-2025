#!/usr/bin/env node
/**
 * Generates playwright/.auth/storage.json with a fresh Supabase session.
 * Uses the Supabase Auth REST API directly — no browser required.
 *
 * Run manually: node tests/auth/generate-storage.mjs
 * Called by: .github/workflows/playwright-audit.yml (Login step)
 */

import { writeFileSync, mkdirSync, rmSync } from "fs";
import path from "path";

const BASE_URL =
  process.env.BASE_URL ||
  process.env.PLAYWRIGHT_BASE_URL ||
  "https://www.swaply.world";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";

// Fall back to the known test-account credentials if secrets are not configured.
const EMAIL =
  process.env.PLAYWRIGHT_TEST_EMAIL || "alexandru.stoica516@gmail.com";
const PASSWORD =
  process.env.PLAYWRIGHT_TEST_PASSWORD || "Swaply2026!";

const AUTH_FILE = "playwright/.auth/storage.json";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("[auth] SUPABASE_URL or SUPABASE_ANON_KEY not set — aborting.");
  process.exit(1);
}

// Always start fresh — never reuse an expired token.
rmSync(AUTH_FILE, { force: true });
mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

console.log(`[auth] Logging in as ${EMAIL} …`);

const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 10_000);

let session;
try {
  const res = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
      signal: controller.signal,
    },
  );
  clearTimeout(timer);

  if (!res.ok) {
    console.error(`[auth] Supabase login failed: HTTP ${res.status}`);
    const text = await res.text().catch(() => "");
    if (text) console.error(text);
    process.exit(1);
  }

  session = await res.json();
} catch (err) {
  clearTimeout(timer);
  console.error(`[auth] Request error: ${err.message}`);
  process.exit(1);
}

if (!session.access_token) {
  console.error("[auth] No access_token in Supabase response.");
  process.exit(1);
}

// Derive the localStorage key Supabase uses in the browser.
const projectRef =
  SUPABASE_URL.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1] ?? "";
const storageKey = projectRef ? `sb-${projectRef}-auth-token` : "sb-auth-token";

// Build Playwright storage-state format directly — no browser needed.
const storageState = {
  cookies: [],
  origins: [
    {
      origin: BASE_URL,
      localStorage: [
        { name: storageKey, value: JSON.stringify(session) },
      ],
    },
  ],
};

writeFileSync(AUTH_FILE, JSON.stringify(storageState, null, 2));
console.log(`[auth] Storage state saved → ${AUTH_FILE}`);
console.log(
  `[auth] Token expires in ${Math.round((session.expires_in ?? 3600) / 60)} min`,
);
