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

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {t(STEP_TITLE_KEYS[step])}
        </h1>
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          {t("progressStep", { current: step })}
        </span>
      </div>
      <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${(step / WIZARD_STEPS) * 100}%` }}
        />
      </div>
      {/* Step dots */}
      <div className="flex justify-between mt-2">
        {Array.from({ length: WIZARD_STEPS }, (_, i) => i + 1).map((s) => (
          <div
            key={s}
            className={`h-1.5 w-1.5 rounded-full transition ${
              s <= step ? "bg-blue-600" : "bg-zinc-300 dark:bg-zinc-600"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
