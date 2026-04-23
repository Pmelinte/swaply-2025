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
  onSortChange: (s: SortOrder) => void;
  onOpenItem: (c: ScoredCandidate) => void;
}

const PAGE_SIZE = 12;

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
    if (sort === "relevant") list.sort((a, b) => b.score - a.score);
    else if (sort === "newest") {
      list.sort((a, b) => {
        const ad = a.item.created_at ? new Date(a.item.created_at).getTime() : 0;
        const bd = b.item.created_at ? new Date(b.item.created_at).getTime() : 0;
        return bd - ad;
      });
    } else if (sort === "value_asc") {
      list.sort(
        (a, b) => (a.item.estimated_value ?? Infinity) - (b.item.estimated_value ?? Infinity),
      );
    } else if (sort === "value_desc") {
      list.sort(
        (a, b) => (b.item.estimated_value ?? -Infinity) - (a.item.estimated_value ?? -Infinity),
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
          href="/objects"
          className="text-base font-semibold text-zinc-900 hover:text-blue-600 dark:text-zinc-50 dark:hover:text-blue-400"
        >
          {t("browse_general_title")}
        </Link>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortOrder)}
          className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
        >
          <option value="relevant">{t("sort_relevant")}</option>
          <option value="newest">{t("sort_newest")}</option>
          <option value="value_asc">{t("sort_value_asc")}</option>
          <option value="value_desc">{t("sort_value_desc")}</option>
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">…</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("browse_no_slot_banner")}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {visible.map((c) => (
            <MatchingCard
              key={c.item.id}
              candidate={c}
              showScore={hasSlots}
              onOpen={onOpenItem}
            />
          ))}
        </div>
      )}

      {visibleCount < sorted.length && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
            className="rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {t("browse_load_more")}
          </button>
        </div>
      )}
    </section>
  );
}
