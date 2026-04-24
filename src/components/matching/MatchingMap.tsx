"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp } from "lucide-react";
import { MapEmbed } from "@/components/maps/MapEmbed";
import type { ScoredCandidate } from "./MatchingPage";

interface Props {
  candidates: ScoredCandidate[];
}

type Center =
  | { kind: "coords"; lat: number; lng: number; zoom: number }
  | { kind: "name"; center: string; zoom: number };

const ROMANIA_FALLBACK: Center = { kind: "name", center: "Romania", zoom: 6 };

export default function MatchingMap({ candidates }: Props) {
  const t = useTranslations("matching");
  const tExplore = useTranslations("explore");
  const [expanded, setExpanded] = useState(true);
  const [center, setCenter] = useState<Center>(ROMANIA_FALLBACK);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setCenter({
          kind: "coords",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          zoom: 10,
        }),
      () => {
        // user denied — keep Romania fallback
      },
      { timeout: 6000 },
    );
  }, []);

  const pinCount = useMemo(
    () =>
      candidates.filter(
        (c) => c.profile?.address_lat != null && c.profile?.address_lon != null,
      ).length,
    [candidates],
  );

  const embedProps =
    center.kind === "coords"
      ? { lat: center.lat, lng: center.lng, zoom: center.zoom }
      : { center: center.center, zoom: center.zoom };

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          {t("map_title")}
        </h2>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          aria-label={expanded ? tExplore("mapCollapse") : tExplore("mapExpand")}
        >
          {expanded ? (
            <>
              {tExplore("mapCollapse")} <ChevronUp className="h-3.5 w-3.5" />
            </>
          ) : (
            <>
              {tExplore("mapExpand")} <ChevronDown className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4">
          <MapEmbed {...embedProps} height={260} />
          <p className="mt-2 text-center text-xs text-zinc-400 dark:text-zinc-500">
            {pinCount === 0 ? t("map_no_candidates") : t("map_you_are_here")}
          </p>
        </div>
      )}
    </section>
  );
}
