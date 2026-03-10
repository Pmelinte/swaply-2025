/**
 * Extended Feature Flags + Product Control
 * Admin-configurable toggles, cron scheduling, metrics funnel.
 *
 * Reads from Supabase table: feature_flags (columns: id, enabled, rollout_percent, …)
 * Client hook: useFeatureFlag(key)  — see use-feature-flags.ts
 * Server util: getFeatureFlag(key)  — async, for Server Components / Route Handlers
 */

/* ─── Feature Flag Definitions ─── */

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: "core" | "ai" | "social" | "monetization" | "experimental";
  rolloutPercent: number;   // 0–100 (for gradual rollouts)
  allowedCountries?: string[]; // empty = all countries
}

export const DEFAULT_FLAGS: FeatureFlag[] = [
  { id: "push_notifications", name: "Push Notifications", description: "Notificări push web pentru mesaje și match-uri noi", enabled: true, category: "core", rolloutPercent: 100 },
  { id: "ai_matching", name: "AI Matching", description: "Analiza AI a match-urilor (HuggingFace)", enabled: true, category: "ai", rolloutPercent: 100 },
  { id: "ai_suggestions", name: "Sugestii AI", description: "Sugestii inteligente pentru titlu/descriere/tags la listări", enabled: true, category: "ai", rolloutPercent: 100 },
  { id: "location_sharing", name: "Location Sharing", description: "Partajare locație în chat pentru întâlniri", enabled: true, category: "core", rolloutPercent: 100 },
  { id: "realtime_chat", name: "Realtime Chat", description: "Mesaje în timp real prin Supabase Realtime", enabled: true, category: "core", rolloutPercent: 100 },
  { id: "image_uploads", name: "Image Uploads", description: "Upload imagini prin Cloudinary", enabled: true, category: "core", rolloutPercent: 100 },
  { id: "scam_detection", name: "Detecție Scam", description: "Analiză automată a mesajelor pentru detectarea tentativelor de fraudă", enabled: true, category: "social", rolloutPercent: 100 },
  { id: "trust_scores", name: "Trust Scores", description: "Scor de încredere calculat per utilizator (0–100)", enabled: true, category: "social", rolloutPercent: 100 },
  { id: "adaptive_friction", name: "Fricțiune Adaptivă", description: "Limite de mesaje/propuneri bazate pe trust score", enabled: true, category: "social", rolloutPercent: 100 },
  { id: "safe_meeting", name: "Safe Meeting", description: "Checklist și ghid de siguranță pentru întâlniri", enabled: true, category: "social", rolloutPercent: 100 },
  { id: "token_shop", name: "Token Shop", description: "Magazin de tokens și teme", enabled: true, category: "monetization", rolloutPercent: 100 },
  { id: "subscriptions", name: "Subscriptions", description: "Planuri de abonament Premium/Platinum", enabled: true, category: "monetization", rolloutPercent: 100 },
  { id: "referrals", name: "Referral Program", description: "Program de recomandări cu tokens bonus", enabled: true, category: "monetization", rolloutPercent: 100 },
  { id: "daily_streaks", name: "Daily Streaks", description: "Recompense zilnice pentru login consecutiv", enabled: true, category: "monetization", rolloutPercent: 100 },
  { id: "stripe_payments", name: "Stripe Payments", description: "Plăți prin Stripe (tokens, subscriptions, one-time)", enabled: true, category: "monetization", rolloutPercent: 100 },
  { id: "paypal_payments", name: "PayPal Payments", description: "Plăți prin PayPal (tokens, subscriptions)", enabled: true, category: "monetization", rolloutPercent: 100 },
  { id: "courier_shipping", name: "Courier Shipping", description: "Livrare prin curier (FanCourier, SameDay, Cargus)", enabled: true, category: "core", rolloutPercent: 100 },
  { id: "ads_display", name: "Ads Display", description: "Afișare reclame (AdSense, Carbon Ads, sponsori)", enabled: true, category: "monetization", rolloutPercent: 100 },
  { id: "auctions", name: "Licitații", description: "Mod licitație pentru obiecte (platinum)", enabled: false, category: "experimental", rolloutPercent: 0 },
  { id: "video_calls", name: "Video Calls", description: "Apeluri video pentru verificare înainte de întâlnire", enabled: false, category: "experimental", rolloutPercent: 0 },
  { id: "house_swap", name: "House Swap", description: "Schimb de locuințe", enabled: true, category: "core", rolloutPercent: 100 },
  { id: "service_swap", name: "Service Swap", description: "Schimb de servicii / time banking", enabled: true, category: "core", rolloutPercent: 100 },
];

/** Check if a flag is enabled (respects rollout percent using user ID hash) */
export function isFlagEnabled(flags: FeatureFlag[], flagId: string, userId?: string): boolean {
  const flag = flags.find((f) => f.id === flagId);
  if (!flag || !flag.enabled) return false;
  if (flag.rolloutPercent >= 100) return true;
  if (flag.rolloutPercent <= 0) return false;
  if (!userId) return false;
  const hash = hashUserId(userId);
  return hash % 100 < flag.rolloutPercent;
}

function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/* ─── In-Memory Cache (shared across hooks and server calls) ─── */

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

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

function mapDbRow(row: Record<string, unknown>): FeatureFlag {
  return {
    id: row.id as string,
    name: (row.name as string) || row.id as string,
    description: (row.description as string) || "",
    enabled: row.enabled as boolean,
    category: (row.category as FeatureFlag["category"]) || "core",
    rolloutPercent: (row.rollout_percent as number) ?? 100,
    allowedCountries: (row.allowed_countries as string[]) ?? undefined,
  };
}

async function fetchFlagsFromSupabase(): Promise<FeatureFlag[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return DEFAULT_FLAGS;

  try {
    const res = await fetch(`${url}/rest/v1/feature_flags?select=*`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      cache: "no-store",
    });
    if (!res.ok) return DEFAULT_FLAGS;
    const rows = (await res.json()) as Record<string, unknown>[];
    if (!Array.isArray(rows) || rows.length === 0) return DEFAULT_FLAGS;
    return rows.map(mapDbRow);
  } catch {
    return DEFAULT_FLAGS;
  }
}

/** Fetch flags with dedup + TTL cache */
export function loadFlags(): Promise<FeatureFlag[]> {
  const now = Date.now();
  if (now - flagCache.fetchedAt < CACHE_TTL_MS) {
    return Promise.resolve(flagCache.flags);
  }
  if (flagCache.promise) return flagCache.promise;

  flagCache.promise = fetchFlagsFromSupabase().then((flags) => {
    flagCache.flags = flags;
    flagCache.fetchedAt = Date.now();
    flagCache.promise = null;
    return flags;
  }).catch(() => {
    flagCache.promise = null;
    return flagCache.flags;
  });
  return flagCache.promise;
}

/** Invalidate cache (e.g. after admin toggle) */
export function invalidateFlagCache(): void {
  flagCache.fetchedAt = 0;
  flagCache.promise = null;
}

/* ─── Server-side: getFeatureFlag(key) ─── */

/**
 * Async function for Server Components / Route Handlers.
 * Reads from Supabase with the same 5-min cache.
 *
 * Usage: const enabled = await getFeatureFlag('stripe_payments');
 */
export async function getFeatureFlag(key: string, userId?: string): Promise<boolean> {
  const flags = await loadFlags();
  return isFlagEnabled(flags, key, userId);
}

/* ─── Cron Job Definitions ─── */

export interface CronJob {
  id: string;
  name: string;
  description: string;
  schedule: string;        // human-readable
  lastRun?: string;        // ISO date
  nextRun?: string;        // ISO date
  enabled: boolean;
  status: "idle" | "running" | "error";
}

export const DEFAULT_CRON_JOBS: CronJob[] = [
  {
    id: "daily_digest",
    name: "Digest Zilnic",
    description: "Trimite rezumat zilnic: match-uri noi, mesaje necitite, promoții active",
    schedule: "Zilnic la 09:00",
    enabled: true,
    status: "idle",
  },
  {
    id: "streak_reset",
    name: "Reset Streak-uri",
    description: "Verifică și resetează streak-urile utilizatorilor care nu s-au logat",
    schedule: "Zilnic la 00:00",
    enabled: true,
    status: "idle",
  },
  {
    id: "cleanup_expired",
    name: "Curățare Date Expirate",
    description: "Șterge rate_limit_entries vechi, featured listings expirate, promoții inactive",
    schedule: "Zilnic la 03:00",
    enabled: true,
    status: "idle",
  },
  {
    id: "recompute_stats",
    name: "Recalculare Statistici",
    description: "Recalculează statisticile globale: useri activi, swap-uri, tokens, metrici",
    schedule: "La fiecare 6 ore",
    enabled: true,
    status: "idle",
  },
  {
    id: "trust_score_refresh",
    name: "Refresh Trust Scores",
    description: "Recalculează scorurile de încredere pe baza activității recente",
    schedule: "Zilnic la 02:00",
    enabled: true,
    status: "idle",
  },
  {
    id: "inactive_reminder",
    name: "Reminder Inactivi",
    description: "Trimite notificare utilizatorilor inactivi de 7+ zile: 'Te așteptăm înapoi!'",
    schedule: "Săptămânal luni la 10:00",
    enabled: true,
    status: "idle",
  },
];

/* ─── Metrics Funnel ─── */

export interface MetricsFunnel {
  visitors: number;       // unique visitors
  signups: number;        // registered accounts
  itemsListed: number;    // users who listed ≥1 item
  chatStarted: number;    // users who opened ≥1 conversation
  swapProposed: number;   // users who proposed ≥1 swap
  swapCompleted: number;  // users who completed ≥1 swap
  retention7d: number;    // % users active after 7 days
  retention30d: number;   // % users active after 30 days
}

export interface DailyMetric {
  date: string;           // YYYY-MM-DD
  event: string;
  count: number;
}

/** Compute conversion rates from funnel */
export function computeFunnelRates(funnel: MetricsFunnel) {
  const safe = (num: number, den: number) => den > 0 ? Math.round((num / den) * 100) : 0;
  return {
    visitToSignup: safe(funnel.signups, funnel.visitors),
    signupToList: safe(funnel.itemsListed, funnel.signups),
    listToChat: safe(funnel.chatStarted, funnel.itemsListed),
    chatToPropose: safe(funnel.swapProposed, funnel.chatStarted),
    proposeToComplete: safe(funnel.swapCompleted, funnel.swapProposed),
    overallConversion: safe(funnel.swapCompleted, funnel.visitors),
  };
}

/** Default empty metrics */
export function defaultMetrics(): MetricsFunnel {
  return {
    visitors: 0, signups: 0, itemsListed: 0,
    chatStarted: 0, swapProposed: 0, swapCompleted: 0,
    retention7d: 0, retention30d: 0,
  };
}

/** Build metrics from current app state */
export function computeMetricsFromState(state: {
  totalUsers: number;
  usersWithItems: number;
  usersWithChats: number;
  usersWithSwaps: number;
  completedSwaps: number;
}): MetricsFunnel {
  return {
    visitors: state.totalUsers * 3, // estimated visitors = 3x registrations
    signups: state.totalUsers,
    itemsListed: state.usersWithItems,
    chatStarted: state.usersWithChats,
    swapProposed: state.usersWithSwaps,
    swapCompleted: state.completedSwaps,
    retention7d: 0,
    retention30d: 0,
  };
}
