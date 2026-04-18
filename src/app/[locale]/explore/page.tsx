"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { GuestBanner } from "@/components/GuestBanner";
import { WantsZone } from "@/components/explore/WantsZone";
import { OffersZone } from "@/components/explore/OffersZone";
import { MapSection } from "@/components/explore/MapSection";
import {
  ExploreFilterDrawer,
  type ExploreFilters,
} from "@/components/explore/ExploreFilterDrawer";
import { CategoryPickerSheet } from "@/components/explore/CategoryPickerSheet";
import {
  filtersToSearchParams,
  searchParamsToFilters,
} from "@/lib/explore/exploreFilters";

export default function ExplorePage() {
  const { user } = useAppState();
  const t = useTranslations("nav");
  const te = useTranslations("explore");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filterOpen, setFilterOpen] = useState(false);
  const [addWantOpen, setAddWantOpen] = useState(false);
  const [addOfferOpen, setAddOfferOpen] = useState(false);

  // Hydrate filters from the URL so bookmarks and shared links render consistently
  const initialFilters = useMemo<ExploreFilters>(
    () => searchParamsToFilters(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  // Sync back to URL whenever the user applies new filters
  const handleApply = (filters: ExploreFilters) => {
    const sp = filtersToSearchParams(filters);
    const qs = sp.toString();
    router.replace(qs ? `/explore?${qs}` : `/explore`, { scroll: false });
    setFilterOpen(false);
  };

  return (
    <>
      {!user && <GuestBanner />}

      <div className="mx-auto max-w-6xl space-y-4 px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{t("explore")}</h1>
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
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

      <ExploreFilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApply={handleApply}
        initialFilters={initialFilters}
      />

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
