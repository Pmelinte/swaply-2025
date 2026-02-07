"use client";

import { MapPinOff } from "lucide-react";
import { useAppState } from "@/lib/state";
import { MapEmbed } from "@/components/maps/MapEmbed";

export function MapPreview() {
  const { featureToggles, user } = useAppState();
  const mapsToken = process.env.NEXT_PUBLIC_MAPS_TOKEN;

  if (!featureToggles.mapsEnabled && !mapsToken) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-200">
        <MapPinOff className="h-5 w-5" />
        <div>
          <p className="font-semibold text-zinc-800 dark:text-zinc-100">Harta indisponibila</p>
          <p>Map provider dezactivat. Restul paginii ramane utilizabil.</p>
        </div>
      </div>
    );
  }

  // Use user location if available, otherwise default to Romania center
  const city = user?.location?.city;
  const lat = user?.location?.coordinates?.lat;
  const lng = user?.location?.coordinates?.lng;
  const center = city || (lat && lng ? `${lat},${lng}` : "Romania");

  return (
    <div className="space-y-2">
      <MapEmbed center={center} zoom={city ? 12 : 6} height={240} />
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {city
          ? `Zona ta: ${city}. Utilizatorii Premium si Platinum sunt vizibili pe harta.`
          : "Adauga locatia in profil pentru a vedea utilizatori din zona ta."}
      </p>
    </div>
  );
}
