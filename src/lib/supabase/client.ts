import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeObjectWizardItemInsert } from "@/lib/items/normalize-object-wizard-insert";
import { canTransitionSwap, isSwapStatus } from "@/lib/swaps/lifecycle";

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

function requestHeaders(
  input: Parameters<typeof fetch>[0],
  init?: Parameters<typeof fetch>[1],
): Headers {
  const headers = new Headers(
    typeof Request !== "undefined" && input instanceof Request
      ? input.headers
      : undefined,
  );
  new Headers(init?.headers).forEach((value, key) => {
    headers.set(key, value);
  });
  return headers;
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

function parseObjectBody(
  body: BodyInit | null | undefined,
): Record<string, unknown> | null {
  if (typeof body !== "string") return null;
  try {
    const value: unknown = JSON.parse(body);
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return null;
    }
    return value as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isSwapsStatusPatchRequest(
  input: Parameters<typeof fetch>[0],
  init?: Parameters<typeof fetch>[1],
): boolean {
  if (requestMethod(input, init) !== "PATCH") return false;
  const body = parseObjectBody(init?.body);
  if (!body || !("status" in body)) return false;

  try {
    return new URL(requestUrl(input)).pathname.endsWith("/rest/v1/swaps");
  } catch {
    return false;
  }
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ message, code: "SWAP_STATUS_AUTHORITY" }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function routeLegacySwapStatusPatch(
  input: Parameters<typeof fetch>[0],
  init?: Parameters<typeof fetch>[1],
): Promise<Response> {
  const body = parseObjectBody(init?.body);
  if (!body || !isSwapStatus(body.status)) {
    return jsonError("Invalid global swap status", 400);
  }

  const request = new URL(requestUrl(input));
  const idFilter = request.searchParams.get("id");
  const swapId = idFilter?.startsWith("eq.") ? idFilter.slice(3) : null;
  if (!swapId) {
    return jsonError("A single swap id is required for status changes", 400);
  }

  const headers = requestHeaders(input, init);
  const authorization = headers.get("authorization");
  if (!authorization) {
    return jsonError("Authentication required", 401);
  }

  const statusRequest = new URL(request);
  statusRequest.searchParams.set("select", "status");
  const statusResponse = await globalThis.fetch(statusRequest, {
    method: "GET",
    headers,
  });
  if (!statusResponse.ok) return statusResponse;

  const rows = (await statusResponse.json().catch(() => [])) as Array<{
    status?: unknown;
  }>;
  const currentStatus = rows[0]?.status;
  if (!isSwapStatus(currentStatus)) {
    return jsonError("Swap not found or has an unsupported status", 404);
  }

  if (currentStatus === body.status) {
    return new Response(null, { status: 204 });
  }
  if (!canTransitionSwap(currentStatus, body.status)) {
    return jsonError(
      `Invalid transition: ${currentStatus} → ${body.status}`,
      409,
    );
  }

  const transitionResponse = await globalThis.fetch("/api/swaps/transition", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authorization,
    },
    body: JSON.stringify({
      swapId,
      expectedStatus: currentStatus,
      toStatus: body.status,
    }),
  });

  if (!transitionResponse.ok) {
    return new Response(await transitionResponse.text(), {
      status: transitionResponse.status,
      headers: {
        "Content-Type":
          transitionResponse.headers.get("content-type") ??
          "application/json",
      },
    });
  }

  const remainingBody = { ...body };
  delete remainingBody.status;
  if (Object.keys(remainingBody).length === 0) {
    return new Response(null, { status: 204 });
  }

  return globalThis.fetch(input, {
    ...init,
    body: JSON.stringify(remainingBody),
  });
}

const fetchWithCompatibilityGuards: typeof fetch = async (input, init) => {
  if (isSwapsStatusPatchRequest(input, init)) {
    return routeLegacySwapStatusPatch(input, init);
  }

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
      fetch: fetchWithCompatibilityGuards,
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
