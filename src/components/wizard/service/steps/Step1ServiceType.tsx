"use client";

import { useTranslations } from "next-intl";
import { SERVICE_L1_CATEGORIES, SERVICE_L2_MAP } from "@/lib/wizard/serviceWizardStore";
import type { ServiceFormData } from "@/lib/wizard/serviceWizardStore";

interface Props {
  form: ServiceFormData;
  updateForm: (updates: Partial<ServiceFormData>) => void;
}

const MODALITIES = [
  { emoji: "💻", value: "Remote", key: "modalityRemote" },
  { emoji: "📍", value: "On-site", key: "modalityOnSite" },
  { emoji: "🔀", value: "Both", key: "modalityBoth" },
];

export function Step1ServiceType({ form, updateForm }: Props) {
  const t = useTranslations("serviceWizard");

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("step1Subtitle")}</p>

      {/* L1 Category */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
          {t("step1CategoryL1Label")} *
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SERVICE_L1_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() =>
                updateForm({
                  service_category_l1: cat.value,
                  service_category_l2: "",
                  service_category_l3: "",
                })
              }
              className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition ${
                form.service_category_l1 === cat.value
                  ? "border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/30"
                  : "border-zinc-200 bg-white hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-400"
              }`}
            >
              <span className="text-2xl">{cat.emoji}</span>
              <span className="text-xs font-medium text-zinc-900 dark:text-zinc-50">
                {t(cat.key)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* L2 Subcategory */}
      {form.service_category_l1 && (SERVICE_L2_MAP[form.service_category_l1]?.length ?? 0) > 0 && (
        <div>
          <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
            {t("step1CategoryL2Label")}
          </label>
          <div className="flex flex-wrap gap-2">
            {SERVICE_L2_MAP[form.service_category_l1].map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => updateForm({ service_category_l2: sub, service_category_l3: "" })}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  form.service_category_l2 === sub
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

      {/* L3 Specific service */}
      {form.service_category_l2 && (
        <div>
          <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
            {t("step1CategoryL3Label")}
          </label>
          <input
            type="text"
            value={form.service_category_l3}
            onChange={(e) => updateForm({ service_category_l3: e.target.value })}
            placeholder={t("step1CategoryL3Placeholder")}
            className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      )}

      {/* Service title */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("step1TitleLabel")} *
        </label>
        <input
          type="text"
          maxLength={120}
          value={form.service_title}
          onChange={(e) => updateForm({ service_title: e.target.value })}
          placeholder={t("step1TitlePlaceholder")}
          className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {form.service_title.length}/120
        </p>
      </div>

      {/* Short description */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("step1ShortDescLabel")}
        </label>
        <textarea
          maxLength={200}
          value={form.service_short_description}
          onChange={(e) => updateForm({ service_short_description: e.target.value })}
          placeholder={t("step1ShortDescPlaceholder")}
          rows={2}
          className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {form.service_short_description.length}/200
        </p>
      </div>

      {/* Modality */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
          {t("step1ModalityLabel")} *
        </label>
        <div className="flex gap-3">
          {MODALITIES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => updateForm({ service_modality: m.value })}
              className={`flex-1 flex flex-col items-center gap-1 rounded-lg border p-4 text-center transition ${
                form.service_modality === m.value
                  ? "border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/30"
                  : "border-zinc-200 bg-white hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-400"
              }`}
            >
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-xs font-medium text-zinc-900 dark:text-zinc-50">
                {t(m.key)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
