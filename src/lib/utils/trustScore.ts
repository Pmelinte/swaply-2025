import type { UserProfile, Item, SwapIntent } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Trust Score Algorithm (0-100)                                      */
/* ------------------------------------------------------------------ */

export interface TrustSignal {
  key: string;
  label: string;
  points: number;
  maxPoints: number;
  positive: boolean;
}

export interface TrustResult {
  score: number;
  tier: TrustTier;
  signals: TrustSignal[];
}

export type TrustTier = "low" | "moderate" | "good" | "excellent";

const TIER_THRESHOLDS: { min: number; tier: TrustTier }[] = [
  { min: 75, tier: "excellent" },
  { min: 50, tier: "good" },
  { min: 25, tier: "moderate" },
  { min: 0, tier: "low" },
];

function getTier(score: number): TrustTier {
  for (const t of TIER_THRESHOLDS) {
    if (score >= t.min) return t.tier;
  }
  return "low";
}

function daysSince(dateStr: string | undefined): number {
  if (!dateStr) return 0;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export function calculateTrustScore(
  user: UserProfile,
  item: Item | null,
  swaps: SwapIntent[],
): TrustResult {
  const signals: TrustSignal[] = [];

  // --- POSITIVE signals ---

  // +15: account > 30 days
  const accountAge = daysSince(user.createdAt);
  const accountAgePoints = accountAge > 30 ? 15 : 0;
  signals.push({
    key: "accountAge",
    label: accountAge > 30
      ? `accountAge_${accountAge}`
      : "accountAge_new",
    points: accountAgePoints,
    maxPoints: 15,
    positive: true,
  });

  // +10: email verified (we assume verified if email exists and isn't empty)
  const emailVerified = !!user.email;
  signals.push({
    key: "emailVerified",
    label: "emailVerified",
    points: emailVerified ? 10 : 0,
    maxPoints: 10,
    positive: true,
  });

  // +10: phone verified (check security.twoFactorEnabled with sms method)
  const phoneVerified = user.security?.twoFactorEnabled && user.security?.method === "sms";
  signals.push({
    key: "phoneVerified",
    label: "phoneVerified",
    points: phoneVerified ? 10 : 0,
    maxPoints: 10,
    positive: true,
  });

  // +5 per completed swap (max +25)
  const completedSwaps = swaps.filter((s) => s.status === "completed").length;
  const swapPoints = Math.min(25, completedSwaps * 5);
  signals.push({
    key: "completedSwaps",
    label: `completedSwaps_${completedSwaps}`,
    points: swapPoints,
    maxPoints: 25,
    positive: true,
  });

  // +10: response rate > 80% (approximated from stats.reputation)
  const highResponseRate = user.stats?.reputation === "trusted" || user.stats?.reputation === "ambassador";
  signals.push({
    key: "responseRate",
    label: "responseRate",
    points: highResponseRate ? 10 : 0,
    maxPoints: 10,
    positive: true,
  });

  // +10: complete description (> 100 chars)
  const descComplete = item ? item.description.length > 100 : false;
  signals.push({
    key: "descriptionComplete",
    label: "descriptionComplete",
    points: descComplete ? 10 : 0,
    maxPoints: 10,
    positive: true,
  });

  // +5 per photo (max +15, i.e. 3+ photos)
  const photoCount = item?.photos?.length ?? 0;
  const photoPoints = Math.min(15, photoCount * 5);
  signals.push({
    key: "photos",
    label: `photos_${photoCount}`,
    points: photoPoints,
    maxPoints: 15,
    positive: true,
  });

  // +5: no disputes in last 6 months
  const sixMonthsAgo = Date.now() - 180 * 24 * 60 * 60 * 1000;
  const recentDisputes = swaps.filter(
    (s) => s.dispute && new Date(s.dispute.filedAt).getTime() > sixMonthsAgo,
  );
  signals.push({
    key: "noRecentDisputes",
    label: "noRecentDisputes",
    points: recentDisputes.length === 0 ? 5 : 0,
    maxPoints: 5,
    positive: true,
  });

  // +5: location set
  const locationSet = !!(user.location?.city || user.location?.country);
  signals.push({
    key: "locationSet",
    label: "locationSet",
    points: locationSet ? 5 : 0,
    maxPoints: 5,
    positive: true,
  });

  // --- NEGATIVE signals ---

  // -20: active open dispute
  const activeDispute = swaps.some(
    (s) => s.dispute && s.dispute.status === "open",
  );
  if (activeDispute) {
    signals.push({
      key: "activeDispute",
      label: "activeDispute",
      points: -20,
      maxPoints: 0,
      positive: false,
    });
  }

  // -10: no-show reported
  const noShow = swaps.some(
    (s) => s.dispute?.reason === "no_show",
  );
  if (noShow) {
    signals.push({
      key: "noShow",
      label: "noShow",
      points: -10,
      maxPoints: 0,
      positive: false,
    });
  }

  // -5: new account (< 7 days)
  if (accountAge < 7) {
    signals.push({
      key: "newAccount",
      label: "newAccount",
      points: -5,
      maxPoints: 0,
      positive: false,
    });
  }

  // -5: item edited recently (< 24h) — approximate via createdAt vs now for simplicity
  if (item) {
    const itemAge = daysSince(item.createdAt);
    if (itemAge < 1) {
      signals.push({
        key: "recentlyEdited",
        label: "recentlyEdited",
        points: -5,
        maxPoints: 0,
        positive: false,
      });
    }
  }

  // -10: multiple rejected listings (cancelled > 2)
  const rejectedCount = swaps.filter((s) => s.status === "rejected").length;
  if (rejectedCount > 2) {
    signals.push({
      key: "multipleRejected",
      label: "multipleRejected",
      points: -10,
      maxPoints: 0,
      positive: false,
    });
  }

  // Calculate total
  const raw = signals.reduce((sum, s) => sum + s.points, 0);
  const score = Math.min(100, Math.max(0, raw));

  return {
    score,
    tier: getTier(score),
    signals,
  };
}

/* ------------------------------------------------------------------ */
/*  Tier styling helpers                                               */
/* ------------------------------------------------------------------ */

export const TIER_CONFIG: Record<TrustTier, { emoji: string; bg: string; text: string; border: string; progressColor: string }> = {
  excellent: {
    emoji: "🟢",
    bg: "bg-green-50 dark:bg-green-950/30",
    text: "text-green-700 dark:text-green-300",
    border: "border-green-200 dark:border-green-800",
    progressColor: "bg-green-500",
  },
  good: {
    emoji: "🔵",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
    progressColor: "bg-blue-500",
  },
  moderate: {
    emoji: "🟡",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
    progressColor: "bg-amber-500",
  },
  low: {
    emoji: "🔴",
    bg: "bg-red-50 dark:bg-red-950/30",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-200 dark:border-red-800",
    progressColor: "bg-red-500",
  },
};
