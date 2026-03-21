"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { nanoid } from "nanoid";
import type {
  Achievement,
  AchievementId,
  Item,
  ShopItem,
  SwapIntent,
  TokenLedgerEntry,
  TokenShopItem,
  UserProfile,
} from "../types";
import type {
  FeaturedListing,
  LoginStreak,
  Referral,
  UserSubscription,
} from "../types";
import type { PremiumFeature } from "../monetization";
import {
  ALL_SHOP_ITEMS,
  applyPromoDiscount,
  computeBalance,
  computeStreak,
  generateReferralCode,
  getActivePromotions,
  getStreakReward,
  getSwapMilestones,
  getTokenMultiplier,
  getUnclaimedMilestoneBonus,
  getLoyaltyMilestones,
  computeDaysActive,
  INSURANCE_COST,
  FEATURED_COST,
  FEATURED_DURATION_HOURS,
  VERIFIED_BADGE_COST,
  BUSINESS_UPGRADE_COST,
  validateGiftAmount,
  hasFeatureAccess,
  PROFILE_THEMES,
  LOYALTY_MILESTONES,
} from "../monetization";
import { showTokenToast } from "@/components/tokens/TokenToast";

interface MonetizationDeps {
  user: UserProfile | null;
  items: Item[];
  swaps: SwapIntent[];
  trackEvent: (event: string, properties?: Record<string, string | number | boolean>) => void;
}

export function useMonetization(deps: MonetizationDeps) {
  const { user, items, swaps, trackEvent } = deps;

  // ── Token Ledger ──
  const [tokenLedger, setTokenLedger] = useState<TokenLedgerEntry[]>(() => {
    if (!user) return [];
    return [{ id: nanoid(), userId: user?.id ?? "", amount: 10, reason: "signup_bonus" as const,
      description: "Welcome bonus", createdAt: new Date().toISOString() }];
  });

  const tokenBalance = useMemo(() => computeBalance(tokenLedger), [tokenLedger]);

  // ── Login Streak ──
  const [loginStreak, setLoginStreak] = useState<LoginStreak>({
    currentStreak: 1, longestStreak: 1, lastLoginDate: new Date().toISOString(),
    todayClaimed: false, nextReward: 2,
  });

  useEffect(() => {
    if (user) {
      setLoginStreak((prev) => computeStreak(prev.lastLoginDate, prev.currentStreak));
    }
  }, [user?.id]);

  const claimDailyReward = useCallback(async () => {
    if (!user) return { error: "Not logged in" };
    if (loginStreak.todayClaimed) return { error: "Deja revendicat azi" };
    const reward = getStreakReward(loginStreak.currentStreak);
    const promos = getActivePromotions();
    const multiplier = getTokenMultiplier(promos);
    const finalReward = reward * multiplier;
    setTokenLedger((prev) => [...prev, {
      id: nanoid(), userId: user.id, amount: finalReward,
      reason: "daily_streak" as const,
      description: `Streak zi ${loginStreak.currentStreak}${multiplier > 1 ? ` (×${multiplier} promo)` : ""}`,
      createdAt: new Date().toISOString(),
    }]);
    setLoginStreak((prev) => ({ ...prev, todayClaimed: true, nextReward: getStreakReward(prev.currentStreak + 1) }));
    showTokenToast(finalReward, "daily_streak");
    trackEvent("daily_streak_claimed", { day: loginStreak.currentStreak, tokens: finalReward });
    return { tokens: finalReward };
  }, [user, loginStreak, trackEvent]);

  // ── Referrals ──
  const referralCode = useMemo(() => user ? generateReferralCode(user.id) : "", [user?.id]);
  const [referrals, setReferrals] = useState<Referral[]>([]);

  const sendReferralInvite = useCallback(async (email: string): Promise<{ error?: string }> => {
    if (!user) return { error: "Not logged in" };
    if (!email.includes("@")) return { error: "Email invalid" };
    setReferrals((prev) => [...prev, {
      id: nanoid(), referrerId: user.id, referredId: "", referredEmail: email,
      referralCode, status: "pending" as const, tokensEarned: 0,
      createdAt: new Date().toISOString(),
    }]);
    trackEvent("referral_sent", { email });
    return {};
  }, [user, referralCode, trackEvent]);

  // ── Gift Tokens ──
  const giftTokens = useCallback(async (recipientId: string, amount: number, message: string): Promise<{ error?: string }> => {
    if (!user) return { error: "Not logged in" };
    const err = validateGiftAmount(amount, tokenBalance);
    if (err) return { error: err };
    setTokenLedger((prev) => [
      ...prev,
      { id: nanoid(), userId: user.id, amount: -amount, reason: "gift_sent" as const, description: `Gift → ${recipientId}: ${message}`, createdAt: new Date().toISOString() },
      { id: nanoid(), userId: recipientId, amount, reason: "gift_received" as const, description: `Gift de la ${user.displayName}: ${message}`, createdAt: new Date().toISOString() },
    ]);
    trackEvent("tokens_gifted", { recipientId, amount });
    return {};
  }, [user, tokenBalance, trackEvent]);

  // ── Featured Listings ──
  const [featuredListings, setFeaturedListings] = useState<FeaturedListing[]>([]);

  const purchaseFeaturedSlot = useCallback(async (itemId: string): Promise<{ error?: string }> => {
    if (!user) return { error: "Not logged in" };
    if (tokenBalance < FEATURED_COST) return { error: "Fonduri insuficiente" };
    setTokenLedger((prev) => [...prev, {
      id: nanoid(), userId: user.id, amount: -FEATURED_COST,
      reason: "featured_spent" as const, description: `Featured: ${itemId}`,
      createdAt: new Date().toISOString(),
    }]);
    const expiresAt = new Date(Date.now() + FEATURED_DURATION_HOURS * 60 * 60 * 1000).toISOString();
    setFeaturedListings((prev) => [...prev, {
      id: nanoid(), itemId, userId: user.id, position: prev.length,
      expiresAt, createdAt: new Date().toISOString(),
    }]);
    trackEvent("featured_purchased", { itemId, cost: FEATURED_COST });
    return {};
  }, [user, tokenBalance, trackEvent]);

  // ── Insurance ──
  const purchaseInsurance = useCallback(async (swapId: string): Promise<{ error?: string }> => {
    if (!user) return { error: "Not logged in" };
    if (tokenBalance < INSURANCE_COST) return { error: "Fonduri insuficiente" };
    setTokenLedger((prev) => [...prev, {
      id: nanoid(), userId: user.id, amount: -INSURANCE_COST,
      reason: "insurance_spent" as const, description: `Insurance: ${swapId}`,
      createdAt: new Date().toISOString(),
    }]);
    trackEvent("insurance_purchased", { swapId, cost: INSURANCE_COST });
    return {};
  }, [user, tokenBalance, trackEvent]);

  // ── Verified Badge ──
  const [isVerified, setIsVerified] = useState(false);

  const purchaseVerifiedBadge = useCallback(async (): Promise<{ error?: string }> => {
    if (!user) return { error: "Not logged in" };
    if (isVerified) return { error: "Deja verificat" };
    if (tokenBalance < VERIFIED_BADGE_COST) return { error: "Fonduri insuficiente" };
    setTokenLedger((prev) => [...prev, {
      id: nanoid(), userId: user.id, amount: -VERIFIED_BADGE_COST,
      reason: "verified_spent" as const, description: "Verified badge",
      createdAt: new Date().toISOString(),
    }]);
    setIsVerified(true);
    trackEvent("verified_badge_purchased", { cost: VERIFIED_BADGE_COST });
    return {};
  }, [user, isVerified, tokenBalance, trackEvent]);

  // ── Themes ──
  const [purchasedThemes, setPurchasedThemes] = useState<string[]>([]);
  const [activeTheme, setActiveTheme] = useState<string | null>(null);

  const purchaseTheme = useCallback(async (themeId: string): Promise<{ error?: string }> => {
    if (!user) return { error: "Not logged in" };
    if (purchasedThemes.includes(themeId)) return { error: "Deja cumpărat" };
    const theme = PROFILE_THEMES.find((t) => t.id === themeId);
    if (!theme) return { error: "Tema inexistentă" };
    if (tokenBalance < theme.cost) return { error: "Fonduri insuficiente" };
    setTokenLedger((prev) => [...prev, {
      id: nanoid(), userId: user.id, amount: -theme.cost,
      reason: "theme_spent" as const, description: `Theme: ${theme.name}`,
      createdAt: new Date().toISOString(),
    }]);
    setPurchasedThemes((prev) => [...prev, themeId]);
    setActiveTheme(themeId);
    trackEvent("theme_purchased", { themeId, cost: theme.cost });
    return {};
  }, [user, purchasedThemes, tokenBalance, trackEvent]);

  const activateTheme = useCallback((themeId: string) => {
    if (purchasedThemes.includes(themeId) || !themeId) setActiveTheme(themeId || null);
  }, [purchasedThemes]);

  // ── Business ──
  const [isBusiness, setIsBusiness] = useState(false);

  const purchaseBusinessUpgrade = useCallback(async (companyName: string): Promise<{ error?: string }> => {
    if (!user) return { error: "Not logged in" };
    if (isBusiness) return { error: "Deja business" };
    if (tokenBalance < BUSINESS_UPGRADE_COST) return { error: "Fonduri insuficiente" };
    setTokenLedger((prev) => [...prev, {
      id: nanoid(), userId: user.id, amount: -BUSINESS_UPGRADE_COST,
      reason: "business_upgrade" as const, description: `Business: ${companyName}`,
      createdAt: new Date().toISOString(),
    }]);
    setIsBusiness(true);
    trackEvent("business_upgrade", { companyName, cost: BUSINESS_UPGRADE_COST });
    return {};
  }, [user, isBusiness, tokenBalance, trackEvent]);

  // ── Subscription ──
  const [subscription] = useState<UserSubscription>({
    planId: (user?.badge ?? "free") as "free" | "premium" | "platinum",
    status: "active", currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    cancelAtPeriodEnd: false,
  });

  // ── Promotions ──
  const activePromotions = useMemo(() => getActivePromotions(), []);

  // ── Milestones ──
  const swapMilestones = useMemo(() =>
    getSwapMilestones(user?.stats.completedSwaps ?? 0),
    [user?.stats.completedSwaps],
  );

  useEffect(() => {
    if (!user) return;
    const milestone = getUnclaimedMilestoneBonus(user.stats.completedSwaps, []);
    if (milestone) {
      const promos = getActivePromotions();
      const multiplier = getTokenMultiplier(promos);
      setTokenLedger((prev) => [...prev, {
        id: nanoid(), userId: user.id, amount: milestone.bonusTokens * multiplier,
        reason: "milestone_bonus" as const,
        description: `Milestone: ${milestone.label}`,
        createdAt: new Date().toISOString(),
      }]);
      showTokenToast(milestone.bonusTokens * multiplier, "milestone_bonus");
      trackEvent("milestone_bonus", { swapCount: milestone.swapCount, tokens: milestone.bonusTokens * multiplier });
    }
  }, [user?.stats.completedSwaps]);

  const loyaltyMilestones = useMemo(() => {
    if (!user) return LOYALTY_MILESTONES;
    const days = computeDaysActive(user.stats.completedSwaps > 0 ? user.stats.completedSwaps.toString() : new Date().toISOString());
    return getLoyaltyMilestones(days);
  }, [user]);

  // ── Feature gating ──
  const hasFeature = useCallback((feature: PremiumFeature) => {
    return hasFeatureAccess(user?.badge ?? "free", feature);
  }, [user?.badge]);

  // ── Token grants on swap completion (batched) ──
  useEffect(() => {
    if (!user?.id) return;
    const completedSwaps = swaps.filter((s) => s.status === "completed");
    const grantedSwapIds = new Set(tokenLedger.filter((e) => e.reason === "swap_completed").map((e) => e.description));
    const newEntries: TokenLedgerEntry[] = [];
    for (const swap of completedSwaps) {
      if (!grantedSwapIds.has(swap.id)) {
        newEntries.push({
          id: nanoid(), userId: user.id, amount: 5, reason: "swap_completed" as const,
          description: swap.id, createdAt: new Date().toISOString(),
        });
        trackEvent("tokens_granted", { amount: 5, reason: "swap_completed", swapId: swap.id });
      }
    }
    if (newEntries.length > 0) {
      setTokenLedger((prev) => [...prev, ...newEntries]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swaps, user?.id]);

  // ── Achievements ──
  const achievements = useMemo<Achievement[]>(() => {
    if (!user) return [];
    const cs = user.stats.completedSwaps;
    const ti = items.filter((i) => i.ownerId === user.id).length;
    const defs: { id: AchievementId; title: string; icon: string; target: number; current: number; desc: string }[] = [
      { id: "first_swap", title: "First Swap", icon: "🔄", target: 1, current: cs, desc: "Complete your first swap" },
      { id: "five_swaps", title: "Swap Veteran", icon: "🏅", target: 5, current: cs, desc: "Complete 5 swaps" },
      { id: "ten_swaps", title: "Swap Master", icon: "🏆", target: 10, current: cs, desc: "Complete 10 swaps" },
      { id: "twenty_five_swaps", title: "Swap Legend", icon: "👑", target: 25, current: cs, desc: "Complete 25 swaps" },
      { id: "first_listing", title: "First Listing", icon: "📦", target: 1, current: ti, desc: "List your first item" },
      { id: "ten_listings", title: "Collector", icon: "🗄️", target: 10, current: ti, desc: "List 10 items" },
      { id: "eco_warrior", title: "Eco Warrior", icon: "🌿", target: 3, current: cs, desc: "Save the planet with 3 swaps" },
      { id: "house_swapper", title: "Home Exchange", icon: "🏠", target: 1, current: 0, desc: "Complete a house swap" },
      { id: "service_provider", title: "Service Star", icon: "⚡", target: 1, current: 0, desc: "Complete a service swap" },
      { id: "premium_member", title: "Premium", icon: "💎", target: 1, current: user.badge !== "free" ? 1 : 0, desc: "Upgrade to premium" },
      { id: "early_adopter", title: "Early Adopter", icon: "🚀", target: 1, current: 1, desc: "Join Swaply early" },
    ];
    return defs.map((d) => ({
      id: d.id, title: d.title, description: d.desc, icon: d.icon,
      progress: Math.min(100, Math.round((d.current / d.target) * 100)),
      target: d.target, current: Math.min(d.current, d.target),
      unlockedAt: d.current >= d.target ? new Date().toISOString() : undefined,
    }));
  }, [user, items]);

  // ── Shop ──
  const shopItems = useMemo<ShopItem[]>(() => {
    const promos = getActivePromotions();
    return ALL_SHOP_ITEMS.map((item) => ({
      ...item,
      cost: applyPromoDiscount(item.cost, promos),
    }));
  }, []);

  const purchaseShopItem = useCallback(async (itemId: TokenShopItem): Promise<{ error?: string }> => {
    if (!user) return { error: "Not logged in" };
    const item = shopItems.find((si) => si.id === itemId);
    if (!item) return { error: "Item not found" };
    if (tokenBalance < item.cost) return { error: "Insufficient tokens" };
    setTokenLedger((prev) => [...prev, {
      id: nanoid(), userId: user.id, amount: -item.cost,
      reason: "boost_spent" as const, description: `Purchased: ${item.title}`,
      createdAt: new Date().toISOString(),
    }]);
    trackEvent("shop_purchase", { itemId, cost: item.cost });
    return {};
  }, [user, shopItems, tokenBalance, trackEvent]);

  return {
    tokenLedger, tokenBalance,
    loginStreak, claimDailyReward,
    referralCode, referrals, sendReferralInvite,
    giftTokens,
    featuredListings, purchaseFeaturedSlot,
    purchaseInsurance,
    isVerified, purchaseVerifiedBadge,
    activeTheme, purchaseTheme, activateTheme,
    isBusiness, purchaseBusinessUpgrade,
    subscription, activePromotions,
    swapMilestones, loyaltyMilestones,
    hasFeature,
    achievements, shopItems, purchaseShopItem,
  };
}
