"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { MapEmbed } from "@/components/maps/MapEmbed";

interface Props {
  // kept for API compatibility but not used for pin rendering
  scoredItems?: unknown[];
  selectedProfilesCount?: number;
  onSelect?: (profile: unknown) => void;
}

export function MatchingMap(_props: Props) {
  const t = useTranslations("matching");
  const [mapCenter, setMapCenter] = useState<
    { lat: number; lng: number; zoom: number } | { center: string; zoom: number }
  >({ center: "Romania", zoom: 6 });

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setMapCenter({ lat: coords.latitude, lng: coords.longitude, zoom: 10 });
      },
      () => {
        // geolocation denied — keep Romania fallback
        setMapCenter({ center: "Romania", zoom: 6 });
      },
    );
  }, []);

  const embedProps =
    "lat" in mapCenter
      ? { lat: mapCenter.lat, lng: mapCenter.lng, zoom: mapCenter.zoom }
      : { center: mapCenter.center, zoom: mapCenter.zoom };

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <h2 className="mb-3 text-base font-bold text-zinc-900 dark:text-zinc-50">
        🗺️ {t("mapTitle")}
      </h2>
      <MapEmbed {...embedProps} height={260} />
      <p className="mt-2 text-xs text-zinc-400">{t("mapHint")}</p>
    </section>
  );
}
