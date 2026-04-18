"use client";

import { useTranslations } from "next-intl";

interface Props {
  city: string;
  radiusKm: number;
  onCityChange: (city: string) => void;
  onRadiusChange: (radius: number) => void;
  maxRadius?: number;
}

export function LocationFilter({
  city,
  radiusKm,
  onCityChange,
  onRadiusChange,
  maxRadius = 200,
}: Props) {
  const t = useTranslations("exploreDrawer");

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          {t("locationCityLabel")}
        </label>
        <input
          type="text"
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          placeholder={t("locationCityPlaceholder")}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>
      <div>
        <label className="flex items-center justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          <span>{t("locationRadiusLabel")}</span>
          <span className="font-semibold text-blue-600 dark:text-blue-400">{radiusKm} km</span>
        </label>
        <input
          type="range"
          min={0}
          max={maxRadius}
          step={5}
          value={radiusKm}
          onChange={(e) => onRadiusChange(parseInt(e.target.value))}
          className="w-full accent-blue-600"
        />
      </div>
    </div>
  );
}
