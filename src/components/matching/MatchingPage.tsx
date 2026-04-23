"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";import { useMatchingSlots } from "@/hooks/useMatchingSlots";
import { useMatchingResults } from "@/hooks/useMatchingResults";
import { useMatchingAI } from "@/hooks/useMatchingAI";
import { useAppState } from "@/lib/state";
import { MatchingSlots } from "./MatchingSlots";
import { MatchingBrowsing } from "./MatchingBrowsing";
import { MatchingMap } from "./MatchingMap";
import { MatchingAIButton } from "./MatchingAIButton";
import { MatchingSelectedProfiles } from "./MatchingSelectedProfiles";
import { MatchingFilterDrawer, DEFAULT_FILTERS } from "./MatchingFilterDrawer";
import type { MatchingFilters } from "./MatchingFilterDrawer";
import type { SortOrder } from "@/hooks/useMatchingResults";

interface Props {
  userId: string;
  initialSlotIds?: [string | null, string | null];
}

export function MatchingPage({ userId, initialSlotIds }: Props) {
  const { items, user } = useAppState();

  const {
    slots,
    selectedProfiles,
    activeSlots,
    addSelectedProfile,
    removeSelectedProfile,
    removeSlot,
    addSlot,
  } = useMatchingSlots();


  const [sort, setSort] = useState<SortOrder>("score");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [filters, setFilters] = useState<MatchingFilters>(DEFAULT_FILTERS);

  // Hydrate slots from URL params on first mount if localStorage is empty
  useEffect(() => {
    if (!initialSlotIds || (!initialSlotIds[0] && !initialSlotIds[1])) return;
    if (slots[0] || slots[1]) return;

    for (const id of initialSlotIds) {
      if (!id) continue;
      const item = items.find((i) => i.id === id);
      if (item) addSlot(item);
    }
  }, [initialSlotIds, items]); // eslint-disable-line react-hooks/exhaustive-deps

  const { scoredItems, loading } = useMatchingResults(
    activeSlots,
    sort,
    filters.category || null,
  );

  const { suggestions: aiSuggestions, loading: aiLoading, fetchSuggestions } = useMatchingAI(activeSlots);

  // General browse items shown when no slots are active
  const generalItems = useMemo(() => {
    if (activeSlots.length > 0) return [];
    return items
      .filter((i) => i.isActive && i.status === "active" && i.ownerId !== user?.id)
      .slice(0, 20);
  }, [items, activeSlots, user]);

  // Average score per slot
  const averageScores = useMemo((): [number | null, number | null] => {
    if (!scoredItems.length) return [null, null];
    const avg = Math.round(
      scoredItems.reduce((sum: number, s) => sum + s.score, 0) / scoredItems.length,
    );
    return [slots[0] ? avg : null, slots[1] ? avg : null];
  }, [scoredItems, slots]);

  return (
    <>
      <MatchingFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        slots={slots}
        filters={filters}
        onFiltersChange={setFilters}
        userId={userId}
      />

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-4 pb-24">
        {/* 1. Slots header */}
        <div>
          <MatchingSlots
            slots={slots}
            averageScores={averageScores}
            onRemoveSlot={removeSlot}
            onOpenDrawer={() => setFilterDrawerOpen(true)}
          />
        </div>

        {/* 2. Browse — scored results or general fallback */}
        <MatchingBrowsing
          slotItems={activeSlots}
          scoredItems={scoredItems}
          aiSuggestions={aiSuggestions}
          generalItems={generalItems}
          loading={loading}
          selectedProfilesCount={selectedProfiles.length}
          onExpressInterest={addSelectedProfile}
          sort={sort}
          onSortChange={setSort}
        />

        {/* 3. Map — always visible */}
        <MatchingMap
          scoredItems={scoredItems}
          selectedProfilesCount={selectedProfiles.length}
          onSelect={addSelectedProfile}
        />

        {/* 4. AI matching button — always visible */}
        <MatchingAIButton
          slotItems={activeSlots}
          onFetch={fetchSuggestions}
          loading={aiLoading}
          profilesCount={selectedProfiles.length}
        />

        {/* 5. Selected profiles — always visible */}
        <MatchingSelectedProfiles
          selectedProfiles={selectedProfiles}
          allScoredItems={scoredItems}
          onRefuse={removeSelectedProfile}
        />
      </div>
    </>
  );
}
