"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ScoredCandidate } from "./MatchingPage";
import type { SortOrder } from "@/lib/matching/matchingStore";
import MatchingCard from "./MatchingCard";

interface Props {
  hasSlots: boolean;
  candidates: ScoredCandidate[];
  loading: boolean;
  sort: SortOrder;
  onSortChange: (sort: SortOrder) => void;
  onOpenItem: (candidate: ScoredCandidate) => void;
}

const PAGE_SIZE = 12;
const SKELETON_SIZE = 4;

function MatchingBrowseSkeleton() {
  return (
    <div
      className="grid grid-cols-2 gap-3 md:grid-cols-4"
      aria-hidden="true"
      data-testid="matching-browse-skeleton"
    >
      {Array.from({ length: SKELETON_SIZE }, (_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
        >
          <div className="aspect-square w-full animate-pulse bg-zinc-100 dark:bg-zinc-800" />
          <div className="space-y-2 p-3">
            <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MatchingBrowse({
  hasSlots,
  candidates,
  loading,
  sort,
  onSortChange,
  onOpenItem,
}: Props) {
  const t = useTranslations("matching");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const sorted = useMemo(() => {
    const list = [...candidates];
    if (sort === "relevant") {
      list.sort((left, right) => right.score - left.score);
    } else if (sort === "newest") {
      list.sort((left, right) => {
        const leftDate = left.item.created_at
          ? new Date(left.item.created_at).getTime()
          : 0;
        const rightDate = right.item.created_at
          ? new Date(right.item.created_at).getTime()
          : 0;
        return rightDate - leftDate;
      });
    } else if (sort === "value_asc") {
      list.sort(
        (left, right) =>
          (left.item.estimated_value ?? left.item.approximate_value ?? Infinity) -
          (right.item.estimated_value ?? right.item.approximate_value ?? Infinity),
      );
    } else if (sort === "value_desc") {
      list.sort(
        (left, right) =>
          (right.item.estimated_value ?? right.item.approximate_value ?? -Infinity) -
          (left.item.estimated_value ?? left.item.approximate_value ?? -Infinity),
      );
    }
    return list;
  }, [candidates, sort]);

  const visible = sorted.slice(0, visibleCount);

  return (
    <section>
      {!hasSlots && (
        <div className="mb-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200">
          {t("browse_no_slot_banner")}
        </div>
      )}

      <div className="mb-3 flex items-center justify-between">
        <Link
          href="/explore"
          className="text-base font-semibold text-zinc-900 hover:text-blue-600 dark:text-zinc-50 dark:hover:text-blue-400"
        >
          {t("browse_general_title")}
        </Link>
        <select
          value={sort}
          onChange={(event) =>
            onSortChange(event.target.value as SortOrder)
          }
          className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
        >
          <option value="relevant">{t("sort_relevant")}</option>
          <option value="newest">{t("sort_newest")}</option>
          <option value="value_asc">{t("sort_value_asc")}</option>
          <option value="value_desc">{t("sort_value_desc")}</option>
        </select>
      </div>

      {loading ? (
        <MatchingBrowseSkeleton />
      ) : visible.length === 0 ? (
        <div className="flex min-h-24 items-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {t("browse_no_slot_banner")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {visible.map((candidate) => (
            <MatchingCard
              key={candidate.item.id}
              candidate={candidate}
              showScore={hasSlots}
              onOpen={onOpenItem}
            />
          ))}
        </div>
      )}

      <div className="mt-4 flex h-10 items-center justify-center">
        {visibleCount < sorted.length && !loading ? (
          <button
            type="button"
            onClick={() => setVisibleCount((value) => value + PAGE_SIZE)}
            className="rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {t("browse_load_more")}
          </button>
        ) : null}
      </div>
    </section>
  );
}
