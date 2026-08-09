export type FeatureFlagCategory =
  | "core"
  | "ai"
  | "social"
  | "monetization"
  | "experimental";

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: FeatureFlagCategory;
  rolloutPercent: number;
  allowedCountries?: string[];
}

const RELEASE_GATED_FLAG_ENVS: Record<string, string> = {
  stripe_payments: "SWAPLY_ENABLE_STRIPE_PRODUCTION",
  paypal_payments: "SWAPLY_ENABLE_PAYPAL_PRODUCTION",
  boost_listings: "SWAPLY_ENABLE_STRIPE_PRODUCTION",
  token_shop: "SWAPLY_ENABLE_STRIPE_PRODUCTION",
  subscriptions: "SWAPLY_ENABLE_STRIPE_PRODUCTION",
  courier_integration: "SWAPLY_ENABLE_COURIERS_PRODUCTION",
  swap_insurance: "SWAPLY_ENABLE_INSURANCE_PRODUCTION",
  travel_integrations: "SWAPLY_ENABLE_TRAVEL_INTEGRATIONS_PRODUCTION",
  ads_banner: "SWAPLY_ENABLE_ADS_PRODUCTION",
  api_access: "SWAPLY_ENABLE_PUBLIC_API_PRODUCTION",
};

const FLAG_ALIASES: Record<string, string> = {
  ads_display: "ads_banner",
  courier_shipping: "courier_integration",
  daily_streaks: "daily_streak",
  referrals: "referral_program",
};

export function normalizeFeatureFlagId(flagId: string): string {
  return FLAG_ALIASES[flagId] ?? flagId;
}

export const DEFAULT_FLAGS: FeatureFlag[] = [
  flag("push_notifications", "Push Notifications", true, "core"),
  flag("ai_matching", "AI Matching", true, "ai"),
  flag("ai_suggestions", "AI Suggestions", true, "ai"),
  flag("location_sharing", "Location Sharing", true, "core"),
  flag("realtime_chat", "Realtime Chat", true, "core"),
  flag("image_uploads", "Image Uploads", true, "core"),
  flag("scam_detection", "Scam Detection", true, "social"),
  flag("trust_scores", "Trust Scores", true, "social"),
  flag("adaptive_friction", "Adaptive Friction", true, "social"),
  flag("safe_meeting", "Safe Meeting", true, "social"),
  flag("daily_streak", "Daily Streak", true, "core"),
  flag("item_lock", "Item Lock", true, "core"),
  flag("referral_program", "Referral Program", true, "core"),
  flag("house_swap", "House Swap", true, "core"),
  flag("service_swap", "Service Swap", true, "core"),

  // Provider-backed capabilities remain implemented in code but disabled until
  // both their database flag and the explicit Production authorisation switch
  // are enabled. A missing database response must never activate them.
  flag("token_shop", "Token Shop", false, "monetization", 0),
  flag("subscriptions", "Subscriptions", false, "monetization", 0),
  flag("stripe_payments", "Stripe Payments", false, "monetization", 0),
  flag("paypal_payments", "PayPal Payments", false, "monetization", 0),
  flag("boost_listings", "Paid Listing Boosts", false, "monetization", 0),
  flag("courier_integration", "Courier Integrations", false, "experimental", 0),
  flag("swap_insurance", "Swap Insurance", false, "experimental", 0),
  flag("travel_integrations", "Travel Integrations", false, "experimental", 0),
  flag("ads_banner", "Advertising", false, "monetization", 0),
  flag("api_access", "Public API Access", false, "experimental", 0),
  flag("auctions", "Auctions", false, "experimental", 0),
  flag("video_calls", "Video Calls", false, "experimental", 0),
];

function flag(
  id: string,
  name: string,
  enabled: boolean,
  category: FeatureFlagCategory,
  rolloutPercent = enabled ? 100 : 0,
): FeatureFlag {
  return {
    id,
    name,
    description: "",
    enabled,
    category,
    rolloutPercent,
  };
}

function hashUserId(userId: string): number {
  let hash = 0;
  for (let index = 0; index < userId.length; index += 1) {
    hash = (hash << 5) - hash + userId.charCodeAt(index);
    hash &= hash;
  }
  return Math.abs(hash);
}

export function isFlagEnabled(
  flags: FeatureFlag[],
  flagId: string,
  userId?: string,
): boolean {
  const normalizedId = normalizeFeatureFlagId(flagId);
  const flagValue = flags.find((entry) => entry.id === normalizedId);

  if (!flagValue?.enabled) return false;
  if (flagValue.rolloutPercent >= 100) return true;
  if (flagValue.rolloutPercent <= 0 || !userId) return false;

  return hashUserId(userId) % 100 < flagValue.rolloutPercent;
}

const CACHE_TTL_MS = 5 * 60 * 1000;

interface FlagCache {
  flags: FeatureFlag[];
  fetchedAt: number;
  promise: Promise<FeatureFlag[]> | null;
}

export const flagCache: FlagCache = {
  flags: DEFAULT_FLAGS,
  fetchedAt: 0,
  promise: null,
};

function inferCategory(id: string): FeatureFlagCategory {
  return DEFAULT_FLAGS.find((entry) => entry.id === id)?.category ?? "core";
}

function inferName(id: string): string {
  return DEFAULT_FLAGS.find((entry) => entry.id === id)?.name ?? id;
}

function mapDbRow(row: Record<string, unknown>): FeatureFlag | null {
  const rawId = typeof row.key === "string"
    ? row.key
    : typeof row.id === "string"
      ? row.id
      : "";
  const id = normalizeFeatureFlagId(rawId.trim());
  if (!id) return null;

  return {
    id,
    name: typeof row.name === "string" && row.name.trim()
      ? row.name
      : inferName(id),
    description: typeof row.description === "string" ? row.description : "",
    enabled: row.enabled === true,
    category: inferCategory(id),
    rolloutPercent:
      typeof row.rollout_percent === "number"
        ? Math.max(0, Math.min(100, row.rollout_percent))
        : 100,
    allowedCountries: Array.isArray(row.allowed_countries)
      ? row.allowed_countries.filter(
          (value): value is string => typeof value === "string",
        )
      : undefined,
  };
}

function mergeWithDefaults(rows: Record<string, unknown>[]): FeatureFlag[] {
  const byId = new Map(DEFAULT_FLAGS.map((entry) => [entry.id, { ...entry }]));

  for (const row of rows) {
    const mapped = mapDbRow(row);
    if (!mapped) continue;
    const existing = byId.get(mapped.id);
    byId.set(mapped.id, {
      ...(existing ?? mapped),
      ...mapped,
      category: existing?.category ?? mapped.category,
    });
  }

  return [...byId.values()];
}

function applyProductionAuthorisation(flags: FeatureFlag[]): FeatureFlag[] {
  if (typeof window !== "undefined") return flags;

  return flags.map((entry) => {
    const envName = RELEASE_GATED_FLAG_ENVS[entry.id];
    if (!envName) return entry;

    const authorised = process.env[envName] === "true";
    return {
      ...entry,
      enabled: entry.enabled && authorised,
      rolloutPercent: entry.enabled && authorised ? entry.rolloutPercent : 0,
    };
  });
}

async function fetchFlagsOnServer(): Promise<FeatureFlag[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return DEFAULT_FLAGS;

  try {
    const response = await fetch(
      `${url}/rest/v1/feature_flags?select=key,enabled,rollout_percent,description`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) return DEFAULT_FLAGS;
    const rows = (await response.json()) as Record<string, unknown>[];
    if (!Array.isArray(rows)) return DEFAULT_FLAGS;

    return applyProductionAuthorisation(mergeWithDefaults(rows));
  } catch {
    return DEFAULT_FLAGS;
  }
}

async function fetchFlagsInBrowser(): Promise<FeatureFlag[]> {
  try {
    const response = await fetch("/api/feature-flags", {
      cache: "no-store",
      credentials: "same-origin",
    });
    if (!response.ok) return DEFAULT_FLAGS;

    const body = (await response.json()) as { flags?: unknown };
    if (!Array.isArray(body.flags)) return DEFAULT_FLAGS;
    return mergeWithDefaults(body.flags as Record<string, unknown>[]);
  } catch {
    return DEFAULT_FLAGS;
  }
}

export function loadFlags(): Promise<FeatureFlag[]> {
  const now = Date.now();
  if (now - flagCache.fetchedAt < CACHE_TTL_MS) {
    return Promise.resolve(flagCache.flags);
  }
  if (flagCache.promise) return flagCache.promise;

  const request = typeof window === "undefined"
    ? fetchFlagsOnServer()
    : fetchFlagsInBrowser();

  flagCache.promise = request
    .then((flags) => {
      flagCache.flags = flags;
      flagCache.fetchedAt = Date.now();
      flagCache.promise = null;
      return flags;
    })
    .catch(() => {
      flagCache.promise = null;
      flagCache.flags = DEFAULT_FLAGS;
      return DEFAULT_FLAGS;
    });

  return flagCache.promise;
}

export function invalidateFlagCache(): void {
  flagCache.fetchedAt = 0;
  flagCache.promise = null;
  flagCache.flags = DEFAULT_FLAGS;
}

export async function getFeatureFlag(
  key: string,
  userId?: string,
): Promise<boolean> {
  return isFlagEnabled(await loadFlags(), key, userId);
}

export interface CronJob {
  id: string;
  name: string;
  description: string;
  schedule: string;
  lastRun?: string;
  nextRun?: string;
  enabled: boolean;
  status: "idle" | "running" | "error";
}

export const DEFAULT_CRON_JOBS: CronJob[] = [
  cron("daily_digest", "Digest Zilnic", "Zilnic la 09:00"),
  cron("streak_reset", "Reset Streak-uri", "Zilnic la 00:00"),
  cron("cleanup_expired", "Curățare Date Expirate", "Zilnic la 03:00"),
  cron("recompute_stats", "Recalculare Statistici", "La fiecare 6 ore"),
  cron("trust_score_refresh", "Refresh Trust Scores", "Zilnic la 02:00"),
  cron("inactive_reminder", "Reminder Inactivi", "Săptămânal luni la 10:00"),
];

function cron(id: string, name: string, schedule: string): CronJob {
  return {
    id,
    name,
    description: "",
    schedule,
    enabled: true,
    status: "idle",
  };
}

export interface MetricsFunnel {
  visitors: number;
  signups: number;
  itemsListed: number;
  chatStarted: number;
  swapProposed: number;
  swapCompleted: number;
  retention7d: number;
  retention30d: number;
}

export interface DailyMetric {
  date: string;
  event: string;
  count: number;
}

export function computeFunnelRates(funnel: MetricsFunnel) {
  const safe = (numerator: number, denominator: number) =>
    denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;

  return {
    visitToSignup: safe(funnel.signups, funnel.visitors),
    signupToList: safe(funnel.itemsListed, funnel.signups),
    listToChat: safe(funnel.chatStarted, funnel.itemsListed),
    chatToPropose: safe(funnel.swapProposed, funnel.chatStarted),
    proposeToComplete: safe(funnel.swapCompleted, funnel.swapProposed),
    overallConversion: safe(funnel.swapCompleted, funnel.visitors),
  };
}

export function defaultMetrics(): MetricsFunnel {
  return {
    visitors: 0,
    signups: 0,
    itemsListed: 0,
    chatStarted: 0,
    swapProposed: 0,
    swapCompleted: 0,
    retention7d: 0,
    retention30d: 0,
  };
}

export function computeMetricsFromState(state: {
  totalUsers: number;
  usersWithItems: number;
  usersWithChats: number;
  usersWithSwaps: number;
  completedSwaps: number;
}): MetricsFunnel {
  return {
    visitors: state.totalUsers * 3,
    signups: state.totalUsers,
    itemsListed: state.usersWithItems,
    chatStarted: state.usersWithChats,
    swapProposed: state.usersWithSwaps,
    swapCompleted: state.completedSwaps,
    retention7d: 0,
    retention30d: 0,
  };
}
