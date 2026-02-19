import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// We need to reimport for each test to get clean state
// But the store is module-level, so we test the exported function
describe("rateLimit", () => {
  // Import fresh for tests — the module has a setInterval side effect
  // so we handle it carefully
  let rateLimit: typeof import("@/lib/rate-limit").rateLimit;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.resetModules();
    const mod = await import("@/lib/rate-limit");
    rateLimit = mod.rateLimit;
  });

  it("allows first request", () => {
    const result = rateLimit("1.2.3.4");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(19); // default limit = 20
  });

  it("allows requests within limit", () => {
    for (let i = 0; i < 20; i++) {
      const result = rateLimit("2.3.4.5");
      expect(result.allowed).toBe(true);
    }
  });

  it("blocks requests over limit", () => {
    for (let i = 0; i < 20; i++) {
      rateLimit("3.4.5.6");
    }
    const result = rateLimit("3.4.5.6");
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("tracks remaining count correctly", () => {
    const r1 = rateLimit("4.5.6.7");
    expect(r1.remaining).toBe(19);
    const r2 = rateLimit("4.5.6.7");
    expect(r2.remaining).toBe(18);
  });

  it("uses separate counters per IP", () => {
    for (let i = 0; i < 20; i++) {
      rateLimit("5.5.5.5");
    }
    // Different IP should still be allowed
    const result = rateLimit("6.6.6.6");
    expect(result.allowed).toBe(true);
  });

  it("resets after window expires", () => {
    for (let i = 0; i < 20; i++) {
      rateLimit("7.7.7.7");
    }
    expect(rateLimit("7.7.7.7").allowed).toBe(false);

    // Advance past window
    vi.advanceTimersByTime(61_000);

    const result = rateLimit("7.7.7.7");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(19);
  });

  it("respects custom limit", () => {
    for (let i = 0; i < 5; i++) {
      rateLimit("8.8.8.8", { limit: 5 });
    }
    expect(rateLimit("8.8.8.8", { limit: 5 }).allowed).toBe(false);
  });

  it("respects custom window", () => {
    for (let i = 0; i < 20; i++) {
      rateLimit("9.9.9.9", { windowMs: 5000 });
    }
    expect(rateLimit("9.9.9.9", { windowMs: 5000 }).allowed).toBe(false);

    vi.advanceTimersByTime(5001);
    expect(rateLimit("9.9.9.9", { windowMs: 5000 }).allowed).toBe(true);
  });

  afterEach(() => {
    vi.useRealTimers();
  });
});
