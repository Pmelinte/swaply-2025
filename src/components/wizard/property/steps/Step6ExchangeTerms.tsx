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

function Stepper({ value, min = 1, max = 30, onChange }: { value: number; min?: number; max?: number; onChange: (v: number) => void }) {
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

const EXCHANGE_TYPES = [
  { emoji: "🔄", key: "step6ExchangeSimultaneous", value: "Simultaneous" },
  { emoji: "↔️", key: "step6ExchangeNonSimultaneous", value: "Non-Simultaneous" },
  { emoji: "🏆", key: "step6ExchangePoints", value: "Points-Based" },
  { emoji: "📦", key: "step6ExchangePropObj", value: "Property ↔ Object" },
  { emoji: "🛠️", key: "step6ExchangePropService", value: "Property ↔ Service" },
  { emoji: "🌐", key: "step6ExchangeFlexible", value: "Flexible" },
];

const EXCHANGE_DURATIONS = [
  { key: "step6DurationWeekend", value: "Weekend" },
  { key: "step6Duration1Week", value: "1 Week" },
  { key: "step6Duration2Weeks", value: "2 Weeks" },
  { key: "step6DurationMonth", value: "Month" },
  { key: "step6DurationSeason", value: "Season" },
  { key: "step6DurationFlexible", value: "Flexible" },
];

const PREFERRED_SEASONS = [
  { emoji: "🌸", key: "step6SeasonSpring", value: "Spring" },
  { emoji: "☀️", key: "step6SeasonSummer", value: "Summer" },
  { emoji: "🍂", key: "step6SeasonAutumn", value: "Autumn" },
  { emoji: "❄️", key: "step6SeasonWinter", value: "Winter" },
  { emoji: "🌍", key: "step6SeasonAllYear", value: "All Year" },
];

const GEO_PREFERENCES = [
  { emoji: "🏙️", key: "step6GeoLocal", value: "Local" },
  { emoji: "🗺️", key: "step6GeoRegional", value: "Regional" },
  { emoji: "🌍", key: "step6GeoInternational", value: "International" },
  { emoji: "✈️", key: "step6GeoVacation", value: "Vacation" },
];

export function Step6ExchangeTerms({ form, updateForm }: Props) {
  const t = useTranslations("propertyWizard");

  return (
    <div className="space-y-8">
      {/* Vacation Disclaimer Banner */}
      <div className="rounded-xl border border-orange-300 bg-orange-50 p-4 dark:border-orange-700 dark:bg-orange-950/30">
        <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">
          {t("step6Disclaimer")}
        </p>
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("step6Subtitle")}</p>

      {/* Exchange Type */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
          {t("step6ExchangeTypeLabel")} *
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {EXCHANGE_TYPES.map((et) => (
            <button
              key={et.value}
              type="button"
              onClick={() => updateForm({ exchange_type: et.value })}
              className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition ${
                form.exchange_type === et.value
                  ? "border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/30"
                  : "border-zinc-200 bg-white hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-400"
              }`}
            >
              <span className="text-xl">{et.emoji}</span>
              <span className="text-xs font-medium text-zinc-900 dark:text-zinc-50">
                {t(et.key)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Exchange Duration */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
          {t("step6DurationLabel")}
        </label>
        <div className="flex flex-wrap gap-2">
          {EXCHANGE_DURATIONS.map((ed) => (
            <ToggleChip
              key={ed.value}
              label={t(ed.key)}
              selected={form.exchange_duration.includes(ed.value)}
              onClick={() =>
                updateForm({ exchange_duration: toggleMulti(form.exchange_duration, ed.value) })
              }
            />
          ))}
        </div>
      </div>

      {/* Min / Max Stay */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            {t("step6MinStayLabel")}
          </label>
          <input
            type="number"
            min={1}
            value={form.minimum_stay_days}
            onChange={(e) => updateForm({ minimum_stay_days: e.target.value })}
            placeholder="days"
            className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            {t("step6MaxStayLabel")}
          </label>
          <input
            type="number"
            min={1}
            value={form.maximum_stay_days}
            onChange={(e) => updateForm({ maximum_stay_days: e.target.value })}
            placeholder="days"
            className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      </div>

      {/* Preferred Seasons */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
          {t("step6SeasonsLabel")}
        </label>
        <div className="flex flex-wrap gap-2">
          {PREFERRED_SEASONS.map((ps) => (
            <button
              key={ps.value}
              type="button"
              onClick={() =>
                updateForm({ preferred_seasons: toggleMulti(form.preferred_seasons, ps.value) })
              }
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
                form.preferred_seasons.includes(ps.value)
                  ? "bg-blue-600 text-white"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-blue-400"
              }`}
            >
              <span>{ps.emoji}</span>
              <span>{t(ps.key)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Guests Allowed */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {t("step6GuestsAllowedLabel")}
        </label>
        <Stepper
          value={form.number_of_guests_allowed}
          min={1}
          max={30}
          onChange={(v) => updateForm({ number_of_guests_allowed: v })}
        />
      </div>

      {/* Flexible Dates */}
      <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
        <span className="text-sm text-zinc-900 dark:text-zinc-50">
          📅 {t("step6FlexibleDatesLabel")}
        </span>
        <Toggle
          value={form.flexible_dates}
          onChange={(v) => updateForm({ flexible_dates: v })}
        />
      </div>

      {/* Availability Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            {t("step6AvailableStartLabel")}
          </label>
          <input
            type="date"
            value={form.available_start_date}
            onChange={(e) => updateForm({ available_start_date: e.target.value })}
            className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            {t("step6AvailableEndLabel")}
          </label>
          <input
            type="date"
            value={form.available_end_date}
            onChange={(e) => updateForm({ available_end_date: e.target.value })}
            className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      </div>

      {/* Advance Booking */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("step6AdvanceBookingLabel")}
        </label>
        <input
          type="number"
          min={0}
          value={form.advance_booking_days}
          onChange={(e) => updateForm({ advance_booking_days: e.target.value })}
          placeholder="days"
          className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      {/* Desired Destination */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("step6DestinationLabel")}
        </label>
        <input
          type="text"
          value={form.desired_exchange_destination}
          onChange={(e) => updateForm({ desired_exchange_destination: e.target.value })}
          placeholder={t("step6DestinationPlaceholder")}
          className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      {/* Desired Country */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("step6DestinationCountryLabel")}
        </label>
        <input
          type="text"
          value={form.desired_exchange_country}
          onChange={(e) => updateForm({ desired_exchange_country: e.target.value })}
          placeholder="e.g., France, Spain..."
          className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      {/* What you want in return */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("step6DesiredDescriptionLabel")} *
        </label>
        <textarea
          value={form.desired_exchange_description}
          onChange={(e) => updateForm({ desired_exchange_description: e.target.value })}
          placeholder={t("step6DesiredDescriptionPlaceholder")}
          rows={4}
          className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      {/* Escrow */}
      <div className="space-y-2">
        {[
          { key: "step6EscrowAcceptedLabel", field: "escrow_accepted" as const },
          { key: "step6EscrowRequiredLabel", field: "escrow_required" as const },
        ].map(({ key, field }) => (
          <div
            key={field}
            className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800"
          >
            <span className="text-sm text-zinc-900 dark:text-zinc-50">🔐 {t(key)}</span>
            <Toggle
              value={form[field] as boolean}
              onChange={(v) => updateForm({ [field]: v })}
            />
          </div>
        ))}
      </div>

      {/* Security Deposit */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("step6DepositLabel")}
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">€</span>
          <input
            type="number"
            min={0}
            value={form.security_deposit_eur}
            onChange={(e) => updateForm({ security_deposit_eur: e.target.value })}
            placeholder="0"
            className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 pl-7 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      </div>

      {/* Geographic Preference */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
          {t("step6GeoLabel")}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {GEO_PREFERENCES.map((gp) => (
            <button
              key={gp.value}
              type="button"
              onClick={() => updateForm({ swap_geo_preference: gp.value })}
              className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition ${
                form.swap_geo_preference === gp.value
                  ? "border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/30"
                  : "border-zinc-200 bg-white hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-400"
              }`}
            >
              <span className="text-xl">{gp.emoji}</span>
              <span className="text-xs font-medium text-zinc-900 dark:text-zinc-50">
                {t(gp.key)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Partial Swap */}
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
          <span className="text-sm text-zinc-900 dark:text-zinc-50">
            💸 {t("step6PartialAllowedLabel")}
          </span>
          <Toggle
            value={form.swap_partial_allowed}
            onChange={(v) => updateForm({ swap_partial_allowed: v })}
          />
        </div>
        {form.swap_partial_allowed && (
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              {t("step6PartialTopupLabel")}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">€</span>
              <input
                type="number"
                min={0}
                value={form.swap_partial_topup_eur}
                onChange={(e) => updateForm({ swap_partial_topup_eur: e.target.value })}
                placeholder="0"
                className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 pl-7 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>
        )}
      </div>

      {/* Chain Swap */}
      <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
        <span className="text-sm text-zinc-900 dark:text-zinc-50">
          🔗 {t("step6ChainSwapLabel")}
        </span>
        <Toggle
          value={form.chain_swap_allowed}
          onChange={(v) => updateForm({ chain_swap_allowed: v })}
        />
      </div>
    </div>
  );
}
