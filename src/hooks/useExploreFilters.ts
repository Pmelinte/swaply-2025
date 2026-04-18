"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  DEFAULT_FILTER_STATE,
  type ExploreFilterState,
  type OfferFilters,
  type WantFilters,
  type ProfileFilters,
} from "@/lib/explore/exploreFilterTypes";
import {
  encodeFiltersToParams,
  decodeParamsToFilters,
} from "@/lib/explore/exploreUrlParams";

export function useExploreFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [state, setState] = useState<ExploreFilterState>(() =>
    decodeParamsToFilters(new URLSearchParams(searchParams?.toString() ?? "")),
  );

  // Re-sync when URL changes externally (back/forward)
  useEffect(() => {
    setState(decodeParamsToFilters(new URLSearchParams(searchParams?.toString() ?? "")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const applyToUrl = useCallback(
    (next: ExploreFilterState) => {
      const params = encodeFiltersToParams(next);
      const qs = params.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      router.replace(url, { scroll: false });
    },
    [pathname, router],
  );

  const updateOffer = useCallback((updates: Partial<OfferFilters>) => {
    setState((prev) => ({ ...prev, offer: { ...prev.offer, ...updates } }));
  }, []);

  const updateWant = useCallback((updates: Partial<WantFilters>) => {
    setState((prev) => ({ ...prev, want: { ...prev.want, ...updates } }));
  }, []);

  const updateProfile = useCallback((updates: Partial<ProfileFilters>) => {
    setState((prev) => ({ ...prev, profile: { ...prev.profile, ...updates } }));
  }, []);

  const setTab = useCallback((tab: ExploreFilterState["tab"]) => {
    setState((prev) => ({ ...prev, tab }));
  }, []);

  const reset = useCallback(() => {
    setState(DEFAULT_FILTER_STATE);
  }, []);

  const applyFilters = useCallback(() => {
    applyToUrl(state);
  }, [state, applyToUrl]);

  return {
    state,
    setState,
    updateOffer,
    updateWant,
    updateProfile,
    setTab,
    reset,
    applyFilters,
  };
}
