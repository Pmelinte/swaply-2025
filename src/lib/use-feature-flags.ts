"use client";

/**
 * Client-side React hooks for feature flags.
 *
 * useFeatureFlag(key)  — returns boolean, cached 5 min
 * useFeatureFlags()    — returns all flags + helpers (used by AppStateProvider)
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { FeatureFlag } from "./feature-flags";
import { flagCache, isFlagEnabled, invalidateFlagCache, loadFlags } from "./feature-flags";

/**
 * Hook to check if a single feature flag is enabled.
 * Reads from Supabase `feature_flags` table with 5-minute in-memory cache.
 * Falls back to DEFAULT_FLAGS when Supabase is unavailable.
 *
 * Usage: const enabled = useFeatureFlag('stripe_payments');
 */
export function useFeatureFlag(key: string, userId?: string): boolean {
  const [flags, setFlags] = useState<FeatureFlag[]>(flagCache.flags);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    loadFlags().then((loaded) => {
      if (mountedRef.current) setFlags(loaded);
    });
    return () => { mountedRef.current = false; };
  }, []);

  return isFlagEnabled(flags, key, userId);
}

/**
 * Hook that returns all flags + helpers.
 * Used by AppStateProvider to expose flags to the rest of the app.
 */
export function useFeatureFlags(userId?: string) {
  const [flags, setFlags] = useState<FeatureFlag[]>(flagCache.flags);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    loadFlags().then((loaded) => {
      if (mountedRef.current) setFlags(loaded);
    });
    return () => { mountedRef.current = false; };
  }, []);

  const isEnabled = useCallback(
    (key: string) => isFlagEnabled(flags, key, userId),
    [flags, userId],
  );

  const setFlag = useCallback((flagId: string, enabled: boolean) => {
    setFlags((prev) => prev.map((f) => f.id === flagId ? { ...f, enabled } : f));
    invalidateFlagCache();
  }, []);

  return { flags, isEnabled, setFlag };
}
