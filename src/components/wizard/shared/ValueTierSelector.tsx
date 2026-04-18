"use client";

import { useTranslations } from "next-intl";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const VALUE_TIERS = [
  { emoji: "🪙", value: "Small", labelKey: "valueSmall", rangeKey: "valueSmallRange" },
  { emoji: "💵", value: "Medium", labelKey: "valueMedium", rangeKey: "valueMediumRange" },
  { emoji: "💎", value: "Large", labelKey: "valueLarge", rangeKey: "valueLargeRange" },
  { emoji: "⭐", value: "Special", labelKey: "valueSpecial", rangeKey: "valueSpecialRange" },
];

export function ValueTierSelector({ value, onChange }: Props) {
  const t = useTranslations("wizardShared");

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {VALUE_TIERS.map((tier) => (
        <button
          key={tier.value}
          type="button"
          onClick={() => onChange(tier.value)}
          className={`flex flex-col items-center rounded-lg border p-3 text-center transition ${
            value === tier.value
              ? "border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/30"
              : "border-zinc-200 bg-white hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-400"
          }`}
        >
          <span className="text-2xl mb-1">{tier.emoji}</span>
          <span className="text-xs font-medium text-zinc-900 dark:text-zinc-50 mb-1">
            {t(tier.labelKey)}
          </span>
          <span className="text-xs text-zinc-600 dark:text-zinc-400">{t(tier.rangeKey)}</span>
        </button>
      ))}
    </div>
  );
}
