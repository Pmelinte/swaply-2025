"use client";

/**
 * OnboardingChecklist — floating card (bottom-right) with 5-step interactive
 * onboarding for new users. Visible only when onboarding_completed = false.
 * Awards +10 tokens per step, +50 bonus on completion (via DB trigger).
 */

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  User,
  Package,
  Sparkles,
  Repeat2,
  ShieldCheck,
  Check,
  ChevronRight,
  X,
  Minimize2,
  Maximize2,
  Coins,
  PartyPopper,
} from "lucide-react";
import { useOnboarding } from "@/hooks/useOnboarding";
import type { OnboardingStep } from "@/hooks/useOnboarding";
import { useAppState } from "@/lib/state";

// Pre-computed at module level to avoid impure Math.random() during render
const CONFETTI_SEEDS = Array.from({ length: 20 }, () => ({
  duration: 1.5 + Math.random() * 2,
  delay: Math.random() * 0.5,
  translateX: (Math.random() - 0.5) * 200,
}));

interface StepDef {
  key: OnboardingStep;
  labelKey: string;
  descKey: string;
  href: string;
  icon: typeof User;
  color: string;
}

const STEPS: StepDef[] = [
  {
    key: "stepProfile",
    labelKey: "stepProfileLabel",
    descKey: "stepProfileDesc",
    href: "/profile",
    icon: User,
    color: "from-blue-500 to-indigo-600",
  },
  {
    key: "stepFirstItem",
    labelKey: "stepFirstItemLabel",
    descKey: "stepFirstItemDesc",
    href: "/my-objects",
    icon: Package,
    color: "from-emerald-500 to-teal-600",
  },
  {
    key: "stepFirstMatch",
    labelKey: "stepFirstMatchLabel",
    descKey: "stepFirstMatchDesc",
    href: "/matching",
    icon: Sparkles,
    color: "from-violet-500 to-purple-600",
  },
  {
    key: "stepFirstSwap",
    labelKey: "stepFirstSwapLabel",
    descKey: "stepFirstSwapDesc",
    href: "/exchange",
    icon: Repeat2,
    color: "from-amber-500 to-orange-600",
  },
  {
    key: "stepVerified",
    labelKey: "stepVerifiedLabel",
    descKey: "stepVerifiedDesc",
    href: "/profile#verify",
    icon: ShieldCheck,
    color: "from-rose-500 to-pink-600",
  },
];

export function OnboardingChecklist() {
  const t = useTranslations("onboardingChecklist");
  const { user } = useAppState();
  const {
    progress,
    loading,
    overallProgress,
    totalSteps,
    isCompleted,
    markStepComplete,
  } = useOnboarding();

  const [minimized, setMinimized] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [confettiExpired, setConfettiExpired] = useState(false);

  // Derive completion state — no synchronous setState needed
  const allStepsDone = overallProgress === totalSteps;
  const justCompleted = allStepsDone && !dismissed;
  const showConfetti = allStepsDone && !confettiExpired && !dismissed;

  // Auto-dismiss confetti after 5s (setState only inside setTimeout = async)
  useEffect(() => {
    if (!allStepsDone) return;
    // Expand minimized card immediately via microtask
    const raf = requestAnimationFrame(() => setMinimized(false));
    const timer = setTimeout(() => setConfettiExpired(true), 5000);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [allStepsDone]);

  const handleMinimize = useCallback(() => {
    setMinimized((prev) => !prev);
  }, []);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  // Don't render if: no user, loading, already completed (from DB), or dismissed
  if (!user || loading || (isCompleted && !justCompleted) || dismissed)
    return null;
  if (!progress) return null;

  const percentage = Math.round((overallProgress / totalSteps) * 100);

  // Celebration state (5/5 just completed)
  if (justCompleted) {
    return (
      <div className="fixed bottom-4 right-4 z-50 w-80 sm:w-96">
        {/* Confetti effect */}
        {showConfetti && (
          <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2">
            <div className="flex gap-1">
              {CONFETTI_SEEDS.map((seed, i) => (
                <span
                  key={i}
                  className="inline-block h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: [
                      "#f59e0b",
                      "#3b82f6",
                      "#10b981",
                      "#8b5cf6",
                      "#ef4444",
                      "#ec4899",
                    ][i % 6],
                    animation: `confetti-fall ${seed.duration}s ease-in ${seed.delay}s forwards`,
                    transform: `translateX(${seed.translateX}px)`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-yellow-50 p-5 shadow-xl dark:border-amber-800 dark:from-amber-950/40 dark:via-zinc-900 dark:to-yellow-950/30">
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute right-2 top-2 rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex flex-col items-center text-center">
            <PartyPopper className="mb-2 h-10 w-10 text-amber-500" />
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {t("completionTitle")}
            </h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {t("completionMessage")}
            </p>
            <div className="mt-3 flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 dark:bg-amber-900/40">
              <Coins className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-bold text-amber-700 dark:text-amber-300">
                {t("completionBonus")}
              </span>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes confetti-fall {
            0% {
              opacity: 1;
              transform: translateY(0) rotate(0deg);
            }
            100% {
              opacity: 0;
              transform: translateY(120px) rotate(720deg);
            }
          }
        `}</style>
      </div>
    );
  }

  // Minimized state
  if (minimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          type="button"
          onClick={handleMinimize}
          className="flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2.5 shadow-lg transition-all hover:shadow-xl dark:border-blue-800 dark:bg-zinc-900"
        >
          <div className="relative h-8 w-8">
            <svg className="h-8 w-8 -rotate-90" viewBox="0 0 32 32">
              <circle
                cx="16"
                cy="16"
                r="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-zinc-200 dark:text-zinc-700"
              />
              <circle
                cx="16"
                cy="16"
                r="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeDasharray={`${(percentage / 100) * 88} 88`}
                strokeLinecap="round"
                className="text-blue-500"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-blue-600 dark:text-blue-400">
              {overallProgress}/{totalSteps}
            </span>
          </div>
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("minimizedLabel")}
          </span>
          <Maximize2 className="h-3.5 w-3.5 text-zinc-400" />
        </button>
      </div>
    );
  }

  // Full checklist
  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 sm:w-96">
      <div className="overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-xl dark:border-blue-900 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 dark:border-zinc-800 dark:from-blue-950/30 dark:to-indigo-950/30">
          <div className="flex-1">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              {t("title")}
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {t("completed", { current: overallProgress, total: totalSteps })}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleMinimize}
              className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
            >
              <Minimize2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-4 pt-3">
          <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-700 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-1 px-3 py-3">
          {STEPS.map((step) => {
            const completed = progress[step.key];
            const Icon = step.icon;

            return (
              <Link
                key={step.key}
                href={step.href}
                onClick={() => {
                  if (step.key === "stepFirstMatch" && !completed) {
                    markStepComplete("stepFirstMatch");
                  }
                }}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${
                  completed
                    ? "bg-emerald-50/60 dark:bg-emerald-950/20"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                }`}
              >
                {/* Checkbox / Icon */}
                {completed ? (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white">
                    <Check className="h-4 w-4" />
                  </div>
                ) : (
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${step.color} text-white opacity-80 transition-opacity group-hover:opacity-100`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                )}

                {/* Label */}
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-medium ${
                      completed
                        ? "text-emerald-700 line-through decoration-emerald-300 dark:text-emerald-400 dark:decoration-emerald-700"
                        : "text-zinc-700 dark:text-zinc-200"
                    }`}
                  >
                    {t(step.labelKey)}
                  </p>
                  {!completed && (
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                      {t(step.descKey)}
                    </p>
                  )}
                </div>

                {/* Token reward */}
                <div className="flex shrink-0 items-center gap-1">
                  {completed ? (
                    <span className="text-[11px] font-medium text-emerald-500 dark:text-emerald-400">
                      +10
                    </span>
                  ) : (
                    <>
                      <Coins className="h-3 w-3 text-amber-400" />
                      <span className="text-[11px] font-medium text-amber-500 dark:text-amber-400">
                        +10
                      </span>
                    </>
                  )}

                  {!completed && (
                    <ChevronRight className="ml-1 h-3.5 w-3.5 text-zinc-300 transition-transform group-hover:translate-x-0.5 dark:text-zinc-600" />
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Bonus footer */}
        <div className="border-t border-zinc-100 bg-zinc-50/50 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-800/30">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
              {t("bonusLabel")}
            </p>
            <div className="flex items-center gap-1">
              <Coins className="h-3 w-3 text-amber-400" />
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                +50 tokens
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
