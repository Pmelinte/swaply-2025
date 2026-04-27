import { test } from "@playwright/test";
import path from "path";
import { promises as fsp } from "fs";

export const AUTH_FILE = path.join(
  process.cwd(),
  "playwright",
  ".auth",
  "storage.json",
);

const BASE_URL =
  process.env.BASE_URL ||
  process.env.PLAYWRIGHT_BASE_URL ||
  "https://www.swaply.world";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "";
const EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL ?? "";
const PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD ?? "";

const EMPTY_STATE = JSON.stringify({ cookies: [], origins: [] });

test("login – generate playwright/.auth/storage.json", async ({
  page,
  context,
}) => {
  // Always delete stale state first — never reuse a cached token
  await fsp.rm(AUTH_FILE, { force: true });
  await fsp.mkdir(path.dirname(AUTH_FILE), { recursive: true });

  if (!EMAIL || !PASSWORD || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn(
      "[auth/setup] Missing credentials — saving empty storage state.",
    );
    await fsp.writeFile(AUTH_FILE, EMPTY_STATE);
    return;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);

  let session: Record<string, unknown>;
  try {
    const response = await fetch(
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

    if (!response.ok) {
      console.warn(
        `[auth/setup] Supabase login failed: HTTP ${response.status}`,
      );
      await fsp.writeFile(AUTH_FILE, EMPTY_STATE);
      return;
    }

    session = (await response.json()) as Record<string, unknown>;
  } catch (err) {
    clearTimeout(timer);
    console.warn(
      `[auth/setup] Supabase login error: ${(err as Error).message}`,
    );
    await fsp.writeFile(AUTH_FILE, EMPTY_STATE);
    return;
  }

  if (!session.access_token) {
    console.warn("[auth/setup] No access_token in response.");
    await fsp.writeFile(AUTH_FILE, EMPTY_STATE);
    return;
  }

  const projectRef =
    SUPABASE_URL.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1] ?? "";
  const storageKey = projectRef
    ? `sb-${projectRef}-auth-token`
    : "sb-auth-token";

  await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 20_000 });
  await page.evaluate(
    ({ key, value }: { key: string; value: string }) => {
      localStorage.setItem(key, value);
    },
    { key: storageKey, value: JSON.stringify(session) },
  );
  await page.reload({ waitUntil: "domcontentloaded" });
  await context.storageState({ path: AUTH_FILE });

  console.log(`[auth/setup] Storage state saved → ${AUTH_FILE}`);
});
