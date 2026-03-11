import { describe, it, expect } from "vitest";
import {
  getTokenPackage,
  pricePerToken,
  TOKEN_PACKAGES,
  getPlan,
  yearlyDiscount,
  SUBSCRIPTION_PLANS,
  generateReferralCode,
  referralLink,
  getStreakReward,
  computeStreak,
  isInsurable,
  validateGiftAmount,
  bundlePrice,
  BUNDLE_SIZE,
  BUNDLE_DISCOUNT_PERCENT,
  hasFeatureAccess,
  requiredTierForFeature,
  getActivePromotions,
  applyPromoDiscount,
  getTokenMultiplier,
  getSwapMilestones,
  getUnclaimedMilestoneBonus,
  getLoyaltyMilestones,
  computeDaysActive,
  getShopItemsByCategory,
  getTheme,
  computeBalance,
  canAfford,
} from "@/lib/monetization";

describe("Token Packages", () => {
  it("finds package by id", () => {
    const pkg = getTokenPackage("starter_100");
    expect(pkg).toBeDefined();
    expect(pkg!.tokens).toBe(100);
  });

  it("returns undefined for invalid id", () => {
    expect(getTokenPackage("nonexistent")).toBeUndefined();
  });

  it("calculates price per token", () => {
    const pkg = TOKEN_PACKAGES[0]; // starter_100: 2.99 / 100
    const ppt = pricePerToken(pkg);
    expect(ppt).toBeCloseTo(0.0299, 4);
  });

  it("better value for larger packages", () => {
    const starter = pricePerToken(TOKEN_PACKAGES[0]);
    const mega = pricePerToken(TOKEN_PACKAGES[3]);
    expect(mega).toBeLessThan(starter);
  });
});

describe("Subscription Plans", () => {
  it("finds plan by id", () => {
    const plan = getPlan("premium");
    expect(plan).toBeDefined();
    expect(plan!.name).toBe("Premium");
  });

  it("returns undefined for invalid id", () => {
    expect(getPlan("gold")).toBeUndefined();
  });

  it("calculates yearly discount", () => {
    const premium = SUBSCRIPTION_PLANS.find((p) => p.id === "premium")!;
    const discount = yearlyDiscount(premium);
    expect(discount).toBeGreaterThan(0);
    expect(discount).toBeLessThan(100);
  });

  it("returns 0 discount for free plan", () => {
    const free = SUBSCRIPTION_PLANS.find((p) => p.id === "free")!;
    expect(yearlyDiscount(free)).toBe(0);
  });
});

describe("Referral Program", () => {
  it("generates referral code from userId", () => {
    const code = generateReferralCode("user-abc-123-def");
    expect(code).toBe("SWAPLY-USER-A");
  });

  it("generates referral link", () => {
    const link = referralLink("SWAPLY-ABC123");
    expect(link).toContain("ref=SWAPLY-ABC123");
  });
});

describe("Daily Login Streak", () => {
  it("returns 2 tokens for day 1", () => {
    expect(getStreakReward(1)).toBe(2);
  });

  it("returns 5 tokens for day 3", () => {
    expect(getStreakReward(3)).toBe(5);
  });

  it("returns 15 tokens for day 7", () => {
    expect(getStreakReward(7)).toBe(15);
  });

  it("returns 30 tokens for day 14", () => {
    expect(getStreakReward(14)).toBe(30);
  });

  it("returns 100 tokens for day 30", () => {
    expect(getStreakReward(30)).toBe(100);
  });

  it("returns 5 tokens for days beyond 30", () => {
    expect(getStreakReward(45)).toBe(5);
    expect(getStreakReward(100)).toBe(5);
  });

  it("returns closest threshold reward for in-between days", () => {
    // Day 10 is between 7 (15) and 14 (30), should get 15
    expect(getStreakReward(10)).toBe(15);
  });

  it("computeStreak: same day login (todayClaimed = true)", () => {
    const today = new Date().toISOString();
    const result = computeStreak(today, 5);
    expect(result.todayClaimed).toBe(true);
    expect(result.currentStreak).toBe(5);
  });

  it("computeStreak: next day login (streak continues)", () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const result = computeStreak(yesterday, 5);
    expect(result.currentStreak).toBe(6);
    expect(result.todayClaimed).toBe(false);
  });

  it("computeStreak: streak broken after 2+ days", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const result = computeStreak(threeDaysAgo, 10);
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(10);
  });
});

describe("Swap Insurance", () => {
  it("allows insurance for large items", () => {
    expect(isInsurable("large")).toBe(true);
  });

  it("allows insurance for sentimental items", () => {
    expect(isInsurable("sentimental")).toBe(true);
  });

  it("does not insure small items", () => {
    expect(isInsurable("small")).toBe(false);
    expect(isInsurable("medium")).toBe(false);
  });

  it("does not insure undefined", () => {
    expect(isInsurable(undefined)).toBe(false);
  });
});

describe("Gift Tokens", () => {
  it("validates valid gift amount", () => {
    expect(validateGiftAmount(50, 100)).toBeNull();
  });

  it("rejects below minimum", () => {
    expect(validateGiftAmount(2, 100)).toContain("Minim");
  });

  it("rejects above maximum", () => {
    expect(validateGiftAmount(1500, 2000)).toContain("Maxim");
  });

  it("rejects insufficient balance", () => {
    expect(validateGiftAmount(50, 10)).toContain("insuficiente");
  });
});

describe("Bundle Boost", () => {
  it("applies 33% discount on bundle of 3", () => {
    const price = bundlePrice(10);
    const fullPrice = 10 * BUNDLE_SIZE;
    const expected = Math.round(fullPrice * (1 - BUNDLE_DISCOUNT_PERCENT / 100));
    expect(price).toBe(expected);
  });
});

describe("Premium Feature Access", () => {
  it("free users cannot access premium features", () => {
    expect(hasFeatureAccess("free", "extended_filters")).toBe(false);
    expect(hasFeatureAccess("free", "analytics")).toBe(false);
  });

  it("premium users can access premium features", () => {
    expect(hasFeatureAccess("premium", "extended_filters")).toBe(true);
    expect(hasFeatureAccess("premium", "ad_free")).toBe(true);
  });

  it("premium users cannot access platinum features", () => {
    expect(hasFeatureAccess("premium", "export_reports")).toBe(false);
    expect(hasFeatureAccess("premium", "auction_mode")).toBe(false);
  });

  it("platinum users can access everything", () => {
    expect(hasFeatureAccess("platinum", "extended_filters")).toBe(true);
    expect(hasFeatureAccess("platinum", "export_reports")).toBe(true);
    expect(hasFeatureAccess("platinum", "auction_mode")).toBe(true);
  });

  it("returns required tier for feature", () => {
    expect(requiredTierForFeature("analytics")).toBe("premium");
    expect(requiredTierForFeature("export_reports")).toBe("platinum");
  });
});

describe("Seasonal Promotions", () => {
  it("returns no active promotions outside date ranges", () => {
    const now = new Date("2026-01-15T12:00:00Z");
    const active = getActivePromotions(now);
    expect(active).toHaveLength(0);
  });

  it("returns active promotions within date range", () => {
    const springDate = new Date("2026-03-25T12:00:00Z");
    const active = getActivePromotions(springDate);
    expect(active.length).toBeGreaterThan(0);
    expect(active[0].active).toBe(true);
  });

  it("applies promo discount", () => {
    const promos = [{ type: "shop_discount" as const, discountPercent: 50, id: "t", name: "t", description: "t", startsAt: "", endsAt: "", active: true }];
    expect(applyPromoDiscount(100, promos)).toBe(50);
  });

  it("returns base cost when no discount promo", () => {
    expect(applyPromoDiscount(100, [])).toBe(100);
  });

  it("returns 1x multiplier when no promo", () => {
    expect(getTokenMultiplier([])).toBe(1);
  });

  it("returns correct multiplier from promo", () => {
    const promos = [{ type: "token_multiplier" as const, multiplier: 2, id: "t", name: "t", description: "t", startsAt: "", endsAt: "", active: true }];
    expect(getTokenMultiplier(promos)).toBe(2);
  });
});

describe("Swap Milestones", () => {
  it("marks milestones as achieved based on completed swaps", () => {
    const milestones = getSwapMilestones(10);
    expect(milestones.find((m) => m.swapCount === 1)!.achieved).toBe(true);
    expect(milestones.find((m) => m.swapCount === 5)!.achieved).toBe(true);
    expect(milestones.find((m) => m.swapCount === 10)!.achieved).toBe(true);
    expect(milestones.find((m) => m.swapCount === 25)!.achieved).toBe(false);
  });

  it("returns unclaimed milestone bonus", () => {
    const bonus = getUnclaimedMilestoneBonus(5, [1]);
    expect(bonus).toBeDefined();
    expect(bonus!.swapCount).toBe(5);
  });

  it("returns null when all milestones claimed", () => {
    const bonus = getUnclaimedMilestoneBonus(5, [1, 5]);
    expect(bonus).toBeNull();
  });
});

describe("Loyalty Milestones", () => {
  it("marks milestones based on days active", () => {
    const milestones = getLoyaltyMilestones(30);
    expect(milestones.find((m) => m.daysActive === 7)!.achieved).toBe(true);
    expect(milestones.find((m) => m.daysActive === 30)!.achieved).toBe(true);
    expect(milestones.find((m) => m.daysActive === 90)!.achieved).toBe(false);
  });

  it("computeDaysActive returns positive number", () => {
    const days = computeDaysActive(new Date(Date.now() - 10 * 86400000).toISOString());
    expect(days).toBeGreaterThanOrEqual(9);
    expect(days).toBeLessThanOrEqual(11);
  });
});

describe("Shop Items", () => {
  it("filters by category", () => {
    const boosts = getShopItemsByCategory("boost");
    expect(boosts.length).toBeGreaterThan(0);
    expect(boosts.every((i) => i.category === "boost")).toBe(true);
  });

  it("returns themes", () => {
    const themes = getShopItemsByCategory("theme");
    expect(themes.length).toBe(5);
  });

  it("getTheme finds by id", () => {
    const theme = getTheme("theme_ocean");
    expect(theme).toBeDefined();
    expect(theme!.name).toBe("Ocean");
  });

  it("getTheme returns undefined for invalid id", () => {
    expect(getTheme("theme_galaxy")).toBeUndefined();
  });
});

describe("Token Balance", () => {
  it("computes balance from ledger", () => {
    const ledger = [
      { id: "1", userId: "u", amount: 100, reason: "signup_bonus" as const, description: "", createdAt: "" },
      { id: "2", userId: "u", amount: -20, reason: "boost_spent" as const, description: "", createdAt: "" },
      { id: "3", userId: "u", amount: 50, reason: "monthly_grant" as const, description: "", createdAt: "" },
    ];
    expect(computeBalance(ledger)).toBe(130);
  });

  it("canAfford checks balance against cost", () => {
    const ledger = [
      { id: "1", userId: "u", amount: 50, reason: "signup_bonus" as const, description: "", createdAt: "" },
    ];
    expect(canAfford(ledger, 30)).toBe(true);
    expect(canAfford(ledger, 100)).toBe(false);
  });

  it("empty ledger = 0 balance", () => {
    expect(computeBalance([])).toBe(0);
    expect(canAfford([], 1)).toBe(false);
  });
});
