"use client";

import { useTranslations } from "next-intl";
import { CategoryL1Picker } from "@/components/explore/filters/shared/CategoryL1Picker";
import { ValueTierFilter } from "@/components/explore/filters/shared/ValueTierFilter";
import { LocationFilter } from "@/components/explore/filters/shared/LocationFilter";
import type { OfferFilters } from "@/lib/explore/exploreFilterTypes";

interface Props {
  filters: OfferFilters;
  onChange: (updates: Partial<OfferFilters>) => void;
}

const OBJECT_L1 = [
  { emoji: "🐾", value: "Animals & Pet Supplies", label: "Pets" },
  { emoji: "👗", value: "Apparel & Accessories", label: "Apparel" },
  { emoji: "🎨", value: "Arts & Entertainment", label: "Arts" },
  { emoji: "👶", value: "Baby & Toddler", label: "Baby" },
  { emoji: "🏭", value: "Business & Industrial", label: "Business" },
  { emoji: "📷", value: "Cameras & Optics", label: "Cameras" },
  { emoji: "💻", value: "Electronics", label: "Electronics" },
  { emoji: "🛋️", value: "Furniture", label: "Furniture" },
  { emoji: "🔧", value: "Hardware", label: "Hardware" },
  { emoji: "💄", value: "Health & Beauty", label: "Health" },
  { emoji: "🏡", value: "Home & Garden", label: "Home" },
  { emoji: "🧳", value: "Luggage & Bags", label: "Luggage" },
  { emoji: "📀", value: "Media", label: "Media" },
  { emoji: "📎", value: "Office Supplies", label: "Office" },
  { emoji: "💾", value: "Software", label: "Software" },
  { emoji: "⚽", value: "Sporting Goods", label: "Sports" },
  { emoji: "🧸", value: "Toys & Games", label: "Toys" },
  { emoji: "🚗", value: "Vehicles & Parts", label: "Vehicles" },
];

const CONDITIONS = [
  { emoji: "🆕", key: "condNew", value: "new" },
  { emoji: "✨", key: "condLikeNew", value: "like_new" },
  { emoji: "👍", key: "condVeryGood", value: "very_good" },
  { emoji: "👌", key: "condGood", value: "good" },
  { emoji: "🔧", key: "condUsed", value: "used" },
  { emoji: "⚠️", key: "condRepair", value: "repair" },
  { emoji: "🏆", key: "condSpecial", value: "special" },
];

export function ObjectFilters({ filters, onChange }: Props) {
  const t = useTranslations("exploreDrawer");

  return (
    <div className="space-y-5">
      {/* Category L1 */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("objectCategoryLabel")}
        </label>
        <CategoryL1Picker
          options={OBJECT_L1}
          value={filters.category_l1}
          onChange={(v) => onChange({ category_l1: v, category_l2: null })}
        />
      </div>

      {/* Condition */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("objectConditionLabel")}
        </label>
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => onChange({ condition: filters.condition === c.value ? null : c.value })}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                filters.condition === c.value
                  ? "bg-blue-600 text-white"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-blue-400"
              }`}
            >
              <span>{c.emoji}</span>
              <span>{t(c.key)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Value tier */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("valueTierLabel")}
        </label>
        <ValueTierFilter
          value={filters.value_tier}
          onChange={(v) => onChange({ value_tier: v })}
        />
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("locationSectionLabel")}
        </label>
        <LocationFilter
          city={filters.city}
          radiusKm={filters.radius_km}
          onCityChange={(v) => onChange({ city: v })}
          onRadiusChange={(v) => onChange({ radius_km: v })}
        />
      </div>
    </div>
  );
}
