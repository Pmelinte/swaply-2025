import { describe, it, expect } from "vitest";
import {
  isFlagEnabled,
  normalizeFeatureFlagId,
  DEFAULT_FLAGS,
  invalidateFlagCache,
  flagCache,
  computeFunnelRates,
  defaultMetrics,
  computeMetricsFromState,
  type FeatureFlag,
} from "@/lib/feature-flags";

describe("isFlagEnabled", () => {
  it("returns true for enabled core flag at 100% rollout", () => {
    expect(isFlagEnabled(DEFAULT_FLAGS, "push_notifications")).toBe(true);
  });

  it("keeps provider-backed features fail-closed by default", () => {
    expect(isFlagEnabled(DEFAULT_FLAGS, "stripe_payments")).toBe(false);
    expect(isFlagEnabled(DEFAULT_FLAGS, "paypal_payments")).toBe(false);
    expect(isFlagEnabled(DEFAULT_FLAGS, "courier_integration")).toBe(false);
    expect(isFlagEnabled(DEFAULT_FLAGS, "swap_insurance")).toBe(false);
    expect(isFlagEnabled(DEFAULT_FLAGS, "travel_integrations")).toBe(false);
  });

  it("normalizes historical aliases to canonical database keys", () => {
    expect(normalizeFeatureFlagId("ads_display")).toBe("ads_banner");
    expect(normalizeFeatureFlagId("courier_shipping")).toBe("courier_integration");
    expect(normalizeFeatureFlagId("daily_streaks")).toBe("daily_streak");
    expect(normalizeFeatureFlagId("referrals")).toBe("referral_program");
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
      {
        id: "test_flag",
        name: "Test",
        description: "",
        enabled: true,
        category: "core",
        rolloutPercent: 50,
      },
    ];

    let enabledCount = 0;
    for (let index = 0; index < 100; index += 1) {
      if (isFlagEnabled(flags, "test_flag", `user-${index}`)) enabledCount += 1;
    }

    expect(enabledCount).toBeGreaterThan(20);
    expect(enabledCount).toBeLessThan(80);
  });

  it("returns false for partial rollout without userId", () => {
    const flags: FeatureFlag[] = [
      {
        id: "test_flag",
        name: "Test",
        description: "",
        enabled: true,
        category: "core",
        rolloutPercent: 50,
      },
    ];
    expect(isFlagEnabled(flags, "test_flag")).toBe(false);
  });

  it("returns a consistent result for the same userId", () => {
    const flags: FeatureFlag[] = [
      {
        id: "test_flag",
        name: "Test",
        description: "",
        enabled: true,
        category: "core",
        rolloutPercent: 50,
      },
    ];
    expect(isFlagEnabled(flags, "test_flag", "user-42")).toBe(
      isFlagEnabled(flags, "test_flag", "user-42"),
    );
  });
});

describe("invalidateFlagCache", () => {
  it("resets cache metadata and restores safe defaults", () => {
    flagCache.fetchedAt = Date.now();
    flagCache.promise = Promise.resolve([]);
    flagCache.flags = [];

    invalidateFlagCache();

    expect(flagCache.fetchedAt).toBe(0);
    expect(flagCache.promise).toBeNull();
    expect(flagCache.flags).toEqual(DEFAULT_FLAGS);
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
    const metrics = defaultMetrics();
    expect(metrics.visitors).toBe(0);
    expect(metrics.signups).toBe(0);
    expect(metrics.swapCompleted).toBe(0);
  });
});

describe("computeMetricsFromState", () => {
  it("estimates visitors as 3x signups", () => {
    const metrics = computeMetricsFromState({
      totalUsers: 100,
      usersWithItems: 60,
      usersWithChats: 40,
      usersWithSwaps: 20,
      completedSwaps: 15,
    });
    expect(metrics.visitors).toBe(300);
    expect(metrics.signups).toBe(100);
    expect(metrics.itemsListed).toBe(60);
    expect(metrics.swapCompleted).toBe(15);
  });
});
