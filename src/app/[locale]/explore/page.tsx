"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { GuestBanner } from "@/components/GuestBanner";
import { WantsZone } from "@/components/explore/WantsZone";
import { OffersZone } from "@/components/explore/OffersZone";
import { MapSection } from "@/components/explore/MapSection";
import { ExploreFilterDrawer } from "@/components/explore/ExploreFilterDrawer";
import { CategoryPickerSheet } from "@/components/explore/CategoryPickerSheet";
import type { ExploreFilters } from "@/components/explore/ExploreFilterDrawer";

export default function ExplorePage() {
  const { user } = useAppState();
  const t = useTranslations("nav");

  const [filterOpen, setFilterOpen] = useState(false);
  const [addWantOpen, setAddWantOpen] = useState(false);
  const [addOfferOpen, setAddOfferOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_appliedFilters, setAppliedFilters] = useState<ExploreFilters | null>(null);

  return (
    <>
      {!user && <GuestBanner />}

      <div className="mx-auto max-w-6xl space-y-4 px-4 py-4">
        {/* ── Page header ── */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{t("explore")}</h1>
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            aria-label="Open filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>

        {/* ── Wants zone ── */}
        <WantsZone onAddWant={() => setAddWantOpen(true)} />

        {/* ── Map (collapsible) ── */}
        <MapSection />

        {/* ── Offers zone ── */}
        <OffersZone onAddOffer={() => setAddOfferOpen(true)} />
      </div>

      {/* ── Overlays ── */}
      <ExploreFilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApply={(filters) => {
          setAppliedFilters(filters);
          setFilterOpen(false);
        }}
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
