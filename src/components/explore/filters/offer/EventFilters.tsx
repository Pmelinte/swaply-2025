"use client";

import { useTranslations } from "next-intl";
import { CategoryL1Picker } from "@/components/explore/filters/shared/CategoryL1Picker";
import type { OfferFilters } from "@/lib/explore/exploreFilterTypes";

interface Props {
  filters: OfferFilters;
  onChange: (updates: Partial<OfferFilters>) => void;
}

const EVENT_L1 = [
  { emoji: "🌍", value: "Travel & Vacations", label: "Travel" },
  { emoji: "🎫", value: "Tickets & Access", label: "Tickets" },
  { emoji: "📚", value: "Courses & Workshops", label: "Courses" },
  { emoji: "🏃", value: "Sports & Outdoor", label: "Sports" },
  { emoji: "🎵", value: "Concerts & Festivals", label: "Concerts" },
  { emoji: "💼", value: "Conferences & Business", label: "Confs" },
  { emoji: "✨", value: "Experiences", label: "Experiences" },
  { emoji: "👥", value: "Group Activities", label: "Groups" },
  { emoji: "🚗", value: "Transport & Shared Travel", label: "Transport" },
  { emoji: "🏠", value: "Accommodation & Home Swap", label: "Home Swap" },
  { emoji: "🍽️", value: "Food & Catering", label: "Food" },
  { emoji: "🧘", value: "Wellness & Retreats", label: "Wellness" },
];

const CAPACITY_BUCKETS = [
  { key: "cap1", value: "1" },
  { key: "cap2to4", value: "2-4" },
  { key: "cap5to10", value: "5-10" },
  { key: "cap10plus", value: "10+" },
];

const INCLUDES = [
  { emoji: "🚗", key: "incTransport", value: "transport" },
  { emoji: "🏠", key: "incAccommodation", value: "accommodation" },
  { emoji: "🍽️", key: "incMeals", value: "meals" },
  { emoji: "🎒", key: "incEquipment", value: "equipment" },
];

function toggleMulti(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export function EventFilters({ filters, onChange }: Props) {
  const t = useTranslations("exploreDrawer");

  return (
    <div className="space-y-5">
      {/* Event category */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("eventCategoryLabel")}
        </label>
        <CategoryL1Picker
          options={EVENT_L1}
          value={filters.category_l1}
          onChange={(v) => onChange({ category_l1: v })}
        />
      </div>

      {/* Location + Online */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {t("locationSectionLabel")}
        </label>
        <input
          type="text"
          value={filters.city}
          onChange={(e) => onChange({ city: e.target.value })}
          placeholder={t("locationCityPlaceholder")}
          disabled={filters.event_online}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 disabled:opacity-50"
        />
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.event_online}
            onChange={(e) => onChange({ event_online: e.target.checked })}
            className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-zinc-700 dark:text-zinc-200">🌐 {t("eventOnlineLabel")}</span>
        </label>
      </div>

      {/* Date range */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("dateRangeLabel")}
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

      {/* Capacity */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("capacityLabel")}
        </label>
        <div className="flex flex-wrap gap-2">
          {CAPACITY_BUCKETS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() =>
                onChange({ capacity_bucket: filters.capacity_bucket === c.value ? null : c.value })
              }
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                filters.capacity_bucket === c.value
                  ? "bg-blue-600 text-white"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              }`}
            >
              {t(c.key)}
            </button>
          ))}
        </div>
      </div>

      {/* Includes */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("includesLabel")}
        </label>
        <div className="flex flex-wrap gap-2">
          {INCLUDES.map((i) => (
            <label
              key={i.value}
              className="flex items-center gap-2 cursor-pointer rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            >
              <input
                type="checkbox"
                checked={filters.includes.includes(i.value)}
                onChange={() => onChange({ includes: toggleMulti(filters.includes, i.value) })}
                className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-zinc-700 dark:text-zinc-200">
                {i.emoji} {t(i.key)}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
