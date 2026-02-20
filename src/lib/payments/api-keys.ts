/**
 * API Key management for Swaply White-Label / API Access.
 * Revenue model: €99/mo (10k req), €299/mo (100k req), pay-per-swap (€0.10-0.50).
 *
 * Keys stored in Supabase table `api_keys`.
 * Rate limiting via `api_usage` table.
 */

import { nanoid } from "nanoid";

// ── Types ──

export type ApiTier = "starter" | "business" | "enterprise";

export interface ApiKey {
  id: string;
  key: string;           // sk_live_... or sk_test_...
  ownerId: string;       // Swaply user ID
  name: string;          // "My App"
  tier: ApiTier;
  monthlyLimit: number;  // requests per month
  currentUsage: number;
  perSwapFee: number;    // EUR
  active: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface ApiUsageEntry {
  id: string;
  apiKeyId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseMs: number;
  createdAt: string;
}

// ── Tier Definitions ──

export const API_TIERS: Record<ApiTier, { name: string; monthlyPriceEur: number; requestLimit: number; perSwapFee: number; features: string[] }> = {
  starter: {
    name: "API Starter",
    monthlyPriceEur: 99,
    requestLimit: 10_000,
    perSwapFee: 0.50,
    features: [
      "10.000 requests/lună",
      "Matching API",
      "Items CRUD",
      "Webhook notifications",
    ],
  },
  business: {
    name: "API Business",
    monthlyPriceEur: 299,
    requestLimit: 100_000,
    perSwapFee: 0.25,
    features: [
      "100.000 requests/lună",
      "Tot din Starter +",
      "Trust Score API",
      "Analytics API",
      "Priority support",
    ],
  },
  enterprise: {
    name: "API Enterprise",
    monthlyPriceEur: 499,
    requestLimit: 1_000_000,
    perSwapFee: 0.10,
    features: [
      "1M requests/lună",
      "Tot din Business +",
      "White-label branding",
      "Custom domain",
      "SLA 99.9%",
      "Dedicated support",
    ],
  },
};

// ── Key Generation ──

export function generateApiKey(mode: "live" | "test" = "live"): string {
  const prefix = mode === "live" ? "sk_live_" : "sk_test_";
  return `${prefix}${nanoid(32)}`;
}

// ── Rate Limiting ──

export function isRateLimited(key: ApiKey): boolean {
  return key.currentUsage >= key.monthlyLimit;
}

export function remainingRequests(key: ApiKey): number {
  return Math.max(0, key.monthlyLimit - key.currentUsage);
}

/** Validate API key format. */
export function isValidKeyFormat(key: string): boolean {
  return /^sk_(live|test)_[A-Za-z0-9_-]{20,}$/.test(key);
}

// ── Revenue Calculation ──

export function estimateMonthlyRevenue(keys: ApiKey[]): {
  subscriptionRevenue: number;
  transactionRevenue: number;
  totalRevenue: number;
} {
  let subscriptionRevenue = 0;
  let transactionRevenue = 0;

  for (const key of keys) {
    if (!key.active) continue;
    const tier = API_TIERS[key.tier];
    subscriptionRevenue += tier.monthlyPriceEur;
    // Estimate: ~1% of requests result in a swap
    const estimatedSwaps = Math.floor(key.currentUsage * 0.01);
    transactionRevenue += estimatedSwaps * key.perSwapFee;
  }

  return {
    subscriptionRevenue,
    transactionRevenue,
    totalRevenue: subscriptionRevenue + transactionRevenue,
  };
}
