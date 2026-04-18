"use client";

import { useTranslations } from "next-intl";
import { TypeSelector } from "@/components/explore/filters/shared/TypeSelector";
import { ValueTierFilter } from "@/components/explore/filters/shared/ValueTierFilter";
import type {
  Flexibility,
  ItemKindOrAny,
  WantFilters,
} from "@/lib/explore/exploreFilterTypes";

interface Props {
  filters: WantFilters;
  onChange: (updates: Partial<WantFilters>) => void;
}

const FLEX_OPTIONS: { emoji: string; value: Flexibility; key: string }[] = [
  { emoji: "🔒", value: "Strict", key: "flexStrict" },
  { emoji: "🔄", value: "Moderate", key: "flexModerate" },
  { emoji: "🌐", value: "Wide", key: "flexWide" },
];

export function WantTab({ filters, onChange }: Props) {
  const t = useTranslations("exploreDrawer");
  const tShared = useTranslations("wizardShared");

  return (
    <div className="space-y-5">
      {/* Type selector with "Any" */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("wantTypeLabel")}
        </label>
        <TypeSelector<ItemKindOrAny>
          value={filters.type}
          onChange={(v) => onChange({ type: v })}
          includeAny
        />
      </div>

      {/* NLP description */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("wantQueryLabel")}
        </label>
        <input
          type="text"
          value={filters.query}
          onChange={(e) => onChange({ query: e.target.value })}
          placeholder={t("wantQueryPlaceholder")}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      {/* Value tier accepted */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {tShared("valueTierLabel")}
        </label>
        <ValueTierFilter
          value={filters.value_tier}
          onChange={(v) => onChange({ value_tier: v })}
        />
      </div>

      {/* Flexibility */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("flexibilityLabel")}
        </label>
        <div className="flex gap-2">
          {FLEX_OPTIONS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => onChange({ flexibility: filters.flexibility === f.value ? null : f.value })}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg border p-3 text-sm font-medium transition ${
                filters.flexibility === f.value
                  ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950/30 dark:text-blue-300"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              }`}
            >
              <span>{f.emoji}</span>
              <span>{t(f.key)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Advanced options */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("advancedLabel")}
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-800 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.chain_swap}
              onChange={(e) => onChange({ chain_swap: e.target.checked })}
              className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-zinc-900 dark:text-zinc-50">🔗 {t("chainSwapLabel")}</span>
          </label>
          <label className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-800 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.partial_swap}
              onChange={(e) => onChange({ partial_swap: e.target.checked })}
              className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-zinc-900 dark:text-zinc-50">💸 {t("partialSwapLabel")}</span>
          </label>
        </div>
      </div>

      {filters.type === "any" && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30">
          <p className="text-xs text-blue-800 dark:text-blue-300">
            {t("anyHint")}
          </p>
        </div>
      )}
    </div>
  );
}
