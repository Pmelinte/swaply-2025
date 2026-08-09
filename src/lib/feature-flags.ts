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

type FlagSeed = readonly [
  id: string,
  name: string,
  enabled: boolean,
  category: FeatureFlagCategory,
];

const CORE_FLAGS: FlagSeed[] = [
  ["push_notifications", "Push Notifications", true, "core"],
  ["ai_matching", "AI Matching", true, "ai"],
  ["ai_suggestions", "AI Suggestions", true, "ai"],
  ["location_sharing", "Location Sharing", true, "core"],
  ["realtime_chat", "Realtime Chat", true, "core"],
  ["image_uploads", "Image Uploads", true, "core"],
  ["scam_detection", "Scam Detection", true, "social"],
  ["trust_scores", "Trust Scores", true, "social"],
  ["adaptive_friction", "Adaptive Friction", true, "social"],
  ["safe_meeting", "Safe Meeting", true, "social"],
  ["daily_streak", "Daily Streak", true, "core"],
  ["item_lock", "Item Lock", true, "core"],
  ["referral_program", "Referral Program", true, "core"],
  ["house_swap", "House Swap", true, "core"],
  ["service_swap", "Service Swap", true, "core"],
];

const RELEASE_GATED_FLAGS: FlagSeed[] = [
  ["token_shop", "Token Shop", false, "monetization"],
  ["subscriptions", "Subscriptions", false, "monetization"],
  ["stripe_payments", "Stripe Payments", false, "monetization"],
  ["paypal_payments", "PayPal Payments", false, "monetization"],
  ["boost_listings", "Paid Listing Boosts", false, "monetization"],
  ["courier_integration", "Courier Integrations", false, "experimental"],
  ["swap_insurance", "Swap Insurance", false, "experimental"],
  ["travel_integrations", "Travel Integrations", false, "experimental"],
  ["ads_banner", "Advertising", false, "monetization"],
  ["api_access", "Public API Access", false, "experimental"],
  ["auctions", "Auctions", false, "experimental"],
  ["video_calls", "Video Calls", false, "experimental"],
];

const FLAG_ALIASES: Record<string, string> = {
  ads_display: "ads_banner",
  courier_shipping: "courier_integration",
  daily_streaks: "daily_streak",
  referrals: "referral_program",
};

const RELEASE_AUTH_ENV: Record<string, string> = {
  token_shop: "SWAPLY_ENABLE_STRIPE_PRODUCTION",
  subscriptions: "SWAPLY_ENABLE_STRIPE_PRODUCTION",
  stripe_payments: "SWAPLY_ENABLE_STRIPE_PRODUCTION",
  boost_listings: "SWAPLY_ENABLE_STRIPE_PRODUCTION",
  paypal_payments: "SWAPLY_ENABLE_PAYPAL_PRODUCTION",
  courier_integration: "SWAPLY_ENABLE_COURIERS_PRODUCTION",
  swap_insurance: "SWAPLY_ENABLE_INSURANCE_PRODUCTION",
  travel_integrations: "SWAPLY_ENABLE_TRAVEL_INTEGRATIONS_PRODUCTION",
  ads_banner: "SWAPLY_ENABLE_ADS_PRODUCTION",
  api_access: "SWAPLY_ENABLE_PUBLIC_API_PRODUCTION",
};

function fromSeed([id, name, enabled, category]: FlagSeed): FeatureFlag {
  return {
    id,
    name,
    description: "",
    enabled,
    category,
    rolloutPercent: enabled ? 100 : 0,
  };
}

export const DEFAULT_FLAGS: FeatureFlag[] = [
  ...CORE_FLAGS.map(fromSeed),
  ...RELEASE_GATED_FLAGS.map(fromSeed),
];

export function normalizeFeatureFlagId(value: string): string {
  const id = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return FLAG_ALIASES[id] ?? id;
}

function clampRollout(value: unknown, fallback = 100): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed)
    ? Math.max(0, Math.min(100, Math.round(parsed)))
    : fallback;
}

function mapRow(row: Record<string, unknown>): FeatureFlag | null {
  const rawId = typeof row.key === "string"
    ? row.key
    : typeof row.id === "string"
      ? row.id
      : "";
  const id = normalizeFeatureFlagId(rawId);
  if (!id) return null;

  const fallback = DEFAULT_FLAGS.find((flag) => flag.id === id);
  return {
    id,
    name:
      typeof row.name === "string" && row.name.trim()
        ? row.name
        : fallback?.name ?? id,
    description:
      typeof row.description === "string" ? row.description : "",
    enabled: row.enabled === true,
    category: fallback?.category ?? "core",
    rolloutPercent: clampRollout(
      row.rollout_percent ?? row.rolloutPercent,
      fallback?.rolloutPercent ?? 100,
    ),
    allowedCountries: Array.isArray(
      row.allowed_countries ?? row.allowedCountries,
    )
      ? ((row.allowed_countries ?? row.allowedCountries) as unknown[]).filter(
          (entry): entry is string => typeof entry === "string",
        )
      : undefined,
  };
}

function mergeRows(rows: Record<string, unknown>[]): FeatureFlag[] {
  const registry = new Map(
    DEFAULT_FLAGS.map((flag) => [flag.id, { ...flag }]),
  );

  for (const row of rows) {
    const mapped = mapRow(row);
    if (!mapped || !registry.has(mapped.id)) continue;
    registry.set(mapped.id, mapped);
  }

  return [...registry.values()];
}

function applyServerAuthorisation(flags: FeatureFlag[]): FeatureFlag[] {
  return flags.map((flag) => {
    const envName = RELEASE_AUTH_ENV[flag.id];
    if (!envName) return flag;
    const authorised = process.env[envName] === "true";
    return {
      ...flag,
      enabled: flag.enabled && authorised,
      rolloutPercent: flag.enabled && authorised ? flag.rolloutPercent : 0,
    };
  });
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
  const flag = flags.find(
    (entry) => entry.id === normalizeFeatureFlagId(flagId),
  );
  if (!flag?.enabled) return false;
  if (flag.rolloutPercent >= 100) return true;
  if (flag.rolloutPercent <= 0 || !userId) return false;
  return hashUserId(userId) % 100 < flag.rolloutPercent;
}

const CACHE_TTL_MS = 5 * 60 * 1000;

export const flagCache: {
  flags: FeatureFlag[];
  fetchedAt: number;
  promise: Promise<FeatureFlag[]> | null;
} = {
  flags: DEFAULT_FLAGS.map((flag) => ({ ...flag })),
  fetchedAt: 0,
  promise: null,
};

async function fetchServerFlags(): Promise<FeatureFlag[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return DEFAULT_FLAGS.map((flag) => ({ ...flag }));

  try {
    // `select=*` supports both the historical bootstrap column `id` and the
    // verified Production column `key`; mapRow normalizes either shape.
    const response = await fetch(`${url}/rest/v1/feature_flags?select=*`, {
      cache: "no-store",
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!response.ok) return DEFAULT_FLAGS.map((flag) => ({ ...flag }));
    const rows = (await response.json()) as Record<string, unknown>[];
    return Array.isArray(rows)
      ? applyServerAuthorisation(mergeRows(rows))
      : DEFAULT_FLAGS.map((flag) => ({ ...flag }));
  } catch {
    return DEFAULT_FLAGS.map((flag) => ({ ...flag }));
  }
}

async function fetchBrowserFlags(): Promise<FeatureFlag[]> {
  try {
    const response = await fetch("/api/feature-flags", {
      cache: "no-store",
      credentials: "same-origin",
    });
    if (!response.ok) return DEFAULT_FLAGS.map((flag) => ({ ...flag }));
    const body = (await response.json()) as { flags?: unknown };
    return Array.isArray(body.flags)
      ? mergeRows(body.flags as Record<string, unknown>[])
      : DEFAULT_FLAGS.map((flag) => ({ ...flag }));
  } catch {
    return DEFAULT_FLAGS.map((flag) => ({ ...flag }));
  }
}

export function loadFlags(): Promise<FeatureFlag[]> {
  const now = Date.now();
  if (now - flagCache.fetchedAt < CACHE_TTL_MS) {
    return Promise.resolve(flagCache.flags);
  }
  if (flagCache.promise) return flagCache.promise;

  flagCache.promise = (
    typeof window === "undefined" ? fetchServerFlags() : fetchBrowserFlags()
  )
    .then((flags) => {
      flagCache.flags = flags;
      flagCache.fetchedAt = Date.now();
      flagCache.promise = null;
      return flags;
    })
    .catch(() => {
      flagCache.flags = DEFAULT_FLAGS.map((flag) => ({ ...flag }));
      flagCache.fetchedAt = Date.now();
      flagCache.promise = null;
      return flagCache.flags;
    });

  return flagCache.promise;
}

export function invalidateFlagCache(): void {
  flagCache.flags = DEFAULT_FLAGS.map((flag) => ({ ...flag }));
  flagCache.fetchedAt = 0;
  flagCache.promise = null;
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
  const rate = (value: number, total: number) =>
    total > 0 ? Math.round((value / total) * 100) : 0;
  return {
    visitToSignup: rate(funnel.signups, funnel.visitors),
    signupToList: rate(funnel.itemsListed, funnel.signups),
    listToChat: rate(funnel.chatStarted, funnel.itemsListed),
    chatToPropose: rate(funnel.swapProposed, funnel.chatStarted),
    proposeToComplete: rate(funnel.swapCompleted, funnel.swapProposed),
    overallConversion: rate(funnel.swapCompleted, funnel.visitors),
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
