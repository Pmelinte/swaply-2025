"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { SafeImage } from "@/components/SafeImage";
import { NO_IMAGE_URL } from "@/lib/storage";
import type { MatchingItemRow } from "@/lib/matching/matchQueries";

interface Props {
  ownItems: MatchingItemRow[];
  slot1Item: MatchingItemRow | null;
  slot2Item: MatchingItemRow | null;
  slot1Id: string | null;
  slot2Id: string | null;
  averageScore: number | null;
  onSelectSlot1: (id: string | null) => void;
  onSelectSlot2: (id: string | null) => void;
  onRemoveSlot1: () => void;
  onRemoveSlot2: () => void;
  onOpenFilters: () => void;
}

export default function MatchingSlots({
  ownItems,
  slot1Item,
  slot2Item,
  slot1Id,
  slot2Id,
  averageScore,
  onSelectSlot1,
  onSelectSlot2,
  onRemoveSlot1,
  onRemoveSlot2,
  onOpenFilters,
}: Props) {
  const t = useTranslations("matching");

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
          {t("title")}
        </h1>
        <button
          type="button"
          onClick={onOpenFilters}
          className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {t("filters")}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SlotCard
          item={slot1Item}
          hasId={Boolean(slot1Id)}
          ownItems={ownItems}
          excludedId={slot2Id}
          averageScore={averageScore}
          onSelect={onSelectSlot1}
          onRemove={onRemoveSlot1}
        />
        <SlotCard
          item={slot2Item}
          hasId={Boolean(slot2Id)}
          ownItems={ownItems}
          excludedId={slot1Id}
          averageScore={averageScore}
          onSelect={onSelectSlot2}
          onRemove={onRemoveSlot2}
        />
      </div>
    </div>
  );
}

function SlotCard({
  item,
  hasId,
  ownItems,
  excludedId,
  averageScore,
  onSelect,
  onRemove,
}: {
  item: MatchingItemRow | null;
  hasId: boolean;
  ownItems: MatchingItemRow[];
  excludedId: string | null;
  averageScore: number | null;
  onSelect: (id: string | null) => void;
  onRemove: () => void;
}) {
  const t = useTranslations("matching");

  if (!item) {
    if (hasId) {
      return (
        <div className="flex h-36 items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 bg-white text-xs text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900">
          {t("slot_loading")}
        </div>
      );
    }

    const selectable = ownItems.filter((entry) => entry.id !== excludedId);
    if (selectable.length === 0) {
      return (
        <Link
          href="/explore"
          className="flex h-36 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-zinc-300 bg-white text-sm font-semibold text-zinc-500 transition hover:border-blue-400 hover:bg-blue-50/40 hover:text-blue-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-blue-500 dark:hover:bg-blue-950/30"
        >
          <span className="text-2xl leading-none">+</span>
          <span>{t("slot_add")}</span>
        </Link>
      );
    }

    return (
      <label className="flex h-36 flex-col justify-center rounded-xl border-2 border-dashed border-zinc-300 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <span className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {t("slot_add")}
        </span>
        <select
          aria-label={t("slot_add")}
          value=""
          onChange={(event) => onSelect(event.target.value || null)}
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        >
          <option value="">{t("slot_add")}</option>
          {selectable.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.title} · {entry.item_type}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <div className="relative flex h-36 gap-3 overflow-hidden rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
        <SafeImage
          src={item.photos?.[0] || NO_IMAGE_URL}
          alt={item.title}
          fill
          className="object-cover"
          sizes="112px"
          unoptimized={!item.photos?.[0]}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {item.title}
          </p>
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
            {item.item_type}
            {item.category ? ` · ${item.category}` : ""}
          </p>
        </div>
        {averageScore !== null && (
          <span className="inline-flex w-fit items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
            {t("slot_avg_score", { score: averageScore })}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={() => {
          if (
            typeof window !== "undefined" &&
            !window.confirm(t("slot_remove_confirm"))
          ) {
            return;
          }
          onRemove();
        }}
        aria-label={t("slot_remove_confirm")}
        className="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-zinc-500 shadow-sm hover:bg-white hover:text-red-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:text-red-400"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
