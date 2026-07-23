"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useAppState } from "@/lib/state";
import { GuestBanner } from "@/components/GuestBanner";
import { WantsZone } from "@/components/explore/WantsZone";
import { OffersZone } from "@/components/explore/OffersZone";
import { MapSection } from "@/components/explore/MapSection";
import { TrendingFeed } from "@/components/explore/TrendingFeed";
import { GlobalExploreFeed } from "@/components/explore/GlobalExploreFeed";
import { CategoryPickerSheet } from "@/components/explore/CategoryPickerSheet";
import {
  EXPLORE_APPLY_EVENT,
  type ExploreFilters,
} from "@/components/drawer/variants/DrawerExplore";
import { filtersToSearchParams } from "@/lib/explore/exploreFilters";

export function ExploreClient() {
  const { user } = useAppState();
  const router = useRouter();

  const [addWantOpen, setAddWantOpen] = useState(false);
  const [addOfferOpen, setAddOfferOpen] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const filters = (e as CustomEvent<ExploreFilters>).detail;
      const sp = filtersToSearchParams(filters);
      const qs = sp.toString();
      router.replace(qs ? `/explore?${qs}` : `/explore`, { scroll: false });
    };
    window.addEventListener(EXPLORE_APPLY_EVENT, handler);
    return () => window.removeEventListener(EXPLORE_APPLY_EVENT, handler);
  }, [router]);

  return (
    <>
      {!user && <GuestBanner />}

      <div className="mx-auto max-w-6xl space-y-4 px-4 py-4">
        <WantsZone onAddWant={() => setAddWantOpen(true)} />

        <MapSection />

        <GlobalExploreFeed />

        <TrendingFeed />

        <OffersZone onAddOffer={() => setAddOfferOpen(true)} />
      </div>

      <CategoryPickerSheet
        open={addWantOpen}
        onClose={() => setAddWantOpen(false)}
        intent="want"
      />

      <CategoryPickerSheet
        open={addOfferOpen}
        onClose={() => setAddOfferOpen(false)}
        intent="offer"
      />
    </>
  );
}

export default ExploreClient;
