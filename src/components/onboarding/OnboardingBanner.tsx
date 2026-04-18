"use client";

/**
 * OnboardingBanner — 4-step progress banner for new users.
 * Reads from Supabase table: onboarding_progress
 * Hidden when completed_at is not null.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAppState } from "@/lib/state";
import { getSupabaseClient } from "@/lib/supabase/client";
import {
  User,
  Package,
  Sparkles,
  Repeat2,
  Check,
  ChevronRight,
  X,
} from "lucide-react";

interface OnboardingProgress {
  stepProfile: boolean;
  stepFirstItem: boolean;
  stepFirstMatch: boolean;
  stepFirstSwap: boolean;
  currentStep: number;
  completedAt: string | null;
}

const STEPS = [
  {
    key: "profile" as const,
    field: "stepProfile" as const,
    icon: User,
    color: "from-blue-500 to-indigo-600",
    href: "/profile",
  },
  {
    key: "first_item" as const,
    field: "stepFirstItem" as const,
    icon: Package,
    color: "from-emerald-500 to-teal-600",
    href: "/objects/new",
  },
  {
    key: "first_match" as const,
    field: "stepFirstMatch" as const,
    icon: Sparkles,
    color: "from-violet-500 to-purple-600",
    href: "/matching",
  },
  {
    key: "first_swap" as const,
    field: "stepFirstSwap" as const,
    icon: Repeat2,
    color: "from-amber-500 to-orange-600",
    href: "/exchange",
  },
] as const;

const STEP_LABEL_KEYS: Record<string, { title: string; action: string }> = {
  profile: { title: "profileTitle", action: "profileAction" },
  first_item: { title: "firstItemTitle", action: "firstItemAction" },
  first_match: { title: "firstMatchTitle", action: "firstMatchAction" },
  first_swap: { title: "firstSwapTitle", action: "firstSwapAction" },
};

export function OnboardingBanner() {
  const t = useTranslations("onboardingBanner");
  const { user } = useAppState();
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    supabase
      .from("onboarding_progress")
      .select("step_profile, step_first_item, step_first_match, step_first_swap, current_step, completed_at")
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
            currentStep: data.current_step ?? 1,
            completedAt: data.completed_at ?? null,
          });
        } else {
          // No row yet — show onboarding from step 1
          setProgress({
            stepProfile: false,
            stepFirstItem: false,
            stepFirstMatch: false,
            stepFirstSwap: false,
            currentStep: 1,
            completedAt: null,
          });
        }
      });
  }, [user?.id]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  // Don't render if: no user, no progress loaded, already completed, or dismissed
  if (!user || !progress || progress.completedAt || dismissed) return null;

  const completedCount = STEPS.filter((s) => progress[s.field]).length;
  const currentStepIdx = STEPS.findIndex((s) => !progress[s.field]);
  const activeStep = currentStepIdx >= 0 ? currentStepIdx : STEPS.length - 1;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 via-white to-indigo-50 p-4 shadow-sm dark:border-blue-900 dark:from-blue-950/30 dark:via-zinc-900 dark:to-indigo-950/30 sm:p-5">
      {/* Dismiss */}
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-2 top-2 rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Header */}
      <div className="mb-4">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
          {t("welcome")}
        </h3>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          {t("stepsCompleted", { completed: completedCount, total: STEPS.length })}
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
          style={{ width: `${(completedCount / STEPS.length) * 100}%` }}
        />
      </div>

      {/* Steps */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STEPS.map((step, idx) => {
          const isCompleted = progress[step.field];
          const isCurrent = idx === activeStep;
          const Icon = step.icon;
          const labelKeys = STEP_LABEL_KEYS[step.key];

          return (
            <div
              key={step.key}
              className={`relative rounded-xl border p-3 transition-all ${
                isCompleted
                  ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20"
                  : isCurrent
                    ? "border-blue-300 bg-blue-50 shadow-sm dark:border-blue-700 dark:bg-blue-950/30"
                    : "border-zinc-200 bg-zinc-50/50 opacity-50 dark:border-zinc-700 dark:bg-zinc-800/30"
              }`}
            >
              <div className="flex items-center gap-2">
                {isCompleted ? (
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-white">
                    <Check className="h-4 w-4" />
                  </div>
                ) : (
                  <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${step.color} text-white`}>
                    <Icon className="h-4 w-4" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-xs font-semibold ${
                    isCompleted
                      ? "text-emerald-700 dark:text-emerald-300"
                      : "text-zinc-700 dark:text-zinc-200"
                  }`}>
                    {t(labelKeys.title)}
                  </p>
                </div>
              </div>

              {isCurrent && !isCompleted && (
                <Link
                  href={step.href}
                  className="mt-2 flex items-center justify-center gap-1 rounded-lg bg-blue-600 px-2 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-700"
                >
                  {t(labelKeys.action)}
                  <ChevronRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
