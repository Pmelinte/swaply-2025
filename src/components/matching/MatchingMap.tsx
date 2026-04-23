"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { ScoredCandidate } from "./MatchingPage";

interface Props {
  candidates: ScoredCandidate[];
}

declare global {
  interface Window {
    google?: {
      maps?: {
        Map: new (el: HTMLElement, opts: Record<string, unknown>) => unknown;
        Marker: new (opts: Record<string, unknown>) => unknown;
        SymbolPath?: { CIRCLE: number };
      };
    };
  }
}

let mapsLoader: Promise<void> | null = null;

function loadGoogleMaps(apiKey: string): Promise<void> {
  if (mapsLoader) return mapsLoader;
  if (typeof window === "undefined") return Promise.reject(new Error("no-window"));
  if (window.google?.maps) return Promise.resolve();

  mapsLoader = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-loader="gmaps"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("gmaps-load-failed")));
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.dataset.loader = "gmaps";
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () => reject(new Error("gmaps-load-failed")));
    document.head.appendChild(script);
  });

  return mapsLoader;
}

export default function MatchingMap({ candidates }: Props) {
  const t = useTranslations("matching");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<unknown>(null);
  const markersRef = useRef<unknown[]>([]);
  const [center, setCenter] = useState<{ lat: number; lng: number; zoom: number }>({
    lat: 45.9,
    lng: 24.9,
    zoom: 6,
  });
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude, zoom: 10 }),
      () => {
        // user denied — keep Romania fallback
      },
      { timeout: 6000 },
    );
  }, []);

  useEffect(() => {
    if (!apiKey) {
      setError("no-key");
      return;
    }
    let cancelled = false;
    loadGoogleMaps(apiKey)
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        if (!cancelled) setError("load-failed");
      });
    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  useEffect(() => {
    if (!ready || !containerRef.current || !window.google?.maps) return;
    if (!mapRef.current) {
      mapRef.current = new window.google.maps.Map(containerRef.current, {
        center: { lat: center.lat, lng: center.lng },
        zoom: center.zoom,
        disableDefaultUI: true,
        zoomControl: true,
      });
    } else {
      const map = mapRef.current as { setCenter?: (p: unknown) => void; setZoom?: (z: number) => void };
      map.setCenter?.({ lat: center.lat, lng: center.lng });
      map.setZoom?.(center.zoom);
    }
  }, [ready, center]);

  useEffect(() => {
    if (!ready || !mapRef.current || !window.google?.maps) return;
    // Clear old markers
    for (const m of markersRef.current) {
      const marker = m as { setMap?: (v: unknown) => void };
      marker.setMap?.(null);
    }
    markersRef.current = [];

    for (const c of candidates) {
      const lat = c.profile?.address_lat;
      const lng = c.profile?.address_lon;
      if (lat == null || lng == null) continue;
      const color = c.score >= 75 ? "#16a34a" : c.score >= 50 ? "#eab308" : "#9ca3af";
      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map: mapRef.current,
        title: c.item.title,
        icon: window.google.maps.SymbolPath
          ? {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: color,
              fillOpacity: 0.9,
              strokeWeight: 1,
              strokeColor: "#ffffff",
            }
          : undefined,
      });
      markersRef.current.push(marker);
    }
  }, [ready, candidates]);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">
        {t("map_title")}
      </h2>
      {error ? (
        <div className="flex h-56 items-center justify-center rounded-xl bg-zinc-50 text-sm text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          {t("map_no_candidates")}
        </div>
      ) : (
        <div ref={containerRef} className="h-56 w-full rounded-xl bg-zinc-100 dark:bg-zinc-800" />
      )}
    </section>
  );
}
