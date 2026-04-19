"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useMatchingSlots } from "@/hooks/useMatchingSlots";
import { useMatchingResults } from "@/hooks/useMatchingResults";
import { useMatchingAI } from "@/hooks/useMatchingAI";
import { useAppState } from "@/lib/state";
import { MatchingSlots } from "./MatchingSlots";
import { MatchingBrowsing } from "./MatchingBrowsing";
import { MatchingMap } from "./MatchingMap";
import { MatchingAIButton } from "./MatchingAIButton";
import { MatchingSelectedProfiles } from "./MatchingSelectedProfiles";
import { useDrawerStore } from "@/lib/state/drawerStore";
import type { SortOrder } from "@/hooks/useMatchingResults";

export function MatchingPage() {
  const t = useTranslations("matching");
  const router = useRouter();
  const { user } = useAppState();

  const {
    slots,
    selectedProfiles,
    activeSlots,
    hasAnySlot,
    addSelectedProfile,
    removeSelectedProfile,
    removeSlot,
  } = useMatchingSlots();

  const [sort, setSort] = useState<SortOrder>("score");

  const { scoredItems, loading } = useMatchingResults(activeSlots, sort);
  const { suggestions: aiSuggestions, loading: aiLoading, fetchSuggestions } = useMatchingAI(activeSlots);

  // Average score per slot
  const averageScores = useMemo((): [number | null, number | null] => {
    if (!scoredItems.length) return [null, null];
    const avg = Math.round(
      scoredItems.reduce((sum: number, s) => sum + s.score, 0) / scoredItems.length,
    );
    return [slots[0] ? avg : null, slots[1] ? avg : null];
  }, [scoredItems, slots]);

  function handleAddItem() {
    router.push("/explore");
  }

  if (!hasAnySlot) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="text-4xl">🎯</div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{t("emptyTitle")}</h1>
        <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">{t("emptyHint")}</p>
        <button
          type="button"
          onClick={() => router.push("/explore")}
          className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
        >
          {t("goToExplore")}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-4">
      {/* 1. Active slots header */}
      <MatchingSlots
        slots={slots}
        averageScores={averageScores}
        onRemoveSlot={removeSlot}
        onAddItem={handleAddItem}
        onOpenDrawer={() => useDrawerStore.getState().openWith({ type: "explore" })}
      />

      {/* 2. Browsing — cards with scores */}
      <MatchingBrowsing
        slotItems={activeSlots}
        scoredItems={scoredItems}
        aiSuggestions={aiSuggestions}
        loading={loading}
        selectedProfilesCount={selectedProfiles.length}
        onExpressInterest={addSelectedProfile}
        sort={sort}
        onSortChange={setSort}
      />

      {/* 3. Map */}
      {scoredItems.length > 0 && (
        <MatchingMap
          scoredItems={scoredItems}
          selectedProfilesCount={selectedProfiles.length}
          onSelect={addSelectedProfile}
        />
      )}

      {/* 4. AI matching button */}
      <MatchingAIButton
        slotItems={activeSlots}
        onFetch={fetchSuggestions}
        loading={aiLoading}
        profilesCount={selectedProfiles.length}
      />

      {/* 5. Selected profiles */}
      <MatchingSelectedProfiles
        selectedProfiles={selectedProfiles}
        allScoredItems={scoredItems}
        onRefuse={removeSelectedProfile}
      />
    </div>
  );
}
