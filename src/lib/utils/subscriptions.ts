/**
 * Subscription feature gating utility.
 *
 * Defines per-plan features and provides hasFeature() for checking
 * whether a user's plan includes a given capability.
 */

export type PlanId = "free" | "premium" | "platinum";

export type SubscriptionFeature =
  | "browse"
  | "basic_match"
  | "limited_items"
  | "unlimited_items"
  | "priority_match"
  | "swap_analytics"
  | "no_ads"
  | "50_tokens"
  | "map_pin"
  | "priority_support"
  | "unlimited_tokens"
  | "featured_badge"
  | "extended_filters"
  | "export_reports"
  | "auction_mode"
  | "ai_suggestions"
  | "boost_slots"
  | "featured_slots";

const FREE_FEATURES: SubscriptionFeature[] = [
  "browse",
  "basic_match",
  "limited_items",
];

const PREMIUM_FEATURES: SubscriptionFeature[] = [
  ...FREE_FEATURES,
  "unlimited_items",
  "priority_match",
  "swap_analytics",
  "no_ads",
  "50_tokens",
  "extended_filters",
  "ai_suggestions",
  "boost_slots",
  "featured_slots",
];

const PLATINUM_FEATURES: SubscriptionFeature[] = [
  ...PREMIUM_FEATURES,
  "map_pin",
  "priority_support",
  "unlimited_tokens",
  "featured_badge",
  "export_reports",
  "auction_mode",
];

export const PLAN_FEATURES: Record<PlanId, SubscriptionFeature[]> = {
  free: FREE_FEATURES,
  premium: PREMIUM_FEATURES,
  platinum: PLATINUM_FEATURES,
};

/**
 * Check if a plan includes a specific feature.
 * @param plan  The user's current plan (defaults to "free")
 * @param feature  The feature to check
 */
export function hasFeature(plan: PlanId | undefined, feature: SubscriptionFeature): boolean {
  const userPlan = plan ?? "free";
  return PLAN_FEATURES[userPlan]?.includes(feature) ?? false;
}

/**
 * Get the minimum plan required for a feature.
 */
export function requiredPlan(feature: SubscriptionFeature): PlanId {
  if (FREE_FEATURES.includes(feature)) return "free";
  if (PREMIUM_FEATURES.includes(feature)) return "premium";
  return "platinum";
}

/**
 * Plan display info for UI.
 */
export const PLAN_INFO: Record<PlanId, { name: string; priceRon: number; priceLabel: string }> = {
  free: { name: "Free", priceRon: 0, priceLabel: "Gratuit" },
  premium: { name: "Premium", priceRon: 19, priceLabel: "19 RON/lună" },
  platinum: { name: "Platinum", priceRon: 49, priceLabel: "49 RON/lună" },
};
