"use client";

import { useTranslations } from "next-intl";
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

function Stepper({ value, min = 0, max = 500, onChange }: { value: number; min?: number; max?: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="h-8 w-8 rounded-full border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 flex items-center justify-center font-bold text-lg leading-none transition"
      >
        −
      </button>
      <span className="min-w-[2rem] text-center text-sm font-semibold text-zinc-900 dark:text-zinc-50">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="h-8 w-8 rounded-full border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 flex items-center justify-center font-bold text-lg leading-none transition"
      >
        +
      </button>
    </div>
  );
}

const AGE_RESTRICTIONS = [
  { key: "ageNoRestriction", value: "No restriction" },
  { key: "age18", value: "18+" },
  { key: "age16", value: "16+" },
  { key: "ageFamilyFriendly", value: "Family-friendly" },
  { key: "ageCustom", value: "Custom" },
];

export function Step3Participants({ form, updateForm }: Props) {
  const t = useTranslations("eventWizard");

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("step3Subtitle")}</p>

      {/* Capacity */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {t("step3CapacityTotalLabel")}
          </label>
          <Stepper
            value={form.capacity_total}
            min={1}
            max={10000}
            onChange={(v) =>
              updateForm({
                capacity_total: v,
                capacity_available: Math.min(form.capacity_available, v),
              })
            }
          />
        </div>
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {t("step3CapacityAvailableLabel")}
          </label>
          <Stepper
            value={form.capacity_available}
            min={0}
            max={form.capacity_total}
            onChange={(v) => updateForm({ capacity_available: v })}
          />
        </div>
      </div>

      {/* Group Size */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {t("step3GroupSizeMinLabel")}
          </label>
          <Stepper
            value={form.group_size_min}
            min={1}
            max={100}
            onChange={(v) => updateForm({ group_size_min: v })}
          />
        </div>
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {t("step3GroupSizeMaxLabel")}
          </label>
          <Stepper
            value={form.group_size_max}
            min={form.group_size_min}
            max={1000}
            onChange={(v) => updateForm({ group_size_max: v })}
          />
        </div>
      </div>

      {/* Age restriction */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
          {t("step3AgeRestrictionLabel")}
        </label>
        <div className="flex flex-wrap gap-2">
          {AGE_RESTRICTIONS.map((ar) => (
            <button
              key={ar.value}
              type="button"
              onClick={() => updateForm({ age_restriction: ar.value })}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                form.age_restriction === ar.value
                  ? "bg-blue-600 text-white"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-blue-400"
              }`}
            >
              {t(ar.key)}
            </button>
          ))}
        </div>
        {form.age_restriction === "Custom" && (
          <input
            type="number"
            min={0}
            max={99}
            value={form.age_min}
            onChange={(e) => updateForm({ age_min: e.target.value })}
            placeholder={t("step3AgeMinPlaceholder")}
            className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        )}
      </div>

      {/* Friendly toggles */}
      <div className="space-y-2">
        {[
          { key: "step3KidFriendlyLabel", field: "kid_friendly" as const, emoji: "👶" },
          { key: "step3PetFriendlyLabel", field: "pet_friendly" as const, emoji: "🐾" },
          { key: "step3IncludesAccommodationLabel", field: "includes_accommodation" as const, emoji: "🏠" },
          { key: "step3IncludesTransportLabel", field: "includes_transport" as const, emoji: "🚗" },
          { key: "step3IncludesMealsLabel", field: "includes_meals" as const, emoji: "🍽️" },
          { key: "step3IncludesEquipmentLabel", field: "includes_equipment" as const, emoji: "🎒" },
          { key: "step3IdRequiredLabel", field: "id_required" as const, emoji: "🪪" },
        ].map(({ key, field, emoji }) => (
          <div
            key={field}
            className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800"
          >
            <span className="text-sm text-zinc-900 dark:text-zinc-50">
              {emoji} {t(key)}
            </span>
            <Toggle
              value={form[field] as boolean}
              onChange={(v) => updateForm({ [field]: v })}
            />
          </div>
        ))}
      </div>

      {/* Equipment list */}
      {form.includes_equipment && (
        <div>
          <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
            {t("step3EquipmentListLabel")}
          </label>
          <textarea
            value={form.equipment_list}
            onChange={(e) => updateForm({ equipment_list: e.target.value })}
            placeholder={t("step3EquipmentListPlaceholder")}
            rows={2}
            className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      )}

      {/* Dress code */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          👔 {t("step3DressCodeLabel")}
        </label>
        <input
          type="text"
          value={form.dress_code}
          onChange={(e) => updateForm({ dress_code: e.target.value })}
          placeholder={t("step3DressCodePlaceholder")}
          className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      {/* Booking deadline */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
            {t("step3BookingDeadlineLabel")}
          </label>
          <input
            type="date"
            value={form.booking_deadline_date}
            onChange={(e) => updateForm({ booking_deadline_date: e.target.value })}
            className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div className="flex flex-col justify-end">
          <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
            {t("step3AdvanceBookingMonthsLabel")}
          </label>
          <Stepper
            value={form.advance_booking_months}
            min={0}
            max={24}
            onChange={(v) => updateForm({ advance_booking_months: v })}
          />
        </div>
      </div>
    </div>
  );
}
