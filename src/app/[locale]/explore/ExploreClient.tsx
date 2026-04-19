"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { GuestBanner } from "@/components/GuestBanner";
import { WantsZone } from "@/components/explore/WantsZone";
import { OffersZone } from "@/components/explore/OffersZone";
import { MapSection } from "@/components/explore/MapSection";
import { CategoryPickerSheet } from "@/components/explore/CategoryPickerSheet";
import { useDrawerStore } from "@/lib/state/drawerStore";
import {
  EXPLORE_APPLY_EVENT,
  type ExploreFilters,
} from "@/components/drawer/variants/DrawerExplore";
import { filtersToSearchParams } from "@/lib/explore/exploreFilters";

export function ExploreClient() {
  const { user } = useAppState();
  const t = useTranslations("nav");
  const te = useTranslations("explore");
  const router = useRouter();

  const [addWantOpen, setAddWantOpen] = useState(false);
  const [addOfferOpen, setAddOfferOpen] = useState(false);

  // Apply filters when DrawerExplore dispatches the event
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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{t("explore")}</h1>
          <button
            type="button"
            onClick={() => useDrawerStore.getState().openWith({ type: "explore" })}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            aria-label="Open filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">{te("filterDrawer.title")}</span>
          </button>
        </div>

        <WantsZone onAddWant={() => setAddWantOpen(true)} />

        <MapSection />

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
