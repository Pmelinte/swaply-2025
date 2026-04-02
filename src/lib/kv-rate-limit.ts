/**
 * Rate limiter backed by Vercel KV (Redis).
 * Uses a sliding window counter per key with automatic expiry.
 * Falls back to the in-memory rateLimit when KV is unavailable.
 */

import { kv } from "@vercel/kv";
import { rateLimit as inMemoryRateLimit } from "@/lib/rate-limit";

interface RateLimitOptions {
  /** Maximum requests allowed within the window. Default: 20 */
  limit?: number;
  /** Window duration in seconds. Default: 60 */
  windowSeconds?: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
}

/**
 * Check and update the rate limit for the given identifier.
 *
 * @param identifier - Unique key (e.g. "push-notify:user-123" or "translate:1.2.3.4")
 * @param options - Limit and window configuration
 */
export async function kvRateLimit(
  identifier: string,
  { limit = 20, windowSeconds = 60 }: RateLimitOptions = {},
): Promise<RateLimitResult> {
  try {
    const key = `rl:${identifier}`;

    // Increment the counter; if key doesn't exist, INCR creates it with value 1
    const count = await kv.incr(key);

    // Set expiry only on first request in the window (count === 1)
    if (count === 1) {
      await kv.expire(key, windowSeconds);
    }

    const remaining = Math.max(0, limit - count);
    return { success: count <= limit, remaining };
  } catch (err) {
    // KV unavailable (local dev, misconfigured, etc.) — fall back to in-memory
    console.warn("[kv-rate-limit] KV unavailable, using in-memory fallback:", (err as Error).message);
    const { allowed, remaining } = inMemoryRateLimit(identifier, {
      limit,
      windowMs: windowSeconds * 1000,
    });
    return { success: allowed, remaining };
  }
}

/**
 * Helper: extract client IP from request headers.
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Helper: build a 429 response with Retry-After header.
 */
export function tooManyRequests(retryAfterSeconds = 60): Response {
  return Response.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
    },
  );
}
