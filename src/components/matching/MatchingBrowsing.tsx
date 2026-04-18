"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { MatchingItemCard } from "./MatchingItemCard";
import { MatchingItemModal } from "./MatchingItemModal";
import type { ScoredItem } from "@/hooks/useMatchingResults";
import type { SelectedProfile } from "@/lib/matching/matchingStore";
import type { Item } from "@/lib/types";

type SortOrder = "score" | "newest" | "value_asc" | "value_desc";

interface Props {
  slotItems: Item[];
  scoredItems: ScoredItem[];
  aiSuggestions: ScoredItem[];
  loading: boolean;
  selectedProfilesCount: number;
  onExpressInterest: (profile: SelectedProfile) => void;
  sort: SortOrder;
  onSortChange: (sort: SortOrder) => void;
}

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: "score", label: "Best Match" },
  { value: "newest", label: "Newest" },
  { value: "value_asc", label: "Value ↑" },
  { value: "value_desc", label: "Value ↓" },
];

const PAGE_SIZE = 12;

export function MatchingBrowsing({
  slotItems,
  scoredItems,
  aiSuggestions,
  loading,
  selectedProfilesCount,
  onExpressInterest,
  sort,
  onSortChange,
}: Props) {
  const t = useTranslations("matching");
  const tc = useTranslations("common");
  const [selectedScored, setSelectedScored] = useState<ScoredItem | null>(null);
  const [page, setPage] = useState(1);

  const slotLabel = slotItems.map((i) => i.title).join(", ");
  const visible = scoredItems.slice(0, page * PAGE_SIZE);
  const hasMore = scoredItems.length > page * PAGE_SIZE;

  const allVisible = [
    ...aiSuggestions,
    ...visible.filter((s) => !aiSuggestions.some((ai) => ai.item.id === s.item.id)),
  ];

  if (!slotItems.length) return null;

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
            🔍 {t("resultsFor")}: <span className="text-blue-600">{slotLabel}</span>
          </h2>
          {!loading && (
            <p className="text-xs text-zinc-400">
              {scoredItems.length} {t("candidatesFound")}
            </p>
          )}
        </div>
        <select
          value={sort}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { onSortChange(e.target.value as SortOrder); setPage(1); }}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && scoredItems.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-zinc-200 p-8 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-500">{t("noResults")}</p>
        </div>
      )}

      {/* Cards grid */}
      {!loading && allVisible.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {allVisible.map((scored) => (
              <MatchingItemCard
                key={scored.item.id}
                scored={scored}
                onSelect={setSelectedScored}
                isAISuggested={aiSuggestions.some((ai: ScoredItem) => ai.item.id === scored.item.id)}
              />
            ))}
          </div>

          {hasMore && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                className="rounded-full border border-zinc-200 px-5 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                {t("loadMore")} →
              </button>
            </div>
          )}
        </>
      )}

      {/* Item detail modal */}
      <MatchingItemModal
        scored={selectedScored}
        onClose={() => setSelectedScored(null)}
        onExpressInterest={onExpressInterest}
        onIgnore={() => setSelectedScored(null)}
        profilesCount={selectedProfilesCount}
      />
    </section>
  );
}
