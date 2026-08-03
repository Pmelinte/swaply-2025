"use client";

import { useTranslations } from "next-intl";

const WIZARD_STEPS = 8;

const STEP_TITLE_KEYS = [
  "", // index 0 unused
  "step1Title",
  "step2Title",
  "step3Title",
  "step4Title",
  "step5Title",
  "step6Title",
  "step7Title",
  "step8Title",
] as const;

interface Props {
  step: number;
}

export function PropertyWizardProgress({ step }: Props) {
  const t = useTranslations("propertyWizard");
  const safeStep = Math.min(Math.max(1, step), WIZARD_STEPS);
  const titleKey = STEP_TITLE_KEYS[safeStep] ?? "step1Title";
  const progressLabel = t("progressStep", { current: safeStep });

  return (
    <div className="mb-8">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <h1 className="min-w-0 break-words text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {t(titleKey)}
        </h1>
        <span className="shrink-0 text-sm font-medium text-zinc-600 dark:text-zinc-400">
          {progressLabel}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={progressLabel}
        aria-valuemin={1}
        aria-valuemax={WIZARD_STEPS}
        aria-valuenow={safeStep}
        aria-valuetext={progressLabel}
        className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700"
      >
        <div
          className="h-full bg-blue-600 transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${(safeStep / WIZARD_STEPS) * 100}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between" aria-hidden="true">
        {Array.from({ length: WIZARD_STEPS }, (_, i) => i + 1).map(
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
