"use client";

import { useTranslations } from "next-intl";

/**
 * Lightweight Google Maps embed — uses the free Embed API (no JS SDK).
 * Falls back to a static placeholder when NEXT_PUBLIC_MAPS_TOKEN is missing.
 *
 * Usage: <MapEmbed center="Cluj-Napoca, Romania" zoom={12} />
 *   or:  <MapEmbed lat={46.77} lng={23.58} zoom={13} />
 */
export function MapEmbed({
  center,
  lat,
  lng,
  zoom = 12,
  height = 240,
}: {
  center?: string;
  lat?: number;
  lng?: number;
  zoom?: number;
  height?: number;
  markers?: Array<{ lat: number; lng: number; label?: string }>;
}) {
  const t = useTranslations("map");
  const mapsToken = process.env.NEXT_PUBLIC_MAPS_TOKEN;

  // Build query for the embed
  const query = center || (lat && lng ? `${lat},${lng}` : null);

  if (!mapsToken || !query) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
        style={{ height }}
      >
        <div className="text-center">
          <p>{t("unavailable")}</p>
          <p className="text-xs">{!mapsToken ? t("apiKeyMissing") : t("unknownLocation")}</p>
        </div>
      </div>
    );
  }

  // Google Maps Embed API — free tier, no billing required for basic embeds
  const embedUrl = `https://www.google.com/maps/embed/v1/place?key=${mapsToken}&q=${encodeURIComponent(query)}&zoom=${zoom}`;

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700" style={{ height }}>
      <iframe
        src={embedUrl}
        width="100%"
        height={height}
        style={{ border: 0 }}
        allowFullScreen={false}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title={t("mapTitle")}
      />
    </div>
  );
}

/**
 * Static map showing multiple markers.
 * Uses Google Embed API (iframe, free tier) centered on the first marker.
 * Falls back gracefully when token is missing or no markers provided.
 */
export function StaticMapWithMarkers({
  markers,
  height = 200,
  zoom = 5,
}: {
  markers: Array<{ lat: number; lng: number; label?: string; color?: string }>;
  height?: number;
  zoom?: number;
}) {
  const t = useTranslations("map");
  const mapsToken = process.env.NEXT_PUBLIC_MAPS_TOKEN;

  if (!mapsToken || markers.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
        style={{ height }}
      >
        {markers.length === 0 ? t("noPins") : t("unavailable")}
      </div>
    );
  }

  const center = markers[0];
  const embedUrl = `https://www.google.com/maps/embed/v1/view?key=${mapsToken}&center=${center.lat},${center.lng}&zoom=${zoom}`;

  return (
    <div className="relative overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
      <iframe
        src={embedUrl}
        width="100%"
        height={height}
        style={{ border: 0 }}
        allowFullScreen={false}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title={t("mapTitle")}
      />
      {/* Marker legend overlay */}
      {markers.length > 1 && (
        <div className="absolute bottom-2 left-2 flex flex-wrap gap-1.5">
          {markers.slice(0, 10).map((m, i) => (
            <span
              key={i}
              className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-md"
              style={{ backgroundColor: m.color === "blue" ? "#3b82f6" : m.color === "green" ? "#22c55e" : m.color === "orange" ? "#f59e0b" : "#ef4444" }}
              title={m.label || ""}
            >
              {m.label?.charAt(0) || ""}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
