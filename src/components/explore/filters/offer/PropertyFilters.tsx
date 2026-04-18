"use client";

import { useTranslations } from "next-intl";
import type { OfferFilters } from "@/lib/explore/exploreFilterTypes";

interface Props {
  filters: OfferFilters;
  onChange: (updates: Partial<OfferFilters>) => void;
}

const PROPERTY_TYPES = [
  { key: "pHouse", value: "House" },
  { key: "pApartment", value: "Apartment" },
  { key: "pVilla", value: "Villa" },
  { key: "pCabin", value: "Cabin" },
  { key: "pFarm", value: "Farm" },
  { key: "pOther", value: "Other" },
];

const PROXIMITY = [
  { emoji: "🌊", key: "proxSea", value: "Coastal" },
  { emoji: "⛰️", key: "proxMountain", value: "Mountain" },
  { emoji: "🌲", key: "proxForest", value: "Forest" },
  { emoji: "🌾", key: "proxRural", value: "Rural" },
  { emoji: "🏙️", key: "proxUrban", value: "Urban" },
];

const AMENITIES = [
  { key: "amenPool", value: "pool" },
  { key: "amenGarden", value: "garden" },
  { key: "amenParking", value: "parking" },
  { key: "amenWifi", value: "wifi" },
  { key: "amenSauna", value: "sauna" },
  { key: "amenHotTub", value: "hot_tub" },
];

function toggleMulti(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

function Stepper({
  value,
  onChange,
  max = 10,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  max?: number;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(value === n ? null : n)}
          className={`h-8 w-8 rounded-full text-xs font-semibold transition ${
            value === n
              ? "bg-blue-600 text-white"
              : "border border-zinc-200 bg-white text-zinc-700 hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          }`}
        >
          {n === 5 ? `${n}+` : n}
        </button>
      ))}
    </div>
  );
}

export function PropertyFilters({ filters, onChange }: Props) {
  const t = useTranslations("exploreDrawer");

  return (
    <div className="space-y-5">
      {/* Property type */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("propertyTypeLabel")}
        </label>
        <div className="flex flex-wrap gap-2">
          {PROPERTY_TYPES.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() =>
                onChange({ property_type: filters.property_type === p.value ? null : p.value })
              }
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                filters.property_type === p.value
                  ? "bg-blue-600 text-white"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              }`}
            >
              {t(p.key)}
            </button>
          ))}
        </div>
      </div>

      {/* Location country/city */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("locationSectionLabel")}
        </label>
        <input
          type="text"
          value={filters.city}
          onChange={(e) => onChange({ city: e.target.value })}
          placeholder={t("locationCityPlaceholder")}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      {/* Proximity */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("proximityLabel")}
        </label>
        <div className="flex flex-wrap gap-2">
          {PROXIMITY.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => onChange({ proximity: toggleMulti(filters.proximity, p.value) })}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                filters.proximity.includes(p.value)
                  ? "bg-blue-600 text-white"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              }`}
            >
              <span>{p.emoji}</span>
              <span>{t(p.key)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bedrooms / Bathrooms */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            {t("bedroomsLabel")}
          </label>
          <Stepper value={filters.bedrooms} onChange={(v) => onChange({ bedrooms: v })} />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            {t("bathroomsLabel")}
          </label>
          <Stepper value={filters.bathrooms} onChange={(v) => onChange({ bathrooms: v })} />
        </div>
      </div>

      {/* Area range */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("areaLabel")}
        </label>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            min={0}
            value={filters.area_min ?? ""}
            onChange={(e) =>
              onChange({ area_min: e.target.value ? parseInt(e.target.value) : null })
            }
            placeholder={t("areaMinPlaceholder")}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <input
            type="number"
            min={0}
            value={filters.area_max ?? ""}
            onChange={(e) =>
              onChange({ area_max: e.target.value ? parseInt(e.target.value) : null })
            }
            placeholder={t("areaMaxPlaceholder")}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      </div>

      {/* Amenities */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("amenitiesLabel")}
        </label>
        <div className="flex flex-wrap gap-2">
          {AMENITIES.map((a) => (
            <label
              key={a.value}
              className="flex items-center gap-2 cursor-pointer rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            >
              <input
                type="checkbox"
                checked={filters.amenities.includes(a.value)}
                onChange={() => onChange({ amenities: toggleMulti(filters.amenities, a.value) })}
                className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-zinc-700 dark:text-zinc-200">{t(a.key)}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("availabilityLabel")}
        </label>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="date"
            value={filters.available_from}
            onChange={(e) => onChange({ available_from: e.target.value })}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <input
            type="date"
            value={filters.available_to}
            onChange={(e) => onChange({ available_to: e.target.value })}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      </div>
    </div>
  );
}
