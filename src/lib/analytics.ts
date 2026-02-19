/**
 * Analytics event dispatch utility.
 * Batches events and flushes them periodically to avoid per-event overhead.
 * Supports Supabase storage and external analytics endpoints.
 */
import type { AnalyticsEvent } from "./types";
import { getSupabaseClient } from "./supabase/client";
import { logger } from "./logger";

const BATCH_SIZE = 20;
const FLUSH_INTERVAL_MS = 30_000; // 30 seconds
const MAX_BUFFER_SIZE = 200;

let buffer: AnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Track an analytics event. Events are buffered and flushed in batches.
 */
export function trackAnalyticsEvent(
  event: string,
  properties?: Record<string, string | number | boolean>,
  userId?: string,
): void {
  const entry: AnalyticsEvent = {
    event,
    properties: { ...properties, userId: userId ?? "anonymous" },
    timestamp: new Date().toISOString(),
  };

  buffer.push(entry);

  // Flush if buffer is full
  if (buffer.length >= BATCH_SIZE) {
    void flushEvents();
  }

  // Ensure periodic flush timer is running
  if (!flushTimer && typeof setInterval !== "undefined") {
    flushTimer = setInterval(() => void flushEvents(), FLUSH_INTERVAL_MS);
  }
}

/**
 * Flush buffered events to storage/external service.
 */
export async function flushEvents(): Promise<void> {
  if (buffer.length === 0) return;

  // Take current buffer and reset
  const events = buffer.splice(0, MAX_BUFFER_SIZE);

  try {
    // Try Supabase first
    const supabase = getSupabaseClient();
    if (supabase) {
      const rows = events.map((e) => ({
        event: e.event,
        properties: e.properties ?? {},
        timestamp: e.timestamp,
      }));

      // Use RPC or direct insert if analytics table exists
      const { error } = await supabase.from("analytics_events").insert(rows);
      if (error) {
        // Table may not exist yet — log and fallback
        logger.debug("Analytics flush to Supabase failed, using console fallback", {
          error: error.message,
          count: events.length,
        });
        logEventsToConsole(events);
      } else {
        logger.debug("Analytics events flushed to Supabase", { count: events.length });
      }
      return;
    }

    // External endpoint fallback
    const analyticsEndpoint = process.env.ANALYTICS_ENDPOINT;
    if (analyticsEndpoint) {
      const res = await fetch(analyticsEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events }),
      });
      if (!res.ok) {
        logger.warn("Analytics endpoint returned error", { status: res.status });
      }
      return;
    }

    // Console fallback
    logEventsToConsole(events);
  } catch (err) {
    logger.warn("Analytics flush failed", { error: String(err), count: events.length });
    // Re-add events to buffer for retry (up to max)
    if (buffer.length + events.length <= MAX_BUFFER_SIZE) {
      buffer.unshift(...events);
    }
  }
}

function logEventsToConsole(events: AnalyticsEvent[]): void {
  if (process.env.NODE_ENV === "development") {
    for (const e of events) {
      console.debug("[analytics]", e.event, e.properties ?? "");
    }
  }
}

/**
 * Get current buffer size (for testing/monitoring).
 */
export function getBufferSize(): number {
  return buffer.length;
}

/**
 * Cleanup: stop flush timer and drain buffer.
 */
export async function shutdownAnalytics(): Promise<void> {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
  await flushEvents();
}
