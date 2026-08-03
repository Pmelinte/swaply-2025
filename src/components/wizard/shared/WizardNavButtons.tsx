"use client";

import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

interface Props {
  step: number;
  totalSteps: number;
  loading: boolean;
  onBack: () => void;
  onNext: () => void;
  onPublish: () => void;
  publishLabel?: string;
}

export function WizardNavButtons({
  step,
  totalSteps,
  loading,
  onBack,
  onNext,
  onPublish,
  publishLabel,
}: Props) {
  const t = useTranslations("wizardShared");
  const isLast = step === totalSteps;
  const progressLabel = t("progressStep", {
    current: step,
    total: totalSteps,
  });

  return (
    <div
      role="group"
      aria-label={progressLabel}
      className="mt-6 flex flex-col gap-3 pb-[env(safe-area-inset-bottom)] sm:flex-row sm:items-center sm:justify-between"
    >
      <button
        type="button"
        onClick={onBack}
        disabled={step === 1 || loading}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 dark:focus-visible:ring-offset-zinc-900 sm:w-auto"
      >
        <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
        {t("back")}
      </button>

      {!isLast ? (
        <button
          type="button"
          onClick={onNext}
          disabled={loading}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 dark:focus-visible:ring-offset-zinc-900 sm:w-auto"
        >
          {t("next")}
          <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
        </button>
      ) : (
        <button
          type="button"
          onClick={onPublish}
          disabled={loading}
          aria-busy={loading}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-green-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 dark:focus-visible:ring-offset-zinc-900 sm:w-auto"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t("saving")}
            </>
          ) : (
            <>{publishLabel ?? t("publish")}</>
          )}
        </button>
      )}
    </div>
  );
}
