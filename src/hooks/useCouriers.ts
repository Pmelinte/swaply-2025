"use client";

import { useState, useEffect } from "react";

export interface CourierOption {
  name: string;
  websiteUrl: string;
  logoUrl: string | null;
  countryCode: string | null;
  type: "domestic" | "international";
}

/**
 * Fetches courier options from /api/services/couriers.
 * Returns domestic couriers for both countries + international couriers.
 */
export function useCouriers(
  userCountry?: string,
  partnerCountry?: string,
): { couriers: CourierOption[]; loading: boolean } {
  const [couriers, setCouriers] = useState<CourierOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (userCountry) params.set("country", userCountry);
    if (partnerCountry && partnerCountry !== userCountry) {
      params.set("country2", partnerCountry);
    }

    const url = `/api/services/couriers${params.toString() ? `?${params}` : ""}`;

    let cancelled = false;
    setLoading(true);

    fetch(url)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.couriers) {
          setCouriers(data.couriers);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [userCountry, partnerCountry]);

  return { couriers, loading };
}
