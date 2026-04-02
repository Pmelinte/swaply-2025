import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @vercel/kv before importing the module
vi.mock("@vercel/kv", () => {
  const store = new Map<string, number>();
  return {
    kv: {
      incr: vi.fn(async (key: string) => {
        const val = (store.get(key) ?? 0) + 1;
        store.set(key, val);
        return val;
      }),
      expire: vi.fn(async () => true),
      _store: store, // exposed for test reset
    },
  };
});

import { kvRateLimit, getClientIp, tooManyRequests } from "@/lib/kv-rate-limit";
import { kv } from "@vercel/kv";

beforeEach(() => {
  vi.clearAllMocks();
  (kv as unknown as { _store: Map<string, number> })._store.clear();
});

describe("kvRateLimit", () => {
  it("allows requests under the limit", async () => {
    const result = await kvRateLimit("test-user", { limit: 5, windowSeconds: 60 });
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("decrements remaining on each call", async () => {
    await kvRateLimit("user-a", { limit: 3, windowSeconds: 60 });
    const r2 = await kvRateLimit("user-a", { limit: 3, windowSeconds: 60 });
    expect(r2.remaining).toBe(1);

    const r3 = await kvRateLimit("user-a", { limit: 3, windowSeconds: 60 });
    expect(r3.remaining).toBe(0);
    expect(r3.success).toBe(true);
  });

  it("blocks when limit is exceeded", async () => {
    for (let i = 0; i < 3; i++) {
      await kvRateLimit("user-b", { limit: 3, windowSeconds: 60 });
    }
    const blocked = await kvRateLimit("user-b", { limit: 3, windowSeconds: 60 });
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("sets expiry only on first request", async () => {
    await kvRateLimit("user-c", { limit: 5, windowSeconds: 30 });
    expect(kv.expire).toHaveBeenCalledWith("rl:user-c", 30);

    await kvRateLimit("user-c", { limit: 5, windowSeconds: 30 });
    // expire should only be called once (for count === 1)
    expect(kv.expire).toHaveBeenCalledTimes(1);
  });

  it("tracks different identifiers independently", async () => {
    for (let i = 0; i < 3; i++) {
      await kvRateLimit("user-x", { limit: 3, windowSeconds: 60 });
    }
    // user-x is at limit
    const blockedX = await kvRateLimit("user-x", { limit: 3, windowSeconds: 60 });
    expect(blockedX.success).toBe(false);

    // user-y should still be fine
    const allowedY = await kvRateLimit("user-y", { limit: 3, windowSeconds: 60 });
    expect(allowedY.success).toBe(true);
  });

  it("falls back to in-memory when KV throws", async () => {
    (kv.incr as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("KV down"));
    const result = await kvRateLimit("fallback-user", { limit: 10, windowSeconds: 60 });
    // Should succeed via in-memory fallback
    expect(result.success).toBe(true);
  });
});

describe("getClientIp", () => {
  it("extracts IP from x-forwarded-for", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("extracts IP from x-real-ip", () => {
    const req = new Request("http://localhost", {
      headers: { "x-real-ip": "10.0.0.1" },
    });
    expect(getClientIp(req)).toBe("10.0.0.1");
  });

  it("returns unknown when no IP headers", () => {
    const req = new Request("http://localhost");
    expect(getClientIp(req)).toBe("unknown");
  });
});

describe("tooManyRequests", () => {
  it("returns 429 status", () => {
    const res = tooManyRequests();
    expect(res.status).toBe(429);
  });

  it("includes Retry-After header", () => {
    const res = tooManyRequests(30);
    expect(res.headers.get("Retry-After")).toBe("30");
  });

  it("defaults to 60 seconds Retry-After", () => {
    const res = tooManyRequests();
    expect(res.headers.get("Retry-After")).toBe("60");
  });
});
