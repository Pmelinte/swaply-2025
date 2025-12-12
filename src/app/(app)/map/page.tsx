// src/app/(app)/map/page.tsx

"use client";

import { useEffect, useRef, useState } from "react";

type LatLng = { lat: number; lng: number };

declare global {
  interface Window {
    google?: any;
  }
}

const DEFAULT_CENTER: LatLng = { lat: 45.1716, lng: 28.7914 }; // Tulcea-ish (poți schimba)

export default function MapPage() {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [status, setStatus] = useState<string>("Inițializare…");
  const [selected, setSelected] = useState<LatLng>(DEFAULT_CENTER);

  useEffect(() => {
    let cancelled = false;

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      setStatus(
        "Lipsește NEXT_PUBLIC_GOOGLE_MAPS_API_KEY. Adaug-o în Vercel/ENV ca să apară harta.",
      );
      return;
    }

    const initMap = () => {
      if (cancelled) return;

      if (!mapDivRef.current) {
        setStatus("Containerul hărții nu e disponibil.");
        return;
      }

      if (!window.google?.maps) {
        setStatus("Google Maps nu s-a încărcat corect.");
        return;
      }

      setStatus("OK");

      // Create map
      mapRef.current = new window.google.maps.Map(mapDivRef.current, {
        center: selected,
        zoom: 11,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      });

      // Create draggable marker
      markerRef.current = new window.google.maps.Marker({
        position: selected,
        map: mapRef.current,
        draggable: true,
        title: "Locația selectată",
      });

      // Click on map => move marker
      mapRef.current.addListener("click", (e: any) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        const next = { lat, lng };
        setSelected(next);
        markerRef.current.setPosition(next);
      });

      // Drag marker => update state
      markerRef.current.addListener("dragend", (e: any) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setSelected({ lat, lng });
      });
    };

    const loadScript = () => {
      // If already loaded
      if (window.google?.maps) {
        initMap();
        return;
      }

      // Prevent duplicate script tags
      const existing = document.querySelector<HTMLScriptElement>(
        'script[data-google-maps="true"]',
      );
      if (existing) {
        existing.addEventListener("load", initMap, { once: true });
        existing.addEventListener("error", () => {
          setStatus("Eroare la încărcarea scriptului Google Maps.");
        });
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
        apiKey,
      )}&v=weekly`;
      script.async = true;
      script.defer = true;
      script.dataset.googleMaps = "true";

      script.addEventListener("load", initMap, { once: true });
      script.addEventListener("error", () => {
        setStatus("Eroare la încărcarea scriptului Google Maps.");
      });

      document.head.appendChild(script);
    };

    loadScript();

    return () => {
      cancelled = true;
      // not destroying map instance explicitly; ok for this MVP page
    };
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">Hartă (Google) — MVP</h1>
        <div className="text-sm text-gray-600">
          Status: <span className="font-semibold">{status}</span>
        </div>
      </div>

      <div className="text-sm text-gray-700">
        Click pe hartă sau trage markerul. Selectat:{" "}
        <span className="font-mono">
          {selected.lat.toFixed(6)}, {selected.lng.toFixed(6)}
        </span>
      </div>

      <div
        ref={mapDivRef}
        className="w-full h-[65vh] rounded-lg border"
        aria-label="Google Map"
      />
    </div>
  );
}