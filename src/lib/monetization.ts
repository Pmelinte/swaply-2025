/**
 * Monetization engine — 20 capabilities for Swaply.
 *
 * 1.  Token Purchase Packages
 * 2.  Subscription Plans
 * 3.  Referral Program
 * 4.  Daily Login Streak Rewards
 * 5.  Featured Listing Slots
 * 6.  Swap Insurance
 * 7.  Gift Tokens
 * 8.  Bundle Boost Discounts
 * 9.  Verified Badge
 * 10. Custom Profile Themes
 * 11. Extended Search Filters (premium)
 * 12. Priority Matching Queue (premium+)
 * 13. Ad-Free Experience (premium)
 * 14. Analytics Dashboard (premium)
 * 15. Export Reports (platinum)
 * 16. Auction/Bidding Mode (platinum)
 * 17. Business Account Upgrade
 * 18. Seasonal Promotions
 * 19. Swap Completion Bonus Tiers
 * 20. Loyalty Milestones
 */

import type {
  LoginStreak,
  LoyaltyMilestone,
  ProfileTheme,
  SeasonalPromotion,
  ShopItem,
  SubscriptionPlan,
  SwapMilestone,
  TokenLedgerEntry,
  TokenPackage,
} from "./types";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. Token Purchase Packages
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const TOKEN_PACKAGES: TokenPackage[] = [
  { id: "starter_100", tokens: 100, priceEur: 2.99, label: "Starter" },
  { id: "popular_500", tokens: 500, priceEur: 9.99, label: "Popular", popular: true },
  { id: "pro_1000", tokens: 1000, priceEur: 14.99, label: "Pro" },
  { id: "mega_5000", tokens: 5000, priceEur: 49.99, label: "Mega" },
];

export function getTokenPackage(id: string): TokenPackage | undefined {
  return TOKEN_PACKAGES.find((p) => p.id === id);
}

/** Price per token for a given package */
export function pricePerToken(pkg: TokenPackage): number {
  return Math.round((pkg.priceEur / pkg.tokens) * 10000) / 10000;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. Subscription Plans
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      "10 listări active",
      "10 tokens/lună",
      "Chat de bază",
      "Matching standard",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    priceMonthly: 4.99,
    priceYearly: 47.88,
    recommended: true,
    features: [
      "50 listări active",
      "50 tokens/lună",
      "Matching prioritar",
      "Filtre avansate de căutare",
      "Analytics pe articole",
      "Fără reclame",
      "Pin pe hartă",
      "AI suggestions",
      "2 boost slots",
      "1 featured slot",
    ],
  },
  {
    id: "platinum",
    name: "Platinum",
    priceMonthly: 9.99,
    priceYearly: 95.88,
    features: [
      "Listări nelimitate",
      "999 tokens/lună",
      "Tot din Premium +",
      "Export rapoarte PDF/CSV",
      "Mod licitație",
      "Badge profil",
      "Suport prioritar",
      "5 boost slots",
      "3 featured slots",
    ],
  },
];

export function getPlan(id: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find((p) => p.id === id);
}

export function yearlyDiscount(plan: SubscriptionPlan): number {
  if (plan.priceMonthly === 0) return 0;
  const fullYear = plan.priceMonthly * 12;
  return Math.round(((fullYear - plan.priceYearly) / fullYear) * 100);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. Referral Program
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const REFERRAL_REWARD_REFERRER = 25;
export const REFERRAL_REWARD_REFERRED = 15;
export const REFERRAL_BONUS_FIRST_SWAP = 10;

export function generateReferralCode(userId: string): string {
  return `SWAPLY-${userId.slice(0, 6).toUpperCase()}`;
}

export function referralLink(code: string): string {
  return `https://swaply.app/join?ref=${code}`;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. Daily Login Streak Rewards
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const STREAK_REWARDS: Record<number, number> = {
  1: 2,
  2: 2,
  3: 5,
  4: 5,
  5: 5,
  6: 5,
  7: 15,
  14: 30,
  30: 100,
};

export function getStreakReward(day: number): number {
  // Exact match first
  if (STREAK_REWARDS[day]) return STREAK_REWARDS[day];
  // After 30, 5 tokens per day
  if (day > 30) return 5;
  // Find the highest threshold <= day
  const thresholds = Object.keys(STREAK_REWARDS).map(Number).sort((a, b) => b - a);
  for (const t of thresholds) {
    if (day >= t) return STREAK_REWARDS[t];
  }
  return 2;
}

export function computeStreak(lastLoginDate: string, currentStreak: number): LoginStreak {
  const now = new Date();
  const last = new Date(lastLoginDate);
  const diffMs = now.getTime() - last.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return {
      currentStreak,
      longestStreak: currentStreak,
      lastLoginDate,
      todayClaimed: true,
      nextReward: getStreakReward(currentStreak + 1),
    };
  }

  if (diffDays === 1) {
    const newStreak = currentStreak + 1;
    return {
      currentStreak: newStreak,
      longestStreak: newStreak,
      lastLoginDate: now.toISOString(),
      todayClaimed: false,
      nextReward: getStreakReward(newStreak),
    };
  }

  // Streak broken
  return {
    currentStreak: 1,
    longestStreak: currentStreak,
    lastLoginDate: now.toISOString(),
    todayClaimed: false,
    nextReward: getStreakReward(1),
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5. Featured Listing Slots
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const FEATURED_COST = 20;
export const FEATURED_DURATION_HOURS = 48;
export const FEATURED_MAX_SLOTS = 6; // max featured items on homepage

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 6. Swap Insurance
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const INSURANCE_COST = 10;
export const INSURANCE_DURATION_DAYS = 30;

export function isInsurable(perceivedValue?: string): boolean {
  return perceivedValue === "large" || perceivedValue === "sentimental";
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 7. Gift Tokens
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const GIFT_MIN = 5;
export const GIFT_MAX = 1000;

export function validateGiftAmount(amount: number, balance: number): string | null {
  if (amount < GIFT_MIN) return `Minim ${GIFT_MIN} tokens`;
  if (amount > GIFT_MAX) return `Maxim ${GIFT_MAX} tokens`;
  if (amount > balance) return "Fonduri insuficiente";
  return null;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 8. Bundle Boost Discounts
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const BUNDLE_SIZE = 3;
export const BUNDLE_DISCOUNT_PERCENT = 33; // pay for 2, get 3

export function bundlePrice(singlePrice: number): number {
  const fullPrice = singlePrice * BUNDLE_SIZE;
  return Math.round(fullPrice * (1 - BUNDLE_DISCOUNT_PERCENT / 100));
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 9. Verified Badge
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const VERIFIED_BADGE_COST = 100;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 10. Custom Profile Themes
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const PROFILE_THEMES: ProfileTheme[] = [
  { id: "theme_ocean", name: "Ocean", colors: { primary: "#0284c7", secondary: "#38bdf8", accent: "#7dd3fc", bg: "#f0f9ff" }, cost: 15, icon: "🌊" },
  { id: "theme_sunset", name: "Sunset", colors: { primary: "#ea580c", secondary: "#fb923c", accent: "#fed7aa", bg: "#fff7ed" }, cost: 15, icon: "🌅" },
  { id: "theme_forest", name: "Forest", colors: { primary: "#16a34a", secondary: "#4ade80", accent: "#bbf7d0", bg: "#f0fdf4" }, cost: 15, icon: "🌲" },
  { id: "theme_midnight", name: "Midnight", colors: { primary: "#7c3aed", secondary: "#a78bfa", accent: "#ddd6fe", bg: "#faf5ff" }, cost: 15, icon: "🌙" },
  { id: "theme_rose", name: "Rose Gold", colors: { primary: "#e11d48", secondary: "#fb7185", accent: "#fecdd3", bg: "#fff1f2" }, cost: 15, icon: "🌹" },
];

export function getTheme(id: string): ProfileTheme | undefined {
  return PROFILE_THEMES.find((t) => t.id === id);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 11-16. Premium Feature Gates (tier-based)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type PremiumFeature =
  | "extended_filters"   // #11
  | "priority_matching"  // #12
  | "ad_free"           // #13
  | "analytics"         // #14
  | "export_reports"    // #15
  | "auction_mode";     // #16

const FEATURE_MIN_TIER: Record<PremiumFeature, "free" | "premium" | "platinum"> = {
  extended_filters: "premium",
  priority_matching: "premium",
  ad_free: "premium",
  analytics: "premium",
  export_reports: "platinum",
  auction_mode: "platinum",
};

const TIER_RANK = { free: 0, premium: 1, platinum: 2 } as const;

export function hasFeatureAccess(
  userTier: "free" | "premium" | "platinum",
  feature: PremiumFeature,
): boolean {
  return TIER_RANK[userTier] >= TIER_RANK[FEATURE_MIN_TIER[feature]];
}

export function requiredTierForFeature(feature: PremiumFeature): string {
  return FEATURE_MIN_TIER[feature];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 17. Business Account Upgrade
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const BUSINESS_UPGRADE_COST = 500;
export const BUSINESS_ITEM_LIMIT = 200;
export const BUSINESS_BULK_UPLOAD_LIMIT = 50;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 18. Seasonal Promotions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const DEFAULT_PROMOTIONS: SeasonalPromotion[] = [
  {
    id: "spring_2026",
    name: "Spring Swap Fest",
    description: "Dublu tokens pentru fiecare swap completat!",
    type: "token_multiplier",
    multiplier: 2,
    startsAt: "2026-03-20T00:00:00Z",
    endsAt: "2026-04-03T00:00:00Z",
    active: false,
  },
  {
    id: "summer_flash",
    name: "Summer Flash Sale",
    description: "50% reducere la toate boost-urile din shop!",
    type: "shop_discount",
    discountPercent: 50,
    startsAt: "2026-06-21T00:00:00Z",
    endsAt: "2026-06-28T00:00:00Z",
    active: false,
  },
  {
    id: "new_year_bonus",
    name: "New Year Bonus",
    description: "50 tokens gratuit pentru toți utilizatorii activi!",
    type: "bonus_tokens",
    bonusTokens: 50,
    startsAt: "2026-12-31T00:00:00Z",
    endsAt: "2027-01-07T00:00:00Z",
    active: false,
  },
  {
    id: "halloween_boost",
    name: "Halloween Free Boost",
    description: "Un boost gratuit pentru fiecare utilizator!",
    type: "free_boost",
    startsAt: "2026-10-28T00:00:00Z",
    endsAt: "2026-11-01T00:00:00Z",
    active: false,
  },
];

export function getActivePromotions(now = new Date()): SeasonalPromotion[] {
  return DEFAULT_PROMOTIONS.filter((p) => {
    const start = new Date(p.startsAt);
    const end = new Date(p.endsAt);
    return now >= start && now <= end;
  }).map((p) => ({ ...p, active: true }));
}

export function applyPromoDiscount(baseCost: number, promos: SeasonalPromotion[]): number {
  const discount = promos.find((p) => p.type === "shop_discount");
  if (!discount?.discountPercent) return baseCost;
  return Math.round(baseCost * (1 - discount.discountPercent / 100));
}

export function getTokenMultiplier(promos: SeasonalPromotion[]): number {
  const multiplier = promos.find((p) => p.type === "token_multiplier");
  return multiplier?.multiplier ?? 1;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 19. Swap Completion Bonus Tiers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const SWAP_MILESTONES: SwapMilestone[] = [
  { swapCount: 1, bonusTokens: 5, label: "Primul Swap", achieved: false },
  { swapCount: 5, bonusTokens: 10, label: "5 Swapuri", achieved: false },
  { swapCount: 10, bonusTokens: 25, label: "10 Swapuri", achieved: false },
  { swapCount: 25, bonusTokens: 50, label: "25 Swapuri", achieved: false },
  { swapCount: 50, bonusTokens: 100, label: "50 Swapuri", achieved: false },
  { swapCount: 100, bonusTokens: 250, label: "Centurion", achieved: false },
];

export function getSwapMilestones(completedSwaps: number): SwapMilestone[] {
  return SWAP_MILESTONES.map((m) => ({
    ...m,
    achieved: completedSwaps >= m.swapCount,
  }));
}

export function getUnclaimedMilestoneBonus(
  completedSwaps: number,
  claimedMilestones: number[],
): SwapMilestone | null {
  for (const m of SWAP_MILESTONES) {
    if (completedSwaps >= m.swapCount && !claimedMilestones.includes(m.swapCount)) {
      return m;
    }
  }
  return null;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 20. Loyalty Milestones
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const LOYALTY_MILESTONES: LoyaltyMilestone[] = [
  { daysActive: 7, reward: "10 tokens bonus", rewardType: "token_grant", tokenAmount: 10, achieved: false },
  { daysActive: 30, reward: "7 zile Premium gratuit", rewardType: "premium_trial", trialDays: 7, achieved: false },
  { daysActive: 90, reward: "1 lună Premium gratuit", rewardType: "free_month", trialDays: 30, achieved: false },
  { daysActive: 180, reward: "50 tokens + badge special", rewardType: "token_grant", tokenAmount: 50, achieved: false },
  { daysActive: 365, reward: "Badge permanent Premium", rewardType: "permanent_badge", achieved: false },
];

export function getLoyaltyMilestones(daysActive: number): LoyaltyMilestone[] {
  return LOYALTY_MILESTONES.map((m) => ({
    ...m,
    achieved: daysActive >= m.daysActive,
  }));
}

export function computeDaysActive(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Expanded Shop Items (all 16 items)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const ALL_SHOP_ITEMS: ShopItem[] = [
  // Boosts
  { id: "boost_listing", title: "Boost Listing", description: "Pin articol în top 24h", cost: 10, icon: "🚀", category: "boost" },
  { id: "priority_matching_24h", title: "Matching Prioritar", description: "24h prioritate în matching", cost: 20, icon: "⚡", category: "boost" },
  { id: "featured_48h", title: "Featured 48h", description: "Articol pe homepage 48h", cost: 20, icon: "⭐", category: "boost" },
  { id: "bundle_boost_3", title: "Bundle Boost ×3", description: "Boost 3 articole (preț de 2)", cost: 20, icon: "📦", category: "boost" },
  { id: "highlight_profile_7d", title: "Profil Evidențiat", description: "Profil highlight 7 zile", cost: 25, icon: "✨", category: "boost" },

  // Badges & verification
  { id: "premium_badge_7d", title: "Premium 7 Zile", description: "Experiență premium 7 zile", cost: 50, icon: "💎", category: "badge" },
  { id: "verified_badge", title: "Badge Verificat", description: "Identitate verificată permanent", cost: 100, icon: "✅", category: "badge" },

  // Listings
  { id: "extra_listings_5", title: "+5 Listări", description: "Extinde limita cu 5 articole", cost: 15, icon: "📋", category: "premium" },
  { id: "auction_slot", title: "Slot Licitație", description: "Activează licitația pe un articol", cost: 30, icon: "🔨", category: "premium" },

  // Themes
  { id: "theme_ocean", title: "Tema Ocean", description: "Profil albastru ocean", cost: 15, icon: "🌊", category: "theme" },
  { id: "theme_sunset", title: "Tema Sunset", description: "Profil portocaliu sunset", cost: 15, icon: "🌅", category: "theme" },
  { id: "theme_forest", title: "Tema Forest", description: "Profil verde pădure", cost: 15, icon: "🌲", category: "theme" },
  { id: "theme_midnight", title: "Tema Midnight", description: "Profil violet midnight", cost: 15, icon: "🌙", category: "theme" },
  { id: "theme_rose", title: "Tema Rose Gold", description: "Profil roz elegant", cost: 15, icon: "🌹", category: "theme" },

  // Business
  { id: "business_upgrade", title: "Business Account", description: "200 listări, bulk upload, branding", cost: 500, icon: "🏢", category: "business" },

  // Insurance
  { id: "swap_insurance", title: "Asigurare Swap", description: "Protecție dispute 30 zile", cost: 10, icon: "🛡️", category: "premium" },
];

export function getShopItemsByCategory(category: ShopItem["category"]): ShopItem[] {
  return ALL_SHOP_ITEMS.filter((i) => i.category === category);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Token balance helper
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function computeBalance(ledger: TokenLedgerEntry[]): number {
  return ledger.reduce((sum, entry) => sum + entry.amount, 0);
}

export function canAfford(ledger: TokenLedgerEntry[], cost: number): boolean {
  return computeBalance(ledger) >= cost;
}
