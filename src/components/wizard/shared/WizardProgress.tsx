"use client";

import { useTranslations } from "next-intl";

interface Props {
  step: number;
  totalSteps: number;
  title: string;
  namespace?: string;
}

export function WizardProgress({ step, totalSteps, title }: Props) {
  const t = useTranslations("wizardShared");
  const safeTotalSteps = Math.max(1, totalSteps);
  const safeStep = Math.min(Math.max(1, step), safeTotalSteps);
  const progressLabel = t("progressStep", {
    current: safeStep,
    total: safeTotalSteps,
  });

  return (
    <div className="mb-8">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <h1 className="min-w-0 break-words text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {title}
        </h1>
        <span className="shrink-0 text-sm font-medium text-zinc-600 dark:text-zinc-400">
          {progressLabel}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={progressLabel}
        aria-valuemin={1}
        aria-valuemax={safeTotalSteps}
        aria-valuenow={safeStep}
        aria-valuetext={progressLabel}
        className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700"
      >
        <div
          className="h-full bg-blue-600 transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${(safeStep / safeTotalSteps) * 100}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between" aria-hidden="true">
        {Array.from({ length: safeTotalSteps }, (_, i) => i + 1).map(
          (stepNumber) => (
            <span
              key={stepNumber}
              className={`h-1.5 w-1.5 rounded-full transition-colors motion-reduce:transition-none ${
                stepNumber <= safeStep
                  ? "bg-blue-600"
                  : "bg-zinc-300 dark:bg-zinc-600"
              }`}
            />
          ),
        )}
      </div>
    </div>
  );
}
