"use client";

import { useTranslations } from "next-intl";
import {
  TRANSPORT_TICKETS_L2,
  SPORTS_TICKETS_L2,
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

function Stepper({ value, min = 0, max = 10, onChange }: { value: number; min?: number; max?: number; onChange: (v: number) => void }) {
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

const SEASONS = [
  { emoji: "🌸", key: "seasonSpring", value: "Spring" },
  { emoji: "☀️", key: "seasonSummer", value: "Summer" },
  { emoji: "🍂", key: "seasonAutumn", value: "Autumn" },
  { emoji: "❄️", key: "seasonWinter", value: "Winter" },
];

const RECURRENCE_OPTIONS = [
  { key: "recOneTime", value: "One-time" },
  { key: "recWeekly", value: "Weekly" },
  { key: "recMonthly", value: "Monthly" },
  { key: "recAnnual", value: "Annual" },
];

const LOCATION_TYPES = [
  { emoji: "🏛️", key: "locIndoor", value: "Indoor" },
  { emoji: "🌿", key: "locOutdoor", value: "Outdoor" },
  { emoji: "🔀", key: "locHybrid", value: "Hybrid" },
];

const TRANSPORT_MODES = [
  { emoji: "✈️", key: "modeAir", value: "Air" },
  { emoji: "🚂", key: "modeRail", value: "Rail" },
  { emoji: "🚢", key: "modeFerry", value: "Ferry/Cruise" },
  { emoji: "🚌", key: "modeBus", value: "Bus" },
  { emoji: "🚗", key: "modeTaxi", value: "Taxi/Rideshare" },
  { emoji: "🚲", key: "modeMicro", value: "Micro" },
];

const ROUTE_EVENT_L2S = ["Road Trip", "Cruise", "Running", "Cycling", "Hiking", "Carpool"];

export function Step2DetailsDateLocation({ form, updateForm }: Props) {
  const t = useTranslations("eventWizard");

  const isTransportTickets = form.event_type_l2 === TRANSPORT_TICKETS_L2;
  const isSportsTickets = form.event_type_l2 === SPORTS_TICKETS_L2;
  const isRouteEvent = ROUTE_EVENT_L2S.includes(form.event_type_l2);

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("step2Subtitle")}</p>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("step2DescriptionLabel")} *
        </label>
        <textarea
          value={form.event_description}
          onChange={(e) => updateForm({ event_description: e.target.value })}
          placeholder={t("step2DescriptionPlaceholder")}
          rows={5}
          maxLength={3000}
          className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {form.event_description.length}/3000
        </p>
      </div>

      {/* Dates & Times */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            {t("step2StartDateLabel")} *
          </label>
          <input
            type="date"
            value={form.start_date}
            onChange={(e) => updateForm({ start_date: e.target.value })}
            className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            {t("step2StartTimeLabel")}
          </label>
          <input
            type="time"
            value={form.start_time}
            onChange={(e) => updateForm({ start_time: e.target.value })}
            className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            {t("step2EndDateLabel")}
          </label>
          <input
            type="date"
            value={form.end_date}
            onChange={(e) => updateForm({ end_date: e.target.value })}
            className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            {t("step2EndTimeLabel")}
          </label>
          <input
            type="time"
            value={form.end_time}
            onChange={(e) => updateForm({ end_time: e.target.value })}
            className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      </div>

      {/* Season */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
          {t("step2SeasonLabel")}
        </label>
        <div className="flex flex-wrap gap-2">
          {SEASONS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => updateForm({ season: toggleMulti(form.season, s.value) })}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
                form.season.includes(s.value)
                  ? "bg-blue-600 text-white"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-blue-400"
              }`}
            >
              <span>{s.emoji}</span>
              <span>{t(s.key)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recurrence */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
          {t("step2RecurrenceLabel")}
        </label>
        <div className="flex flex-wrap gap-2">
          {RECURRENCE_OPTIONS.map((r) => (
            <ToggleChip
              key={r.value}
              label={t(r.key)}
              selected={form.recurrence === r.value}
              onClick={() => updateForm({ recurrence: r.value })}
            />
          ))}
        </div>
      </div>

      {/* Location (if not online) */}
      {!form.is_online && (
        <div className="space-y-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            📍 {t("step2LocationSection")}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={form.country}
              onChange={(e) => updateForm({ country: e.target.value })}
              placeholder={t("step2CountryPlaceholder")}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <input
              type="text"
              value={form.city}
              onChange={(e) => updateForm({ city: e.target.value })}
              placeholder={t("step2CityPlaceholder")}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <input
            type="text"
            value={form.venue_name}
            onChange={(e) => updateForm({ venue_name: e.target.value })}
            placeholder={t("step2VenuePlaceholder")}
            className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <div className="flex gap-3">
            {LOCATION_TYPES.map((lt) => (
              <button
                key={lt.value}
                type="button"
                onClick={() => updateForm({ location_type: lt.value })}
                className={`flex-1 flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition ${
                  form.location_type === lt.value
                    ? "border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/30"
                    : "border-zinc-200 bg-white hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-400"
                }`}
              >
                <span className="text-lg">{lt.emoji}</span>
                <span className="text-xs font-medium text-zinc-900 dark:text-zinc-50">{t(lt.key)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Route (if route event) */}
      {isRouteEvent && (
        <div className="space-y-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            🛣️ {t("step2RouteSection")}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={form.route_start_city}
              onChange={(e) => updateForm({ route_start_city: e.target.value })}
              placeholder={t("step2RouteStartPlaceholder")}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <input
              type="text"
              value={form.route_end_city}
              onChange={(e) => updateForm({ route_end_city: e.target.value })}
              placeholder={t("step2RouteEndPlaceholder")}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <input
            type="number"
            min={0}
            step={0.1}
            value={form.route_total_km}
            onChange={(e) => updateForm({ route_total_km: e.target.value })}
            placeholder={t("step2RouteKmPlaceholder")}
            className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <input
            type="url"
            value={form.route_gpx_url}
            onChange={(e) => updateForm({ route_gpx_url: e.target.value })}
            placeholder="https://... (GPX URL)"
            className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      )}

      {/* Transport tickets specifics */}
      {isTransportTickets && (
        <div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            🎫 {t("step2TransportTicketsSection")}
          </h3>
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              {t("step2TransportModeLabel")}
            </label>
            <div className="flex flex-wrap gap-2">
              {TRANSPORT_MODES.map((tm) => (
                <button
                  key={tm.value}
                  type="button"
                  onClick={() => updateForm({ transport_mode: tm.value })}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    form.transport_mode === tm.value
                      ? "bg-blue-600 text-white"
                      : "border border-zinc-200 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  }`}
                >
                  <span>{tm.emoji}</span>
                  <span>{t(tm.key)}</span>
                </button>
              ))}
            </div>
          </div>
          <input
            type="text"
            value={form.booking_reference}
            onChange={(e) => updateForm({ booking_reference: e.target.value })}
            placeholder={t("step2BookingRefPlaceholder")}
            className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={form.departure_city}
              onChange={(e) => updateForm({ departure_city: e.target.value })}
              placeholder={t("step2DeparturePlaceholder")}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <input
              type="text"
              value={form.arrival_city}
              onChange={(e) => updateForm({ arrival_city: e.target.value })}
              placeholder={t("step2ArrivalPlaceholder")}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={form.seat_class}
              onChange={(e) => updateForm({ seat_class: e.target.value })}
              placeholder={t("step2SeatClassPlaceholder")}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <div>
              <label className="block text-xs text-zinc-600 dark:text-zinc-400 mb-1">{t("step2SeatsAvailable")}</label>
              <Stepper
                value={form.seats_available}
                min={1}
                max={100}
                onChange={(v) => updateForm({ seats_available: v })}
              />
            </div>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">€</span>
            <input
              type="number"
              min={0}
              value={form.face_value_eur}
              onChange={(e) => updateForm({ face_value_eur: e.target.value })}
              placeholder={t("step2FaceValuePlaceholder")}
              className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 pl-7 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-2 dark:border-zinc-700 dark:bg-zinc-800">
            <span className="text-sm text-zinc-900 dark:text-zinc-50">{t("step2TransferableLabel")}</span>
            <Toggle value={form.is_transferable} onChange={(v) => updateForm({ is_transferable: v })} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-2 dark:border-zinc-700 dark:bg-zinc-800">
            <span className="text-sm text-zinc-900 dark:text-zinc-50">{t("step2BaggageLabel")}</span>
            <Toggle value={form.baggage_included} onChange={(v) => updateForm({ baggage_included: v })} />
          </div>
          {form.transport_mode === "Rail" && (
            <>
              <input
                type="text"
                value={form.rail_pass_type}
                onChange={(e) => updateForm({ rail_pass_type: e.target.value })}
                placeholder={t("step2RailPassTypePlaceholder")}
                className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <div className="flex items-center justify-between">
                <label className="text-sm text-zinc-900 dark:text-zinc-50">{t("step2RailPassDaysLabel")}</label>
                <Stepper
                  value={form.rail_pass_days_remaining}
                  min={0}
                  max={30}
                  onChange={(v) => updateForm({ rail_pass_days_remaining: v })}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Sports tickets specifics */}
      {isSportsTickets && (
        <div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            🏟️ {t("step2SportsTicketsSection")}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={form.sport_type}
              onChange={(e) => updateForm({ sport_type: e.target.value })}
              placeholder={t("step2SportTypePlaceholder")}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <input
              type="text"
              value={form.competition_name}
              onChange={(e) => updateForm({ competition_name: e.target.value })}
              placeholder={t("step2CompetitionPlaceholder")}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              value={form.venue_sector}
              onChange={(e) => updateForm({ venue_sector: e.target.value })}
              placeholder="Sector"
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <input
              type="text"
              value={form.venue_row}
              onChange={(e) => updateForm({ venue_row: e.target.value })}
              placeholder="Row"
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <input
              type="text"
              value={form.seat_number}
              onChange={(e) => updateForm({ seat_number: e.target.value })}
              placeholder="Seat"
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">€</span>
            <input
              type="number"
              min={0}
              value={form.face_value_eur}
              onChange={(e) => updateForm({ face_value_eur: e.target.value })}
              placeholder={t("step2FaceValuePlaceholder")}
              className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 pl-7 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-2 dark:border-zinc-700 dark:bg-zinc-800">
            <span className="text-sm text-zinc-900 dark:text-zinc-50">{t("step2HospitalityLabel")}</span>
            <Toggle
              value={form.hospitality_included}
              onChange={(v) => updateForm({ hospitality_included: v })}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-2 dark:border-zinc-700 dark:bg-zinc-800">
            <span className="text-sm text-zinc-900 dark:text-zinc-50">{t("step2TransferableLabel")}</span>
            <Toggle value={form.is_transferable} onChange={(v) => updateForm({ is_transferable: v })} />
          </div>
        </div>
      )}
    </div>
  );
}
