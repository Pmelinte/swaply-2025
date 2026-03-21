"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAppState } from "@/lib/state";
import { getSupabaseClient } from "@/lib/supabase/client";

export interface OnboardingProgress {
  stepProfile: boolean;
  stepFirstItem: boolean;
  stepFirstMatch: boolean;
  stepFirstSwap: boolean;
  stepVerified: boolean;
  completedAt: string | null;
}

const STEP_KEYS = [
  "stepProfile",
  "stepFirstItem",
  "stepFirstMatch",
  "stepFirstSwap",
  "stepVerified",
] as const;

export type OnboardingStep = (typeof STEP_KEYS)[number];

const DB_FIELD_MAP: Record<OnboardingStep, string> = {
  stepProfile: "step_profile",
  stepFirstItem: "step_first_item",
  stepFirstMatch: "step_first_match",
  stepFirstSwap: "step_first_swap",
  stepVerified: "step_verified",
};

const DEFAULT_PROGRESS: OnboardingProgress = {
  stepProfile: false,
  stepFirstItem: false,
  stepFirstMatch: false,
  stepFirstSwap: false,
  stepVerified: false,
  completedAt: null,
};

function mapRow(row: Record<string, unknown>): OnboardingProgress {
  return {
    stepProfile: (row.step_profile as boolean) ?? false,
    stepFirstItem: (row.step_first_item as boolean) ?? false,
    stepFirstMatch: (row.step_first_match as boolean) ?? false,
    stepFirstSwap: (row.step_first_swap as boolean) ?? false,
    stepVerified: (row.step_verified as boolean) ?? false,
    completedAt: (row.completed_at as string) ?? null,
  };
}

export function useOnboarding() {
  const { user } = useAppState();
  const userId = user?.id ?? null;
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  // Track which userId the current progress was fetched for
  const [fetchedForUser, setFetchedForUser] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Fetch onboarding_progress for current user
  useEffect(() => {
    if (!userId) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    let cancelled = false;

    supabase
      .from("onboarding_progress")
      .select(
        "step_profile, step_first_item, step_first_match, step_first_swap, step_verified, completed_at",
      )
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!mountedRef.current || cancelled) return;
        setProgress(
          data
            ? mapRow(data as Record<string, unknown>)
            : { ...DEFAULT_PROGRESS },
        );
        setFetchedForUser(userId);
      });

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`onboarding_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "onboarding_progress",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (!mountedRef.current || cancelled) return;
          setProgress(mapRow(payload.new as Record<string, unknown>));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const markStepComplete = useCallback(
    async (step: OnboardingStep) => {
      if (!user) return;
      const uid = user.id;
      if (!uid) return;
      const supabase = getSupabaseClient();
      if (!supabase) return;

      // Optimistic update
      setProgress((prev) => (prev ? { ...prev, [step]: true } : null));

      const dbField = DB_FIELD_MAP[step];
      await supabase
        .from("onboarding_progress")
        .upsert({ user_id: uid, [dbField]: true }, { onConflict: "user_id" });
    },
    [user],
  );

  const isStepComplete = useCallback(
    (step: OnboardingStep): boolean => {
      if (!effectiveProgress) return false;
      return effectiveProgress[step];
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [progress, userId, fetchedForUser],
  );

  // Derive loading and effective progress — no synchronous setState needed
  const loading = userId !== null && fetchedForUser !== userId;
  const effectiveProgress =
    userId && fetchedForUser === userId ? progress : null;

  const overallProgress = STEP_KEYS.filter(
    (k) => effectiveProgress?.[k] === true,
  ).length;

  const isCompleted = effectiveProgress?.completedAt != null;

  return {
    progress: effectiveProgress,
    loading,
    markStepComplete,
    isStepComplete,
    overallProgress,
    totalSteps: STEP_KEYS.length,
    isCompleted,
  };
}
