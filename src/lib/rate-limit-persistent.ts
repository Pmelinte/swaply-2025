/**
 * Persistent rate limiter backed by Supabase.
 *
 * Uses the `rate_limit_entries` table with columns:
 *   - key         TEXT PRIMARY KEY
 *   - count       INTEGER
 *   - window_start TIMESTAMPTZ
 *
 * Falls back to the in-memory rateLimit when Supabase is unavailable.
 */

import { rateLimit } from "@/lib/rate-limit";
import { getSupabaseClient } from "@/lib/supabase/client";

interface RateLimitOptions {
  /** Maximum number of requests allowed within the window. Default: 20 */
  limit?: number;
  /** Window duration in milliseconds. Default: 60 000 (1 minute) */
  windowMs?: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

const TABLE = "rate_limit_entries";

/**
 * Check and update the rate limit for the given key (typically an IP address).
 *
 * Flow:
 * 1. Attempt to read / upsert the counter in the Supabase `rate_limit_entries` table.
 * 2. If Supabase is unavailable or the query fails, fall back to the in-memory limiter.
 */
export async function persistentRateLimit(
  ip: string,
  { limit = 20, windowMs = 60_000 }: RateLimitOptions = {},
): Promise<RateLimitResult> {
  const supabase = getSupabaseClient();

  // ── Fallback: no Supabase client available ──────────────────────────────
  if (!supabase) {
    return rateLimit(ip, { limit, windowMs });
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);

  try {
    // 1. Try to fetch the existing entry
    const { data: existing, error: fetchError } = await supabase
      .from(TABLE)
      .select("count, window_start")
      .eq("key", ip)
      .maybeSingle();

    if (fetchError) {
      console.error("[rate-limit-persistent] Supabase fetch error, using in-memory fallback:", fetchError.message);
      return rateLimit(ip, { limit, windowMs });
    }

    // 2. Determine whether the existing window is still active
    const existingWindowStart = existing?.window_start
      ? new Date(existing.window_start)
      : null;

    const windowExpired =
      !existingWindowStart || existingWindowStart < windowStart;

    if (windowExpired) {
      // Reset: start a new window
      const { error: upsertError } = await supabase
        .from(TABLE)
        .upsert(
          { key: ip, count: 1, window_start: now.toISOString() },
          { onConflict: "key" },
        );

      if (upsertError) {
        console.error("[rate-limit-persistent] Supabase upsert error, using in-memory fallback:", upsertError.message);
        return rateLimit(ip, { limit, windowMs });
      }

      return { allowed: true, remaining: limit - 1 };
    }

    // 3. Window still active — increment the counter
    const newCount = (existing?.count ?? 0) + 1;

    const { error: updateError } = await supabase
      .from(TABLE)
      .update({ count: newCount })
      .eq("key", ip);

    if (updateError) {
      console.error("[rate-limit-persistent] Supabase update error, using in-memory fallback:", updateError.message);
      return rateLimit(ip, { limit, windowMs });
    }

    const remaining = Math.max(0, limit - newCount);
    return { allowed: newCount <= limit, remaining };
  } catch (error) {
    // Unexpected error — fall back to in-memory
    console.error("[rate-limit-persistent] Unexpected error, using in-memory fallback:", error);
    return rateLimit(ip, { limit, windowMs });
  }
}
