"use client";

import { useTranslations } from "next-intl";
import type { PropertyFormData } from "@/lib/wizard/propertyWizardStore";

interface Props {
  form: PropertyFormData;
  updateForm: (updates: Partial<PropertyFormData>) => void;
}

const PROPERTY_TYPES = [
  { emoji: "🏡", key: "step1TypeHouse", value: "House" },
  { emoji: "🏢", key: "step1TypeApartment", value: "Apartment" },
  { emoji: "🏰", key: "step1TypeVilla", value: "Villa" },
  { emoji: "🌲", key: "step1TypeCabin", value: "Cabin" },
  { emoji: "🌾", key: "step1TypeFarm", value: "Farm" },
  { emoji: "🏘️", key: "step1TypeCottage", value: "Cottage" },
  { emoji: "🏠", key: "step1TypeTownhouse", value: "Townhouse" },
  { emoji: "🛋️", key: "step1TypeStudio", value: "Studio" },
  { emoji: "🚪", key: "step1TypeRoom", value: "Room" },
  { emoji: "🚐", key: "step1TypeMobileHome", value: "Mobile Home" },
  { emoji: "➕", key: "step1TypeOther", value: "Other" },
];

const PROPERTY_SUBTYPES: Record<string, string[]> = {
  House: ["Detached", "Semi-Detached", "Bungalow", "Chalet"],
  Apartment: ["Studio", "1BR", "2BR", "3BR+", "Penthouse", "Loft"],
  Villa: ["Beachfront", "Countryside", "Mountain", "Luxury"],
  Cabin: ["Log Cabin", "A-Frame", "Tiny House"],
  Farm: ["Vineyard", "Olive Grove", "Mixed Farm", "Ranch"],
  Cottage: ["Country", "Lakeside", "Seaside"],
  Townhouse: ["Modern", "Historic", "Row House"],
  Studio: ["City", "Loft", "Garden Studio"],
  Room: ["Private", "Shared", "En-suite"],
  "Mobile Home": ["Caravan", "Motorhome", "Trailer"],
  Other: [],
};

const PROPERTY_CATEGORIES = [
  { key: "step1CategoryResidential", value: "Residential" },
  { key: "step1CategoryFarm", value: "Farm" },
  { key: "step1CategoryLand", value: "Land" },
];

export function Step1TypeClassification({ form, updateForm }: Props) {
  const t = useTranslations("propertyWizard");
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("step1Subtitle")}</p>

      {/* Property Type */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
          {t("step1PropertyTypeLabel")} *
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PROPERTY_TYPES.map((pt) => (
            <button
              key={pt.value}
              type="button"
              onClick={() => updateForm({ property_type: pt.value, property_subtype: "" })}
              className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition ${
                form.property_type === pt.value
                  ? "border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/30"
                  : "border-zinc-200 bg-white hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-400"
              }`}
            >
              <span className="text-2xl">{pt.emoji}</span>
              <span className="text-xs font-medium text-zinc-900 dark:text-zinc-50">
                {t(pt.key)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Property Subtype — conditional */}
      {form.property_type && (PROPERTY_SUBTYPES[form.property_type]?.length ?? 0) > 0 && (
        <div>
          <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
            {t("step1PropertySubtypeLabel")}
          </label>
          <div className="flex flex-wrap gap-2">
            {PROPERTY_SUBTYPES[form.property_type].map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => updateForm({ property_subtype: sub })}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  form.property_subtype === sub
                    ? "bg-blue-600 text-white"
                    : "border border-zinc-200 bg-white text-zinc-700 hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-blue-400"
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Property Category */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
          {t("step1PropertyCategoryLabel")} *
        </label>
        <div className="flex gap-3">
          {PROPERTY_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => updateForm({ property_category: cat.value })}
              className={`flex-1 rounded-lg border py-3 text-sm font-medium transition ${
                form.property_category === cat.value
                  ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950/30 dark:text-blue-300"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-blue-400"
              }`}
            >
              {t(cat.key)}
            </button>
          ))}
        </div>
      </div>

      {/* Year Built */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("step1YearBuiltLabel")}
        </label>
        <input
          type="number"
          min={1800}
          max={currentYear}
          value={form.year_built}
          onChange={(e) => updateForm({ year_built: e.target.value })}
          placeholder={t("step1YearBuiltPlaceholder")}
          className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      {/* Last Renovated */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("step1LastRenovatedLabel")}
        </label>
        <input
          type="number"
          min={1900}
          max={currentYear}
          value={form.last_renovated}
          onChange={(e) => updateForm({ last_renovated: e.target.value })}
          placeholder="e.g., 2018"
          className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      {/* Renovation Details — conditional */}
      {form.last_renovated && (
        <div>
          <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
            {t("step1RenovationDetailsLabel")}
          </label>
          <textarea
            value={form.renovation_details}
            onChange={(e) => updateForm({ renovation_details: e.target.value })}
            placeholder={t("step1RenovationDetailsPlaceholder")}
            rows={3}
            className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      )}
    </div>
  );
}
