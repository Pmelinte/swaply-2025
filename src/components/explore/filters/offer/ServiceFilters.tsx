"use client";

import { useTranslations } from "next-intl";
import { CategoryL1Picker } from "@/components/explore/filters/shared/CategoryL1Picker";
import type { OfferFilters } from "@/lib/explore/exploreFilterTypes";

interface Props {
  filters: OfferFilters;
  onChange: (updates: Partial<OfferFilters>) => void;
}

const SERVICE_L1 = [
  { emoji: "🔨", value: "Home & Construction", label: "Home" },
  { emoji: "🧹", value: "Cleaning", label: "Cleaning" },
  { emoji: "🌿", value: "Environmental", label: "Env" },
  { emoji: "🚗", value: "Transport", label: "Transport" },
  { emoji: "💼", value: "Business & Professional", label: "Business" },
  { emoji: "💻", value: "Tech & Engineering", label: "Tech" },
  { emoji: "🎨", value: "Creative & Design", label: "Creative" },
  { emoji: "💰", value: "Finance & Accounting", label: "Finance" },
  { emoji: "🏥", value: "Health & Wellness", label: "Health" },
  { emoji: "📚", value: "Education & Training", label: "Education" },
  { emoji: "🎭", value: "Entertainment & Food", label: "Entertainment" },
  { emoji: "✂️", value: "Personal & Domestic", label: "Personal" },
  { emoji: "⚡", value: "Geothermal & Heat Pump", label: "Geo/HP" },
];

const MODALITIES = [
  { emoji: "💻", key: "modRemote", value: "Remote" },
  { emoji: "📍", key: "modOnSite", value: "On-site" },
  { emoji: "🔀", key: "modBoth", value: "Both" },
];

const DAYS = [
  { key: "dayMon", value: "Mon" },
  { key: "dayTue", value: "Tue" },
  { key: "dayWed", value: "Wed" },
  { key: "dayThu", value: "Thu" },
  { key: "dayFri", value: "Fri" },
  { key: "daySat", value: "Sat" },
  { key: "daySun", value: "Sun" },
];

const CERTIFICATIONS = [
  { key: "certLicensed", value: "Licensed" },
  { key: "certInsured", value: "Insured" },
  { key: "certProfessional", value: "Professional Certificate" },
  { key: "certBackground", value: "Background Check" },
];

function toggleMulti(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export function ServiceFilters({ filters, onChange }: Props) {
  const t = useTranslations("exploreDrawer");

  return (
    <div className="space-y-5">
      {/* Category L1 */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("serviceCategoryLabel")}
        </label>
        <CategoryL1Picker
          options={SERVICE_L1}
          value={filters.category_l1}
          onChange={(v) => onChange({ category_l1: v, category_l2: null })}
        />
      </div>

      {/* Modality */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("serviceModalityLabel")}
        </label>
        <div className="flex gap-2">
          {MODALITIES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() =>
                onChange({
                  service_modality: filters.service_modality === m.value ? null : m.value,
                })
              }
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg border p-3 text-sm font-medium transition ${
                filters.service_modality === m.value
                  ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950/30 dark:text-blue-300"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              }`}
            >
              <span>{m.emoji}</span>
              <span>{t(m.key)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Days */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("serviceDaysLabel")}
        </label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() =>
                onChange({ service_days: toggleMulti(filters.service_days, d.value) })
              }
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                filters.service_days.includes(d.value)
                  ? "bg-blue-600 text-white"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              }`}
            >
              {t(d.key)}
            </button>
          ))}
        </div>
      </div>

      {/* Certifications */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("certificationsLabel")}
        </label>
        <div className="flex flex-wrap gap-2">
          {CERTIFICATIONS.map((c) => (
            <label
              key={c.value}
              className="flex items-center gap-2 cursor-pointer rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            >
              <input
                type="checkbox"
                checked={filters.certifications.includes(c.value)}
                onChange={() =>
                  onChange({ certifications: toggleMulti(filters.certifications, c.value) })
                }
                className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-zinc-700 dark:text-zinc-200">{t(c.key)}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
