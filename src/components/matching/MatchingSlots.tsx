"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X, Plus } from "lucide-react";
import type { Item } from "@/lib/types";

interface Props {
  slots: [Item | null, Item | null];
  averageScores: [number | null, number | null];
  onRemoveSlot: (itemId: string) => void;
  onAddItem: () => void;
  onOpenDrawer: () => void;
}

function SlotCard({
  item,
  avgScore,
  onRemove,
}: {
  item: Item;
  avgScore: number | null;
  onRemove: () => void;
}) {
  const t = useTranslations("matching");
  const tc = useTranslations("common");
  const [confirmRemove, setConfirmRemove] = useState(false);

  if (confirmRemove) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border-2 border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/30">
        <p className="text-xs font-medium text-red-700 dark:text-red-300">{t("confirmRemoveSlot")}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setConfirmRemove(false)}
            className="flex-1 rounded-lg border border-zinc-200 py-1.5 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
          >
            {tc("cancel")}
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="flex-1 rounded-lg bg-red-500 py-1.5 text-xs font-semibold text-white"
          >
            {tc("yes")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 rounded-2xl border-2 border-blue-200 bg-blue-50/60 p-3 dark:border-blue-800 dark:bg-blue-950/30">
      <div className="flex items-start justify-between gap-1">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="text-base">📦</span>
          <p className="line-clamp-2 text-xs font-semibold text-zinc-800 dark:text-zinc-100">
            {item.title}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setConfirmRemove(true)}
          className="shrink-0 rounded-full p-0.5 text-zinc-400 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30"
          aria-label="Remove slot"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{item.category}</p>
      {avgScore !== null && (
        <p className="text-[10px] font-semibold text-blue-700 dark:text-blue-400">
          {t("avgScore")}: {avgScore}%
        </p>
      )}
    </div>
  );
}

function EmptySlot({ onAdd, disabled }: { onAdd: () => void; disabled: boolean }) {
  const t = useTranslations("matching");
  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={disabled}
      className="flex h-full min-h-[90px] flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/30 text-center transition hover:border-blue-400 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-blue-800 dark:bg-blue-950/20 dark:hover:border-blue-600"
    >
      <Plus className="h-5 w-5 text-blue-400" />
      <span className="text-xs text-blue-500 dark:text-blue-400">{t("slotAddLink")}</span>
    </button>
  );
}

export function MatchingSlots({ slots, averageScores, onRemoveSlot, onAddItem, onOpenDrawer }: Props) {
  const t = useTranslations("matching");

  return (
    <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-b from-blue-50 to-white p-4 dark:border-blue-800 dark:from-blue-950/40 dark:to-zinc-900">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">🎯 {t("title")}</h1>
        <button
          type="button"
          onClick={onOpenDrawer}
          className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {t("filters")}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {slots[0] ? (
          <SlotCard
            item={slots[0]}
            avgScore={averageScores[0]}
            onRemove={() => onRemoveSlot(slots[0]!.id)}
          />
        ) : (
          <EmptySlot onAdd={onAddItem} disabled={false} />
        )}
        {slots[1] ? (
          <SlotCard
            item={slots[1]}
            avgScore={averageScores[1]}
            onRemove={() => onRemoveSlot(slots[1]!.id)}
          />
        ) : (
          <EmptySlot onAdd={onAddItem} disabled={!slots[0]} />
        )}
      </div>
    </div>
  );
}
