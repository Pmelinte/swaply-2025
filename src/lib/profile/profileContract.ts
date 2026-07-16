import { defaultLocale, locales, type Locale } from "@/i18n/config";
import type { LanguageFallbackRequest, TranslationSurface } from "@/lib/language-fallback/languageFallbackTypes";

export type ProfileUserType = "individual" | "professional" | "organization";
export type ProfileAvailabilityStatus = "available" | "limited" | "away";

export interface ProfileLanguagePreferences {
  primary: Locale;
  secondary: Locale | null;
  tertiary: Locale | null;
  autoTranslateMessages: boolean;
  showOriginalLanguage: boolean;
}

export interface ProfileVisibilityContract {
  publicProfile: boolean;
  itemsVisibility: "public" | "match_only";
  showExactLocation: boolean;
  showLastSeen: boolean;
  showBio: boolean;
  showInterests: boolean;
  showOccupation: boolean;
  showWebsite: boolean;
  showSocialLinks: boolean;
}

export interface GlobalProfileContract {
  userId: string;
  revision: number;
  languagePreferences: ProfileLanguagePreferences;
  userType: ProfileUserType;
  availabilityStatus: ProfileAvailabilityStatus;
  timezone: string;
  visibility: ProfileVisibilityContract;
  legacyLanguages: Locale[];
  preferredLocale: Locale;
}

export interface BuildProfileFallbackRequestOptions {
  availableLocales: string[];
  surface: TranslationSurface;
  routeLocale?: string | null;
  browserLocale?: string | null;
  sourceLocale?: string | null;
  defaultLocale?: string;
}

export interface ProfileUpdateInput {
  expectedRevision: number;
  idempotencyKey: string;
  payload: Record<string, unknown>;
}

export interface ProfileUpdateResult {
  replayed: boolean;
  profileRevision: number;
  profile: Record<string, unknown>;
}

const localeSet = new Set<string>(locales);
const userTypes = new Set<ProfileUserType>(["individual", "professional", "organization"]);
const availabilityStatuses = new Set<ProfileAvailabilityStatus>(["available", "limited", "away"]);

export const DEFAULT_PROFILE_VISIBILITY: ProfileVisibilityContract = {
  publicProfile: true,
  itemsVisibility: "public",
  showExactLocation: false,
  showLastSeen: true,
  showBio: false,
  showInterests: false,
  showOccupation: false,
  showWebsite: false,
  showSocialLinks: false,
};

export function normalizeProfileLocale(value: unknown): Locale | null {
  if (typeof value !== "string") return null;

  const normalized = value.trim().replace("_", "-").toLowerCase();
  if (!normalized) return null;
  if (localeSet.has(normalized)) return normalized as Locale;

  const family = normalized.split("-")[0];
  return localeSet.has(family) ? family as Locale : null;
}

export function normalizeProfileLanguagePreferences(
  row: Record<string, unknown>,
  routeLocale?: string | null,
): ProfileLanguagePreferences {
  const legacyLanguages = normalizeLocaleArray(row.languages);
  const candidates = [
    row.primary_language,
    row.preferred_locale,
    ...legacyLanguages,
    routeLocale,
    defaultLocale,
  ];

  const primary = firstDistinctLocale(candidates) ?? defaultLocale;
  const secondary = firstDistinctLocale(
    [row.secondary_language, ...legacyLanguages],
    new Set([primary]),
  );
  const tertiary = firstDistinctLocale(
    [row.tertiary_language, ...legacyLanguages],
    new Set([primary, ...(secondary ? [secondary] : [])]),
  );

  return {
    primary,
    secondary,
    tertiary,
    autoTranslateMessages: booleanValue(row.auto_translate_messages, true),
    showOriginalLanguage: booleanValue(row.show_original_language, false),
  };
}

export function mapGlobalProfileContract(
  row: Record<string, unknown>,
  routeLocale?: string | null,
): GlobalProfileContract {
  const languagePreferences = normalizeProfileLanguagePreferences(row, routeLocale);
  const visibility = objectValue(row.visibility);
  const legacyLanguages = distinctLocales([
    languagePreferences.primary,
    languagePreferences.secondary,
    languagePreferences.tertiary,
  ]);

  return {
    userId: stringValue(row.user_id, stringValue(row.id)),
    revision: positiveInteger(row.profile_revision, 1),
    languagePreferences,
    userType: profileUserType(row.user_type),
    availabilityStatus: profileAvailability(row.availability_status),
    timezone: stringValue(row.timezone, "UTC"),
    visibility: {
      publicProfile: booleanValue(visibility.publicProfile, DEFAULT_PROFILE_VISIBILITY.publicProfile),
      itemsVisibility: visibility.itemsVisibility === "match_only" ? "match_only" : "public",
      showExactLocation: booleanValue(visibility.showExactLocation, DEFAULT_PROFILE_VISIBILITY.showExactLocation),
      showLastSeen: booleanValue(visibility.showLastSeen, DEFAULT_PROFILE_VISIBILITY.showLastSeen),
      showBio: booleanValue(visibility.showBio, DEFAULT_PROFILE_VISIBILITY.showBio),
      showInterests: booleanValue(visibility.showInterests, DEFAULT_PROFILE_VISIBILITY.showInterests),
      showOccupation: booleanValue(visibility.showOccupation, DEFAULT_PROFILE_VISIBILITY.showOccupation),
      showWebsite: booleanValue(visibility.showWebsite, DEFAULT_PROFILE_VISIBILITY.showWebsite),
      showSocialLinks: booleanValue(visibility.showSocialLinks, DEFAULT_PROFILE_VISIBILITY.showSocialLinks),
    },
    legacyLanguages,
    preferredLocale: languagePreferences.primary,
  };
}

export function buildProfileLanguageFallbackRequest(
  profile: GlobalProfileContract,
  options: BuildProfileFallbackRequestOptions,
): LanguageFallbackRequest {
  return {
    primaryLocale: profile.languagePreferences.primary,
    secondaryLocale: profile.languagePreferences.secondary,
    tertiaryLocale: profile.languagePreferences.tertiary,
    routeLocale: options.routeLocale,
    browserLocale: options.browserLocale,
    sourceLocale: options.sourceLocale,
    availableLocales: options.availableLocales,
    defaultLocale: options.defaultLocale ?? defaultLocale,
    surface: options.surface,
  };
}

export function buildCanonicalLanguagePayload(
  preferences: ProfileLanguagePreferences,
): Record<string, unknown> {
  const primary = normalizeProfileLocale(preferences.primary);
  const secondary = normalizeProfileLocale(preferences.secondary);
  const tertiary = normalizeProfileLocale(preferences.tertiary);

  if (!primary) {
    throw new Error("A supported primary profile language is required.");
  }

  const ordered = distinctLocales([primary, secondary, tertiary]);
  if (ordered.length !== [primary, secondary, tertiary].filter(Boolean).length) {
    throw new Error("Profile languages must be distinct.");
  }

  return {
    primary_language: primary,
    secondary_language: secondary,
    tertiary_language: tertiary,
    auto_translate_messages: preferences.autoTranslateMessages,
    show_original_language: preferences.showOriginalLanguage,
  };
}

export function isValidIanaTimezone(value: string) {
  if (!value.trim()) return false;

  try {
    Intl.DateTimeFormat(undefined, { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

export function createProfileIdempotencyKey(prefix = "profile") {
  const randomId = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${prefix}:${randomId}`;
}

function normalizeLocaleArray(value: unknown): Locale[] {
  if (!Array.isArray(value)) return [];
  return distinctLocales(value.map(normalizeProfileLocale));
}

function distinctLocales(values: readonly (Locale | null | undefined)[]) {
  const seen = new Set<Locale>();
  const result: Locale[] = [];

  for (const value of values) {
    if (!value || seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }

  return result;
}

function firstDistinctLocale(
  values: readonly unknown[],
  excluded = new Set<Locale>(),
): Locale | null {
  for (const value of values) {
    const locale = normalizeProfileLocale(value);
    if (locale && !excluded.has(locale)) return locale;
  }

  return null;
}

function profileUserType(value: unknown): ProfileUserType {
  return typeof value === "string" && userTypes.has(value as ProfileUserType)
    ? value as ProfileUserType
    : "individual";
}

function profileAvailability(value: unknown): ProfileAvailabilityStatus {
  return typeof value === "string" && availabilityStatuses.has(value as ProfileAvailabilityStatus)
    ? value as ProfileAvailabilityStatus
    : "available";
}

function positiveInteger(value: unknown, fallback: number) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function booleanValue(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}
