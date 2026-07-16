import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserProfile } from "@/lib/types";
import { createMapProfile } from "@/lib/state/mappers";
import {
  buildCanonicalLanguagePayload,
  mapGlobalProfileContract,
  type GlobalProfileContract,
} from "./profileContract";
import type { GlobalUserProfile } from "./profileTypes";
import {
  fetchOwnGlobalProfile,
  updateOwnGlobalProfile,
  type UpdateOwnProfileResult,
} from "./profileService";

export interface PersistProfileOptions {
  idempotencyKey?: string;
  routeLocale?: string | null;
}

export function getGlobalProfileContract(
  profile: UserProfile,
  routeLocale?: string | null,
): GlobalProfileContract {
  const candidate = profile as Partial<GlobalUserProfile>;
  if (candidate.globalProfile) return candidate.globalProfile;

  return mapGlobalProfileContract(
    {
      user_id: profile.id,
      profile_revision: candidate.profileRevision ?? 1,
      languages: profile.languages,
      preferred_locale: profile.languages[0],
      visibility: profile.visibility,
    },
    routeLocale,
  );
}

export function getProfileRevision(profile: UserProfile | null | undefined) {
  if (!profile) return 1;
  return getGlobalProfileContract(profile).revision;
}

export function mergeUserProfile(
  current: UserProfile,
  updates: Partial<UserProfile>,
): UserProfile {
  const currentGlobal = (current as Partial<GlobalUserProfile>).globalProfile;
  const updateGlobal = (updates as Partial<GlobalUserProfile>).globalProfile;

  return {
    ...current,
    ...updates,
    location: updates.location
      ? { ...(current.location ?? {}), ...updates.location }
      : current.location,
    visibility: updates.visibility
      ? { ...current.visibility, ...updates.visibility }
      : current.visibility,
    notifications: updates.notifications
      ? { ...current.notifications, ...updates.notifications }
      : current.notifications,
    swapPreferences: updates.swapPreferences
      ? { ...current.swapPreferences, ...updates.swapPreferences }
      : current.swapPreferences,
    security: updates.security
      ? { ...current.security, ...updates.security }
      : current.security,
    stats: updates.stats
      ? { ...current.stats, ...updates.stats }
      : current.stats,
    ...(currentGlobal || updateGlobal
      ? {
          globalProfile: {
            ...(currentGlobal ?? getGlobalProfileContract(current)),
            ...(updateGlobal ?? {}),
            languagePreferences: {
              ...(currentGlobal ?? getGlobalProfileContract(current)).languagePreferences,
              ...(updateGlobal?.languagePreferences ?? {}),
            },
            visibility: {
              ...(currentGlobal ?? getGlobalProfileContract(current)).visibility,
              ...(updateGlobal?.visibility ?? {}),
            },
          },
        }
      : {}),
  } as UserProfile;
}

export function buildUserProfileUpdatePayload(
  profile: UserProfile,
  routeLocale?: string | null,
): Record<string, unknown> {
  const contract = getGlobalProfileContract(profile, routeLocale);
  const location = profile.location ?? {};

  return {
    username: profile.username ?? null,
    full_name: profile.fullName ?? profile.displayName,
    display_name: profile.displayName,
    first_name: profile.firstName ?? null,
    avatar_url: profile.avatarUrl ?? null,
    bio: profile.bio ?? null,
    ...buildCanonicalLanguagePayload(contract.languagePreferences),
    location,
    location_text: [location.city, location.country].filter(Boolean).join(", ") || null,
    visibility: {
      ...profile.visibility,
      ...contract.visibility,
    },
    notifications: profile.notifications,
    swap_preferences: profile.swapPreferences,
    user_type: contract.userType,
    availability_status: contract.availabilityStatus,
    timezone: contract.timezone,
  };
}

export async function persistUserProfile(
  client: SupabaseClient,
  profile: UserProfile,
  options: PersistProfileOptions = {},
): Promise<GlobalUserProfile> {
  const result = await updateOwnGlobalProfile(client, {
    expectedRevision: getProfileRevision(profile),
    payload: buildUserProfileUpdatePayload(profile, options.routeLocale),
    idempotencyKey: options.idempotencyKey,
    routeLocale: options.routeLocale,
  });

  return mapResult(profile, result);
}

export async function persistOwnProfileFields(
  client: SupabaseClient,
  currentProfile: UserProfile,
  payload: Record<string, unknown>,
  options: PersistProfileOptions = {},
): Promise<GlobalUserProfile> {
  const result = await updateOwnGlobalProfile(client, {
    expectedRevision: getProfileRevision(currentProfile),
    payload,
    idempotencyKey: options.idempotencyKey,
    routeLocale: options.routeLocale,
  });

  return mapResult(currentProfile, result);
}

export async function reloadOwnUserProfile(
  client: SupabaseClient,
  currentProfile: UserProfile,
  routeLocale?: string | null,
): Promise<GlobalUserProfile | null> {
  const fresh = await fetchOwnGlobalProfile(client, currentProfile.id, {
    routeLocale,
  });

  if (!fresh) return null;
  return createMapProfile({ current: currentProfile })(fresh.row);
}

function mapResult(
  currentProfile: UserProfile,
  result: UpdateOwnProfileResult,
): GlobalUserProfile {
  return createMapProfile({ current: currentProfile })(result.profileRow);
}
