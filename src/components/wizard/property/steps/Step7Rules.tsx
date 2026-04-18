"use client";

import { useTranslations } from "next-intl";
import type { PropertyFormData } from "@/lib/wizard/propertyWizardStore";

interface Props {
  form: PropertyFormData;
  updateForm: (updates: Partial<PropertyFormData>) => void;
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

function Stepper({ value, min = 0, max = 20, onChange }: { value: number; min?: number; max?: number; onChange: (v: number) => void }) {
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

function ToggleChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
        selected
          ? "bg-blue-600 text-white"
          : "border border-zinc-200 bg-white text-zinc-700 hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-blue-400"
      }`}
    >
      {label}
    </button>
  );
}

function toggleMulti(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

const SMOKING_OPTIONS = [
  { key: "step7SmokingNotAllowed", value: "Not Allowed" },
  { key: "step7SmokingOutsideOnly", value: "Outside Only" },
  { key: "step7SmokingAnywhere", value: "Anywhere" },
];

const PETS_TYPES = [
  { key: "step7PetsDogs", value: "Dogs" },
  { key: "step7PetsCats", value: "Cats" },
  { key: "step7PetsSmall", value: "Small Pets" },
  { key: "step7PetsAny", value: "Any" },
];

const ACCESSIBILITY_FEATURES = [
  { key: "step7AccessibilityWheelchair", value: "Wheelchair Accessible" },
  { key: "step7AccessibilityElevator", value: "Elevator" },
  { key: "step7AccessibilityWideDoors", value: "Wide Doorways" },
  { key: "step7AccessibilityAdaptedShower", value: "Adapted Shower" },
  { key: "step7AccessibilityGroundFloor", value: "Ground Floor" },
  { key: "step7AccessibilityRamp", value: "Ramp" },
  { key: "step7AccessibilityHandrails", value: "Handrails" },
  { key: "step7AccessibilityBraille", value: "Braille" },
];

export function Step7Rules({ form, updateForm }: Props) {
  const t = useTranslations("propertyWizard");

  return (
    <div className="space-y-8">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("step7Subtitle")}</p>

      {/* Check-in / Check-out */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
            {t("step7CheckInLabel")} *
          </label>
          <input
            type="time"
            value={form.check_in_time}
            onChange={(e) => updateForm({ check_in_time: e.target.value })}
            className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
            {t("step7CheckOutLabel")} *
          </label>
          <input
            type="time"
            value={form.check_out_time}
            onChange={(e) => updateForm({ check_out_time: e.target.value })}
            className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      </div>

      {/* Smoking */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
          {t("step7SmokingLabel")}
        </label>
        <div className="flex gap-2">
          {SMOKING_OPTIONS.map((so) => (
            <ToggleChip
              key={so.value}
              label={t(so.key)}
              selected={form.smoking_allowed === so.value}
              onClick={() => updateForm({ smoking_allowed: so.value })}
            />
          ))}
        </div>
      </div>

      {/* Basic toggles */}
      <div className="space-y-2">
        {[
          { key: "step7AlcoholLabel", field: "alcohol_allowed" as const, emoji: "🍷" },
          { key: "step7PartiesLabel", field: "parties_allowed" as const, emoji: "🎉" },
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

      {/* Quiet Hours */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          🤫 {t("step7QuietHoursLabel")}
        </label>
        <input
          type="text"
          value={form.quiet_hours}
          onChange={(e) => updateForm({ quiet_hours: e.target.value })}
          placeholder={t("step7QuietHoursPlaceholder")}
          className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      {/* Guests Limit */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          👥 {t("step7GuestsLimitLabel")}
        </label>
        <Stepper
          value={form.guests_limit}
          min={1}
          max={30}
          onChange={(v) => updateForm({ guests_limit: v })}
        />
      </div>

      {/* Children */}
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
          <span className="text-sm text-zinc-900 dark:text-zinc-50">
            👶 {t("step7ChildrenLabel")}
          </span>
          <Toggle
            value={form.children_allowed}
            onChange={(v) => updateForm({ children_allowed: v })}
          />
        </div>
        {form.children_allowed && (
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              {t("step7MinChildAgeLabel")}
            </label>
            <input
              type="number"
              min={0}
              max={18}
              value={form.min_child_age}
              onChange={(e) => updateForm({ min_child_age: e.target.value })}
              placeholder="years"
              className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        )}
      </div>

      {/* Infants */}
      <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
        <span className="text-sm text-zinc-900 dark:text-zinc-50">
          🍼 {t("step7InfantsLabel")}
        </span>
        <Toggle
          value={form.infants_allowed}
          onChange={(v) => updateForm({ infants_allowed: v })}
        />
      </div>

      {/* Pets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
          <span className="text-sm text-zinc-900 dark:text-zinc-50">
            🐾 {t("step7PetsLabel")}
          </span>
          <Toggle
            value={form.pets_allowed}
            onChange={(v) => updateForm({ pets_allowed: v })}
          />
        </div>
        {form.pets_allowed && (
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              {t("step7PetsTypesLabel")}
            </label>
            <div className="flex flex-wrap gap-2">
              {PETS_TYPES.map((pt) => (
                <ToggleChip
                  key={pt.value}
                  label={t(pt.key)}
                  selected={form.pets_types.includes(pt.value)}
                  onClick={() =>
                    updateForm({ pets_types: toggleMulti(form.pets_types, pt.value) })
                  }
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Local Wildlife */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          🦊 {t("step7WildlifeLabel")}
        </label>
        <textarea
          value={form.local_wildlife_note}
          onChange={(e) => updateForm({ local_wildlife_note: e.target.value })}
          placeholder={t("step7WildlifePlaceholder")}
          rows={2}
          className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      {/* Housekeeping */}
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
          <span className="text-sm text-zinc-900 dark:text-zinc-50">
            🧹 {t("step7HousekeepingLabel")}
          </span>
          <Toggle
            value={form.housekeeping_included}
            onChange={(v) => updateForm({ housekeeping_included: v })}
          />
        </div>
        {form.housekeeping_included && (
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              {t("step7HousekeepingFreqLabel")}
            </label>
            <input
              type="text"
              value={form.housekeeping_frequency}
              onChange={(e) => updateForm({ housekeeping_frequency: e.target.value })}
              placeholder="e.g., Daily, Weekly..."
              className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        )}
      </div>

      {/* Security */}
      <div className="space-y-2">
        {[
          { key: "step7SecuritySystemLabel", field: "security_system" as const, emoji: "🔒" },
          { key: "step7KeypadLabel", field: "keypad_entry" as const, emoji: "🔢" },
          { key: "step7EmergencyContactLabel", field: "emergency_contact_available" as const, emoji: "📞" },
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

      {/* CCTV — with GDPR warning */}
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
          <span className="text-sm text-zinc-900 dark:text-zinc-50">
            📷 {t("step7CctvLabel")}
          </span>
          <Toggle
            value={form.cctv_present}
            onChange={(v) => updateForm({ cctv_present: v })}
          />
        </div>
        {form.cctv_present && (
          <div className="space-y-2">
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-950/30">
              <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                {t("step7CctvWarning")}
              </p>
            </div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {t("step7CctvDisclosureLabel")} *
            </label>
            <textarea
              value={form.cctv_disclosure}
              onChange={(e) => updateForm({ cctv_disclosure: e.target.value })}
              placeholder={t("step7CctvDisclosurePlaceholder")}
              rows={3}
              className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        )}
      </div>

      {/* WiFi Password */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          📶 {t("step7WifiPasswordLabel")}
        </label>
        <input
          type="text"
          value={form.wifi_password}
          onChange={(e) => updateForm({ wifi_password: e.target.value })}
          placeholder={t("step7WifiPasswordPlaceholder")}
          className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      {/* Special House Rules */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          📋 {t("step7SpecialRulesLabel")}
        </label>
        <textarea
          value={form.special_house_rules}
          onChange={(e) => updateForm({ special_house_rules: e.target.value })}
          placeholder={t("step7SpecialRulesPlaceholder")}
          rows={4}
          className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      {/* Accessibility */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
          ♿ {t("step7AccessibilityLabel")}
        </label>
        <div className="flex flex-wrap gap-2">
          {ACCESSIBILITY_FEATURES.map((af) => (
            <ToggleChip
              key={af.value}
              label={t(af.key)}
              selected={form.accessibility_features.includes(af.value)}
              onClick={() =>
                updateForm({
                  accessibility_features: toggleMulti(form.accessibility_features, af.value),
                })
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
