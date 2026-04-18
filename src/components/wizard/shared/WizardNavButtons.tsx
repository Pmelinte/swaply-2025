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

  return (
    <div className="mt-6 flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={onBack}
        disabled={step === 1 || loading}
        className="flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition"
      >
        <ChevronLeft className="h-4 w-4" />
        {t("back")}
      </button>

      {!isLast ? (
        <button
          type="button"
          onClick={onNext}
          disabled={loading}
          className="flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {t("next")}
          <ChevronRight className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={onPublish}
          disabled={loading}
          className="flex items-center gap-2 rounded-full bg-green-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("saving")}
            </>
          ) : (
            <>✅ {publishLabel ?? t("publish")}</>
          )}
        </button>
      )}
    </div>
  );
}
