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

export function useOnboarding() {
  const { user } = useAppState();
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Fetch onboarding_progress for current user
  useEffect(() => {
    if (!user?.id) {
      setProgress(null);
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    supabase
      .from("onboarding_progress")
      .select(
        "step_profile, step_first_item, step_first_match, step_first_swap, step_verified, completed_at",
      )
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!mountedRef.current) return;
        if (data) {
          setProgress({
            stepProfile: data.step_profile ?? false,
            stepFirstItem: data.step_first_item ?? false,
            stepFirstMatch: data.step_first_match ?? false,
            stepFirstSwap: data.step_first_swap ?? false,
            stepVerified: data.step_verified ?? false,
            completedAt: data.completed_at ?? null,
          });
        } else {
          setProgress({ ...DEFAULT_PROGRESS });
        }
        setLoading(false);
      });

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`onboarding_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "onboarding_progress",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (!mountedRef.current) return;
          const row = payload.new as Record<string, unknown>;
          setProgress({
            stepProfile: (row.step_profile as boolean) ?? false,
            stepFirstItem: (row.step_first_item as boolean) ?? false,
            stepFirstMatch: (row.step_first_match as boolean) ?? false,
            stepFirstSwap: (row.step_first_swap as boolean) ?? false,
            stepVerified: (row.step_verified as boolean) ?? false,
            completedAt: (row.completed_at as string) ?? null,
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const markStepComplete = useCallback(
    async (step: OnboardingStep) => {
      if (!user?.id) return;
      const supabase = getSupabaseClient();
      if (!supabase) return;

      // Optimistic update
      setProgress((prev) => (prev ? { ...prev, [step]: true } : null));

      const dbField = DB_FIELD_MAP[step];
      await supabase
        .from("onboarding_progress")
        .upsert(
          { user_id: user.id, [dbField]: true },
          { onConflict: "user_id" },
        );
    },
    [user?.id],
  );

  const isStepComplete = useCallback(
    (step: OnboardingStep): boolean => {
      if (!progress) return false;
      return progress[step];
    },
    [progress],
  );

  const overallProgress = STEP_KEYS.filter(
    (k) => progress?.[k] === true,
  ).length;

  const isCompleted = progress?.completedAt != null;

  return {
    progress,
    loading,
    markStepComplete,
    isStepComplete,
    overallProgress,
    totalSteps: STEP_KEYS.length,
    isCompleted,
  };
}
