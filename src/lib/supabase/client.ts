import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeObjectWizardItemInsert } from "@/lib/items/normalize-object-wizard-insert";

let cachedClient: SupabaseClient | null = null;

function requestUrl(input: Parameters<typeof fetch>[0]): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function requestMethod(
  input: Parameters<typeof fetch>[0],
  init?: Parameters<typeof fetch>[1],
): string {
  if (init?.method) return init.method.toUpperCase();
  if (typeof Request !== "undefined" && input instanceof Request) {
    return input.method.toUpperCase();
  }
  return "GET";
}

function isItemsPostRequest(
  input: Parameters<typeof fetch>[0],
  init?: Parameters<typeof fetch>[1],
): boolean {
  if (requestMethod(input, init) !== "POST") return false;

  try {
    return new URL(requestUrl(input)).pathname.endsWith("/rest/v1/items");
  } catch {
    return false;
  }
}

function normalizeItemsRequestBody(
  body: BodyInit | null | undefined,
): BodyInit | null | undefined {
  if (typeof body !== "string") return body;

  try {
    const parsed: unknown = JSON.parse(body);

    if (Array.isArray(parsed)) {
      let changed = false;
      const normalized = parsed.map((row) => {
        const next = normalizeObjectWizardItemInsert(row);
        if (next !== row) changed = true;
        return next;
      });

      return changed ? JSON.stringify(normalized) : body;
    }

    const normalized = normalizeObjectWizardItemInsert(parsed);
    return normalized === parsed ? body : JSON.stringify(normalized);
  } catch {
    return body;
  }
}

const fetchWithObjectWizardCompatibility: typeof fetch = (input, init) => {
  if (!isItemsPostRequest(input, init)) {
    return globalThis.fetch(input, init);
  }

  const normalizedBody = normalizeItemsRequestBody(init?.body);
  if (normalizedBody === init?.body) {
    return globalThis.fetch(input, init);
  }

  return globalThis.fetch(input, {
    ...init,
    body: normalizedBody,
  });
};

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  cachedClient = createBrowserClient(url, key, {
    global: {
      fetch: fetchWithObjectWizardCompatibility,
    },
  });
  return cachedClient;
}

/**
 * Discard the cached Supabase client so the next getSupabaseClient()
 * call creates a fresh instance. This is critical after sign-out to
 * avoid Navigator Locks deadlocks that can permanently block auth.
 */
export function resetSupabaseClient(): void {
  cachedClient = null;
}
