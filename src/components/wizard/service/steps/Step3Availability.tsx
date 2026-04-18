"use client";

import { useTranslations } from "next-intl";
import type { ServiceFormData } from "@/lib/wizard/serviceWizardStore";

interface Props {
  form: ServiceFormData;
  updateForm: (updates: Partial<ServiceFormData>) => void;
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

function Stepper({ value, min = 0, max = 90, onChange }: { value: number; min?: number; max?: number; onChange: (v: number) => void }) {
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

const DAYS = [
  { key: "dayMon", value: "Mon" },
  { key: "dayTue", value: "Tue" },
  { key: "dayWed", value: "Wed" },
  { key: "dayThu", value: "Thu" },
  { key: "dayFri", value: "Fri" },
  { key: "daySat", value: "Sat" },
  { key: "daySun", value: "Sun" },
  { key: "dayAny", value: "Any" },
];

const TIMES_OF_DAY = [
  { emoji: "🌅", key: "timeMorning", value: "Morning" },
  { emoji: "☀️", key: "timeMidday", value: "Midday" },
  { emoji: "🌤️", key: "timeAfternoon", value: "Afternoon" },
  { emoji: "🌙", key: "timeEvening", value: "Evening" },
  { emoji: "🔀", key: "timeFlexible", value: "Flexible" },
];

const DURATIONS = [
  { key: "duration1h", value: "1h" },
  { key: "durationHalfDay", value: "Half day" },
  { key: "durationFullDay", value: "Full day" },
  { key: "durationMultiDay", value: "Multi-day" },
  { key: "durationRecurring", value: "Recurring contract" },
];

const RECURRING_FREQUENCIES = [
  { key: "freqWeekly", value: "Weekly" },
  { key: "freqBiweekly", value: "Biweekly" },
  { key: "freqMonthly", value: "Monthly" },
];

export function Step3Availability({ form, updateForm }: Props) {
  const t = useTranslations("serviceWizard");

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("step3Subtitle")}</p>

      {/* Days */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
          {t("step3DaysLabel")} *
        </label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d) => (
            <ToggleChip
              key={d.value}
              label={t(d.key)}
              selected={form.availability_days.includes(d.value)}
              onClick={() => updateForm({ availability_days: toggleMulti(form.availability_days, d.value) })}
            />
          ))}
        </div>
      </div>

      {/* Time of day */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
          {t("step3TimeOfDayLabel")}
        </label>
        <div className="flex flex-wrap gap-2">
          {TIMES_OF_DAY.map((tod) => (
            <button
              key={tod.value}
              type="button"
              onClick={() =>
                updateForm({
                  availability_time_of_day: toggleMulti(form.availability_time_of_day, tod.value),
                })
              }
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
                form.availability_time_of_day.includes(tod.value)
                  ? "bg-blue-600 text-white"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-blue-400"
              }`}
            >
              <span>{tod.emoji}</span>
              <span>{t(tod.key)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
          {t("step3DurationLabel")}
        </label>
        <div className="flex flex-wrap gap-2">
          {DURATIONS.map((d) => (
            <ToggleChip
              key={d.value}
              label={t(d.key)}
              selected={form.service_duration.includes(d.value)}
              onClick={() => updateForm({ service_duration: toggleMulti(form.service_duration, d.value) })}
            />
          ))}
        </div>
      </div>

      {/* Available from/until */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
            {t("step3AvailableFromLabel")}
          </label>
          <input
            type="date"
            value={form.available_from_date}
            onChange={(e) => updateForm({ available_from_date: e.target.value })}
            className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
            {t("step3AvailableUntilLabel")}
          </label>
          <input
            type="date"
            value={form.available_until_date}
            onChange={(e) => updateForm({ available_until_date: e.target.value })}
            className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      </div>

      {/* Advance notice */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          ⏰ {t("step3AdvanceNoticeLabel")}
        </label>
        <Stepper value={form.advance_notice_days} min={0} max={90} onChange={(v) => updateForm({ advance_notice_days: v })} />
      </div>

      {/* Urgent available */}
      <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
        <span className="text-sm text-zinc-900 dark:text-zinc-50">🚨 {t("step3UrgentLabel")}</span>
        <Toggle value={form.urgent_available} onChange={(v) => updateForm({ urgent_available: v })} />
      </div>

      {/* Recurring possible */}
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
          <span className="text-sm text-zinc-900 dark:text-zinc-50">🔁 {t("step3RecurringLabel")}</span>
          <Toggle
            value={form.recurring_possible}
            onChange={(v) => updateForm({ recurring_possible: v })}
          />
        </div>
        {form.recurring_possible && (
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              {t("step3RecurringFrequencyLabel")}
            </label>
            <div className="flex flex-wrap gap-2">
              {RECURRING_FREQUENCIES.map((rf) => (
                <ToggleChip
                  key={rf.value}
                  label={t(rf.key)}
                  selected={form.recurring_frequency.includes(rf.value)}
                  onClick={() =>
                    updateForm({ recurring_frequency: toggleMulti(form.recurring_frequency, rf.value) })
                  }
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
