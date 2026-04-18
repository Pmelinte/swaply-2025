"use client";

import { useTranslations } from "next-intl";
import type { PropertyFormData } from "@/lib/wizard/propertyWizardStore";

interface Props {
  form: PropertyFormData;
  updateForm: (updates: Partial<PropertyFormData>) => void;
}

const LOCATION_TYPES = [
  { emoji: "🏙️", key: "step2LocationUrban", value: "Urban" },
  { emoji: "🌾", key: "step2LocationRural", value: "Rural" },
  { emoji: "🌊", key: "step2LocationCoastal", value: "Coastal" },
  { emoji: "⛰️", key: "step2LocationMountain", value: "Mountain" },
  { emoji: "🌲", key: "step2LocationForest", value: "Forest" },
  { emoji: "🏔️", key: "step2LocationIsolated", value: "Isolated" },
];

function toggleMulti(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export function Step2Location({ form, updateForm }: Props) {
  const t = useTranslations("propertyWizard");

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateForm({
          lat: pos.coords.latitude.toFixed(6),
          lon: pos.coords.longitude.toFixed(6),
        });
      },
      () => {/* user denied — silently ignore */},
    );
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("step2Subtitle")}</p>

      {/* Country */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("step2CountryLabel")} *
        </label>
        <input
          type="text"
          value={form.country}
          onChange={(e) => updateForm({ country: e.target.value })}
          placeholder="e.g., Romania"
          className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      {/* Region */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("step2RegionLabel")}
        </label>
        <input
          type="text"
          value={form.region}
          onChange={(e) => updateForm({ region: e.target.value })}
          placeholder="e.g., Transylvania"
          className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      {/* City */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("step2CityLabel")} *
        </label>
        <input
          type="text"
          value={form.city}
          onChange={(e) => updateForm({ city: e.target.value })}
          placeholder="e.g., Cluj-Napoca"
          className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      {/* Address (private) */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("step2AddressLabel")}
        </label>
        <input
          type="text"
          value={form.address_line1}
          onChange={(e) => updateForm({ address_line1: e.target.value })}
          placeholder="Street address (not shown publicly)"
          className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      {/* GPS Coordinates */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {t("step2GpsLabel")}
          </label>
          <button
            type="button"
            onClick={detectLocation}
            className="rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 transition"
          >
            {t("step2DetectLocation")}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            value={form.lat}
            onChange={(e) => updateForm({ lat: e.target.value })}
            placeholder={t("step2LatPlaceholder")}
            className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <input
            type="text"
            value={form.lon}
            onChange={(e) => updateForm({ lon: e.target.value })}
            placeholder={t("step2LonPlaceholder")}
            className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      </div>

      {/* Location Type */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
          {t("step2LocationTypeLabel")}
        </label>
        <div className="flex flex-wrap gap-2">
          {LOCATION_TYPES.map((lt) => (
            <button
              key={lt.value}
              type="button"
              onClick={() =>
                updateForm({ location_type: toggleMulti(form.location_type, lt.value) })
              }
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
                form.location_type.includes(lt.value)
                  ? "bg-blue-600 text-white"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-blue-400"
              }`}
            >
              <span>{lt.emoji}</span>
              <span>{t(lt.key)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Proximity fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { key: "step2ProximitySeaLabel", field: "proximity_sea_km" as const },
          { key: "step2ProximityMountainLabel", field: "proximity_mountain_km" as const },
          { key: "step2ProximityForestLabel", field: "proximity_forest_km" as const },
          { key: "step2DistanceCenterLabel", field: "distance_to_center_km" as const },
        ].map(({ key, field }) => (
          <div key={field}>
            <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
              {t(key)}
            </label>
            <input
              type="number"
              min={0}
              step={0.1}
              value={form[field]}
              onChange={(e) => updateForm({ [field]: e.target.value })}
              placeholder="km"
              className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        ))}
      </div>

      {/* Nearest Airport */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("step2AirportLabel")}
        </label>
        <input
          type="text"
          maxLength={4}
          value={form.nearest_airport_code}
          onChange={(e) => updateForm({ nearest_airport_code: e.target.value.toUpperCase() })}
          placeholder="e.g., CLJ"
          className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>
    </div>
  );
}
