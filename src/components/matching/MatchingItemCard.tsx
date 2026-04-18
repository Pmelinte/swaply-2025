"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import type { ScoredItem } from "@/hooks/useMatchingResults";

interface Props {
  scored: ScoredItem;
  onSelect: (scored: ScoredItem) => void;
  isAISuggested?: boolean;
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 75
      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      : score >= 50
        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400";

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${color}`}>
      ⭐ {score}%
    </span>
  );
}

export function MatchingItemCard({ scored, onSelect, isAISuggested }: Props) {
  const { item, score } = scored;
  const t = useTranslations("matching");
  const tc = useTranslations("common");

  const thumb = item.photos?.[0];

  return (
    <button
      type="button"
      onClick={() => onSelect(scored)}
      className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white text-left transition hover:border-blue-300 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-blue-600"
    >
      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {thumb ? (
          <Image
            src={thumb}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-2xl text-zinc-300">
            📦
          </div>
        )}
        {isAISuggested && (
          <span className="absolute left-2 top-2 rounded-full bg-purple-600 px-2 py-0.5 text-xs font-semibold text-white shadow">
            🤖 AI
          </span>
        )}
        <div className="absolute right-2 top-2">
          <ScoreBadge score={score} />
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1 p-2">
        <p className="line-clamp-2 text-xs font-semibold text-zinc-800 dark:text-zinc-100">
          {item.title}
        </p>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
          {item.category}
        </p>
        <div className="mt-auto pt-1 text-center text-[10px] font-medium text-blue-600 group-hover:text-blue-700 dark:text-blue-400">
          {tc("view")} →
        </div>
      </div>
    </button>
  );
}
