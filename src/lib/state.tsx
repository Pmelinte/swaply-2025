"use client";

import { useCallback, useMemo } from "react";
import type { UserProfile } from "./types";
import { getSupabaseClient } from "./supabase/client";
import {
  isProfileConflict,
  ProfileServiceError,
} from "./profile/profileService";
import {
  mergeUserProfile,
  persistOwnProfileFields,
  persistUserProfile,
  reloadOwnUserProfile,
} from "./profile/userProfilePersistence";
import {
  AppStateProvider,
  computeMatchesForUser,
  computeTierBenefits,
  useAppState as useLegacyAppState,
} from "./state/index";

export { AppStateProvider, computeMatchesForUser, computeTierBenefits };

export interface ProfilePersistenceOptions {
  persist?: boolean;
  idempotencyKey?: string;
}

/**
 * Public state hook.
 *
 * Batch 65 keeps the large legacy state orchestrator intact, but replaces its
 * public profile persistence boundary. All external callers now reach the
 * revisioned `update_own_profile_v1` authority; the legacy direct table upsert
 * remains inaccessible through this module and is additionally denied by the
 * Batch 65 database grants.
 */
export function useAppState() {
  const legacy = useLegacyAppState();

  const refreshProfile = useCallback(async () => {
    const current = legacy.user;
    const client = getSupabaseClient();
    if (!current || !client) return null;

    const fresh = await reloadOwnUserProfile(client, current, legacy.language);
    if (fresh) {
      await legacy.updateProfile(fresh, { persist: false });
    }
    return fresh;
  }, [legacy.language, legacy.updateProfile, legacy.user]);

  const updateProfileFields = useCallback(
    async (
      payload: Record<string, unknown>,
      options: { idempotencyKey?: string } = {},
    ) => {
      const current = legacy.user;
      const client = getSupabaseClient();

      if (!current) {
        throw new ProfileServiceError("Cannot save profile: user not loaded yet.", {
          code: "PROFILE_NOT_LOADED",
        });
      }
      if (!client || legacy.dataSource !== "supabase") {
        throw new ProfileServiceError("Canonical profile persistence requires Supabase.", {
          code: "SUPABASE_UNAVAILABLE",
        });
      }

      try {
        const saved = await persistOwnProfileFields(client, current, payload, {
          idempotencyKey: options.idempotencyKey,
          routeLocale: legacy.language,
        });
        await legacy.updateProfile(saved, { persist: false });
        return saved;
      } catch (error) {
        if (isProfileConflict(error)) {
          await refreshProfile();
        }
        throw error;
      }
    },
    [legacy.dataSource, legacy.language, legacy.updateProfile, legacy.user, refreshProfile],
  );

  const updateProfile = useCallback(
    async (
      updates: Partial<UserProfile>,
      options: ProfilePersistenceOptions = {},
    ) => {
      const current = legacy.user;

      if (!options.persist || !current) {
        await legacy.updateProfile(updates, { persist: false });
        return;
      }

      const merged = mergeUserProfile(current, updates);
      const client = getSupabaseClient();

      if (!client || legacy.dataSource !== "supabase") {
        await legacy.updateProfile(merged, { persist: false });
        return;
      }

      try {
        const saved = await persistUserProfile(client, merged, {
          idempotencyKey: options.idempotencyKey,
          routeLocale: legacy.language,
        });
        await legacy.updateProfile(saved, { persist: false });
      } catch (error) {
        if (isProfileConflict(error)) {
          await refreshProfile();
        }
        throw error;
      }
    },
    [legacy.dataSource, legacy.language, legacy.updateProfile, legacy.user, refreshProfile],
  );

  return useMemo(
    () => ({
      ...legacy,
      updateProfile,
      updateProfileFields,
      refreshProfile,
    }),
    [legacy, refreshProfile, updateProfile, updateProfileFields],
  );
}
