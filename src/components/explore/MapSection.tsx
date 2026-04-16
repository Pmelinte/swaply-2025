"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { MapEmbed } from "@/components/maps/MapEmbed";
import { useTranslations } from "next-intl";

type MapMode = "wants" | "offers";

export function MapSection() {
  const t = useTranslations("explore");
  const [expanded, setExpanded] = useState(true);
  const [mapMode, setMapMode] = useState<MapMode>("wants");

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      {/* Toggle pill + collapse */}
      <div className="flex items-center justify-between px-4 py-3">
        {/* Wants | Offers pill */}
        <div className="inline-flex rounded-full border border-zinc-200 dark:border-zinc-700">
          <button
            type="button"
            onClick={() => setMapMode("wants")}
            className={`rounded-l-full px-4 py-1.5 text-xs font-semibold transition ${
              mapMode === "wants"
                ? "bg-blue-600 text-white"
                : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            }`}
          >
            {t("mapToggleWants")}
          </button>
          <button
            type="button"
            onClick={() => setMapMode("offers")}
            className={`rounded-r-full px-4 py-1.5 text-xs font-semibold transition ${
              mapMode === "offers"
                ? "bg-emerald-600 text-white"
                : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            }`}
          >
            {t("mapToggleOffers")}
          </button>
        </div>

        {/* Collapse / expand */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          aria-label={expanded ? t("mapCollapse") : t("mapExpand")}
        >
          {expanded ? (
            <>
              {t("mapCollapse")} <ChevronUp className="h-3.5 w-3.5" />
            </>
          ) : (
            <>
              {t("mapExpand")} <ChevronDown className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </div>

      {/* Map embed */}
      {expanded && (
        <div className="px-4 pb-4">
          <MapEmbed
            center="Romania"
            zoom={6}
            height={260}
          />
          <p className="mt-2 text-center text-xs text-zinc-400 dark:text-zinc-500">
            {mapMode === "wants"
              ? "Showing wants in your area"
              : "Showing offers in your area"}
          </p>
        </div>
      )}
    </div>
  );
}
