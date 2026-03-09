"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Package, Search, MessageCircle, Repeat2, X, ChevronRight, ChevronLeft } from "lucide-react";

const ONBOARDING_KEY = "swaply_onboarding_done";

const STEPS = [
  { icon: Package, color: "from-emerald-500 to-teal-600", key: "step1" },
  { icon: Search, color: "from-blue-500 to-cyan-600", key: "step2" },
  { icon: MessageCircle, color: "from-violet-500 to-purple-600", key: "step3" },
  { icon: Repeat2, color: "from-amber-500 to-orange-600", key: "step4" },
] as const;

export function OnboardingTutorial() {
  const t = useTranslations("onboarding");
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.localStorage.getItem(ONBOARDING_KEY)) {
      // Reading from localStorage to initialize UI state is a valid pattern
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    window.localStorage.setItem(ONBOARDING_KEY, "true");
    setVisible(false);
  };

  if (!visible) return null;

  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-900">
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-3 top-3 rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center">
          <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${current.color} text-white shadow-lg`}>
            <Icon className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            {t(`${current.key}Title`)}
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            {t(`${current.key}Desc`)}
          </p>
        </div>

        {/* Step indicators */}
        <div className="mt-6 flex items-center justify-center gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === step ? "w-6 bg-blue-600" : "w-2 bg-zinc-200 dark:bg-zinc-700"
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
          >
            <ChevronLeft className="h-4 w-4" />
            {t("back")}
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {t("next")}
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={dismiss}
              className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              {t("start")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
