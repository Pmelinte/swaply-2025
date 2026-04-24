"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface Props {
  swapId: string;
  onSave: (details: Record<string, unknown>, cost?: number) => Promise<void>;
}

const PLANS = [
  { key: "basic", labelKey: "basic", cost: 0 },
  { key: "plus",  labelKey: "plus",  cost: 2.99 },
  { key: "full",  labelKey: "full",  cost: 4.99 },
];

export function EscrowService({ onSave }: Props) {
  const t = useTranslations("exchange.escrow");
  const [plan, setPlan] = useState("basic");
  const [saving, setSaving] = useState(false);

  async function handleActivate() {
    setSaving(true);
    const selected = PLANS.find((p) => p.key === plan)!;
    await onSave({ plan }, selected.cost > 0 ? selected.cost : undefined);
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-50">
        🔒 {t("title")}
      </h3>

      <div className="flex gap-2">
        {PLANS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setPlan(p.key)}
            className={`flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition ${
              plan === p.key
                ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300"
                : "border-zinc-200 text-zinc-500 hover:border-zinc-400 dark:border-zinc-700"
            }`}
          >
            {t(`plans.${p.labelKey}`)}
          </button>
        ))}
      </div>

      <div className="rounded-xl bg-zinc-50 p-3 text-sm dark:bg-zinc-800">
        <p className="mb-2 font-medium text-zinc-700 dark:text-zinc-200">{t("how")}</p>
        <ol className="space-y-1 text-zinc-500 dark:text-zinc-400">
          <li>1. {t("step1")}</li>
          <li>2. {t("step2")}</li>
          <li>3. {t("step3")}</li>
        </ol>
      </div>

      <button
        type="button"
        onClick={handleActivate}
        disabled={saving}
        className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {saving ? "…" : t("activate")}
      </button>
    </div>
  );
}
