import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isFlagEnabled,
  DEFAULT_FLAGS,
  invalidateFlagCache,
  flagCache,
  computeFunnelRates,
  defaultMetrics,
  computeMetricsFromState,
  type FeatureFlag,
} from "@/lib/feature-flags";

describe("isFlagEnabled", () => {
  it("returns true for enabled flag at 100% rollout", () => {
    expect(isFlagEnabled(DEFAULT_FLAGS, "push_notifications")).toBe(true);
  });

  it("returns false for disabled flag", () => {
    expect(isFlagEnabled(DEFAULT_FLAGS, "auctions")).toBe(false);
  });

  it("returns false for non-existent flag", () => {
    expect(isFlagEnabled(DEFAULT_FLAGS, "nonexistent_flag")).toBe(false);
  });

  it("returns false for 0% rollout", () => {
    expect(isFlagEnabled(DEFAULT_FLAGS, "video_calls")).toBe(false);
  });

  it("respects rollout percent based on user ID hash", () => {
    const flags: FeatureFlag[] = [
      { id: "test_flag", name: "Test", description: "", enabled: true, category: "core", rolloutPercent: 50 },
    ];

    // With many user IDs, some should be enabled and some not
    let enabledCount = 0;
    for (let i = 0; i < 100; i++) {
      if (isFlagEnabled(flags, "test_flag", `user-${i}`)) enabledCount++;
    }
    // Should be roughly 50%, allow some variance
    expect(enabledCount).toBeGreaterThan(20);
    expect(enabledCount).toBeLessThan(80);
  });

  it("returns false for partial rollout without userId", () => {
    const flags: FeatureFlag[] = [
      { id: "test_flag", name: "Test", description: "", enabled: true, category: "core", rolloutPercent: 50 },
    ];
    expect(isFlagEnabled(flags, "test_flag")).toBe(false);
  });

  it("returns consistent result for same userId", () => {
    const flags: FeatureFlag[] = [
      { id: "test_flag", name: "Test", description: "", enabled: true, category: "core", rolloutPercent: 50 },
    ];
    const result1 = isFlagEnabled(flags, "test_flag", "user-42");
    const result2 = isFlagEnabled(flags, "test_flag", "user-42");
    expect(result1).toBe(result2);
  });
});

describe("invalidateFlagCache", () => {
  it("resets fetchedAt to 0", () => {
    flagCache.fetchedAt = Date.now();
    invalidateFlagCache();
    expect(flagCache.fetchedAt).toBe(0);
  });

  it("resets promise to null", () => {
    flagCache.promise = Promise.resolve(DEFAULT_FLAGS);
    invalidateFlagCache();
    expect(flagCache.promise).toBeNull();
  });
});

describe("computeFunnelRates", () => {
  it("computes rates from funnel metrics", () => {
    const rates = computeFunnelRates({
      visitors: 1000,
      signups: 200,
      itemsListed: 100,
      chatStarted: 50,
      swapProposed: 25,
      swapCompleted: 10,
      retention7d: 60,
      retention30d: 30,
    });
    expect(rates.visitToSignup).toBe(20);
    expect(rates.signupToList).toBe(50);
    expect(rates.listToChat).toBe(50);
    expect(rates.chatToPropose).toBe(50);
    expect(rates.proposeToComplete).toBe(40);
    expect(rates.overallConversion).toBe(1);
  });

  it("handles zero visitors safely", () => {
    const rates = computeFunnelRates(defaultMetrics());
    expect(rates.visitToSignup).toBe(0);
    expect(rates.overallConversion).toBe(0);
  });
});

describe("defaultMetrics", () => {
  it("returns all zeroed metrics", () => {
    const m = defaultMetrics();
    expect(m.visitors).toBe(0);
    expect(m.signups).toBe(0);
    expect(m.swapCompleted).toBe(0);
  });
});

describe("computeMetricsFromState", () => {
  it("estimates visitors as 3x signups", () => {
    const m = computeMetricsFromState({
      totalUsers: 100,
      usersWithItems: 60,
      usersWithChats: 40,
      usersWithSwaps: 20,
      completedSwaps: 15,
    });
    expect(m.visitors).toBe(300);
    expect(m.signups).toBe(100);
    expect(m.itemsListed).toBe(60);
    expect(m.swapCompleted).toBe(15);
  });
});
