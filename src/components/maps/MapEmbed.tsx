"use client";

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
  markers,
}: {
  center?: string;
  lat?: number;
  lng?: number;
  zoom?: number;
  height?: number;
  markers?: Array<{ lat: number; lng: number; label?: string }>;
}) {
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
          <p>Harta indisponibila</p>
          <p className="text-xs">{!mapsToken ? "API key lipsa" : "Locatie necunoscuta"}</p>
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
        title="Harta locatie"
      />
    </div>
  );
}

/**
 * Static map showing multiple markers (uses Google Static Maps API).
 * Falls back gracefully when token is missing.
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
  const mapsToken = process.env.NEXT_PUBLIC_MAPS_TOKEN;

  if (!mapsToken || markers.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
        style={{ height }}
      >
        {markers.length === 0 ? "Niciun pin de afisat" : "Harta indisponibila"}
      </div>
    );
  }

  const markerParams = markers
    .slice(0, 20) // max 20 markers for URL length
    .map((m) => {
      const color = m.color || "red";
      const label = m.label?.charAt(0).toUpperCase() || "";
      return `markers=color:${color}|label:${label}|${m.lat},${m.lng}`;
    })
    .join("&");

  const center = markers[0];
  const src = `https://maps.googleapis.com/maps/api/staticmap?center=${center.lat},${center.lng}&zoom=${zoom}&size=600x${height}&${markerParams}&key=${mapsToken}`;

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Harta cu locatii"
        width={600}
        height={height}
        className="w-full object-cover"
        loading="lazy"
      />
    </div>
  );
}
