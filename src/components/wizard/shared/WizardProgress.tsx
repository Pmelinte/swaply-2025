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

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{title}</h1>
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          {t("progressStep", { current: step, total: totalSteps })}
        </span>
      </div>
      <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${(step / totalSteps) * 100}%` }}
        />
      </div>
      <div className="flex justify-between mt-2">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
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
