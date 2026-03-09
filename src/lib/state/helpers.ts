/**
 * Shared utility functions for state management.
 * Extracted from the monolithic state.tsx for modularity.
 */
import type {
  FeatureToggle,
  Notification,
  SwapIntent,
  TierBenefits,
  UserProfile,
} from "../types";
import { mockFeatureToggles } from "../mock-data";

// ── Safe type coercion helpers ──

export const safeString = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

export const safeBoolean = (value: unknown, fallback = false) =>
  typeof value === "boolean" ? value : fallback;

export const safeArray = <T,>(value: unknown, fallback: T[]) =>
  Array.isArray(value) ? (value as T[]) : fallback;

export const safeObject = <T extends object>(value: unknown, fallback: T) =>
  value && typeof value === "object" ? (value as T) : fallback;

export const safeBadgeTier = (value: unknown, fallback: UserProfile["badge"] = "free") =>
  value === "free" || value === "premium" || value === "platinum"
    ? value
    : fallback;

export const safeNotificationPriority = (
  value: unknown,
  fallback: Notification["priority"] = "info",
) => (value === "info" || value === "warning" || value === "success" ? value : fallback);

export const safeSwapStatus = (
  value: unknown,
  fallback: SwapIntent["status"] = "proposed",
) =>
  value === "proposed" ||
  value === "scheduled" ||
  value === "in_progress" ||
  value === "completed" ||
  value === "cancelled" ||
  value === "disputed"
    ? value
    : fallback;

export const safeLocationType = (
  value: unknown,
  fallback: SwapIntent["logistics"]["locationType"] = "public_spot",
) => (value === "public_spot" || value === "courier" || value === "pickup" ? value : fallback);

// ── Session management ──

export const SESSION_KEY = "swaply_logged_in";

export function setLoggedIn(value: boolean) {
  if (typeof window === "undefined") return;
  if (value) {
    window.localStorage.setItem(SESSION_KEY, "true");
  } else {
    window.localStorage.removeItem(SESSION_KEY);
  }
}

// ── Feature toggles ──

export function computeFeatureToggles(): FeatureToggle {
  const aiEnabled =
    process.env.NEXT_PUBLIC_HF_ENABLED === "true" || mockFeatureToggles.aiEnabled;
  const mapsEnabled =
    process.env.NEXT_PUBLIC_MAPS_TOKEN?.length === 0
      ? mockFeatureToggles.mapsEnabled
      : Boolean(process.env.NEXT_PUBLIC_MAPS_TOKEN);
  const cloudinaryEnabled = Boolean(
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
      mockFeatureToggles.cloudinaryEnabled,
  );
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  return { aiEnabled, mapsEnabled, cloudinaryEnabled, supabaseConfigured };
}

// ── Tier benefits ──

export function computeTierBenefits(badge: UserProfile["badge"]): TierBenefits {
  switch (badge) {
    case "platinum":
      return {
        mapPinVisible: true, priorityMatching: true, aiSuggestions: true,
        swapAnalytics: true, profileBadge: true, prioritySupport: true,
        monthlyTokens: 999, boostSlots: 5, adFree: true,
        extendedFilters: true, exportReports: true, auctionMode: true,
        itemLimit: 999, featuredSlots: 3,
      };
    case "premium":
      return {
        mapPinVisible: true, priorityMatching: true, aiSuggestions: true,
        swapAnalytics: true, profileBadge: false, prioritySupport: false,
        monthlyTokens: 50, boostSlots: 2, adFree: true,
        extendedFilters: true, exportReports: false, auctionMode: false,
        itemLimit: 50, featuredSlots: 1,
      };
    default:
      return {
        mapPinVisible: false, priorityMatching: false, aiSuggestions: false,
        swapAnalytics: false, profileBadge: false, prioritySupport: false,
        monthlyTokens: 10, boostSlots: 0, adFree: false,
        extendedFilters: false, exportReports: false, auctionMode: false,
        itemLimit: 10, featuredSlots: 0,
      };
  }
}

// ── DM conversation ID helpers ──

export function makeDmConversationId(a: string, b: string) {
  const [left, right] = [a, b].sort();
  return `dm:${left}:${right}`;
}

export function parseDmConversationId(conversationId: string) {
  const parts = conversationId.split(":");
  if (parts.length !== 3) return null;
  if (parts[0] !== "dm") return null;
  const [, a, b] = parts;
  if (!a || !b) return null;
  return { a, b };
}
