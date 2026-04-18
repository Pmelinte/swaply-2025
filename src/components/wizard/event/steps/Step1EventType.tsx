"use client";

import { useTranslations } from "next-intl";
import {
  EVENT_L1_CATEGORIES,
  EVENT_L2_MAP,
  ACCOMMODATION_L1,
} from "@/lib/wizard/eventWizardStore";
import type { EventFormData } from "@/lib/wizard/eventWizardStore";

interface Props {
  form: EventFormData;
  updateForm: (updates: Partial<EventFormData>) => void;
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
        value ? "bg-blue-600" : "bg-zinc-300 dark:bg-zinc-600"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
          value ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export function Step1EventType({ form, updateForm }: Props) {
  const t = useTranslations("eventWizard");
  const showAccommodationWarning = form.event_type_l1 === ACCOMMODATION_L1;

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("step1Subtitle")}</p>

      {/* Event title */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("step1TitleLabel")} *
        </label>
        <input
          type="text"
          maxLength={120}
          value={form.event_title}
          onChange={(e) => updateForm({ event_title: e.target.value })}
          placeholder={t("step1TitlePlaceholder")}
          className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{form.event_title.length}/120</p>
      </div>

      {/* L1 Event Type */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
          {t("step1TypeL1Label")} *
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {EVENT_L1_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => updateForm({ event_type_l1: cat.value, event_type_l2: "" })}
              className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition ${
                form.event_type_l1 === cat.value
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

      {/* Accommodation warning */}
      {showAccommodationWarning && (
        <div className="rounded-xl border border-orange-300 bg-orange-50 p-4 dark:border-orange-700 dark:bg-orange-950/30">
          <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">
            {t("step1AccommodationWarning")}
          </p>
        </div>
      )}

      {/* L2 Subcategory */}
      {form.event_type_l1 && (EVENT_L2_MAP[form.event_type_l1]?.length ?? 0) > 0 && (
        <div>
          <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
            {t("step1TypeL2Label")}
          </label>
          <div className="flex flex-wrap gap-2">
            {EVENT_L2_MAP[form.event_type_l1].map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => updateForm({ event_type_l2: sub })}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  form.event_type_l2 === sub
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

      {/* Is online toggle */}
      <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
        <span className="text-sm text-zinc-900 dark:text-zinc-50">💻 {t("step1IsOnlineLabel")}</span>
        <Toggle value={form.is_online} onChange={(v) => updateForm({ is_online: v })} />
      </div>
    </div>
  );
}
