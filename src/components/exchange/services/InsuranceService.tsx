"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface Props {
  onSave: (details: Record<string, unknown>, cost?: number) => Promise<void>;
}

const PLANS = [
  { key: "basic",    costEur: 1.99, coverageKey: "coverageBasic" },
  { key: "standard", costEur: 3.99, coverageKey: "coverageStandard" },
  { key: "premium",  costEur: 7.99, coverageKey: "coveragePremium" },
];

export function InsuranceService({ onSave }: Props) {
  const t = useTranslations("exchange.insurance");
  const [value, setValue] = useState("");
  const [plan, setPlan] = useState("basic");
  const [saving, setSaving] = useState(false);

  async function handleActivate() {
    setSaving(true);
    const selected = PLANS.find((p) => p.key === plan)!;
    await onSave({ plan, declaredValue: Number(value) }, selected.costEur);
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-50">
        🛡️ {t("title")}
      </h3>

      <div>
        <p className="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">{t("value")}</p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500">€</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>
      </div>

      <div className="space-y-2">
        {PLANS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setPlan(p.key)}
            className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition ${
              plan === p.key
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-700"
            }`}
          >
            <span className={`font-medium ${plan === p.key ? "text-blue-700 dark:text-blue-300" : "text-zinc-700 dark:text-zinc-300"}`}>
              {p.key.charAt(0).toUpperCase() + p.key.slice(1)} — €{p.costEur}
            </span>
            <span className="text-xs text-zinc-400">
              {t(p.coverageKey)}
            </span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleActivate}
        disabled={saving || !value}
        className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {saving ? "…" : `${t("activate")} →`}
      </button>
    </div>
  );
}
