"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SafeImage } from "@/components/SafeImage";
import { NO_IMAGE_URL } from "@/lib/storage";
import type { ScoredCandidate } from "./MatchingPage";

interface Props {
  candidate: ScoredCandidate;
  showScore: boolean;
  onOpen: (c: ScoredCandidate) => void;
}

export default function MatchingCard({ candidate, showScore, onOpen }: Props) {
  const t = useTranslations("matching");
  const { item, score } = candidate;

  const badgeClass =
    score >= 75
      ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200"
      : score >= 50
        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200"
        : "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200";

  return (
    <div className="group relative" data-testid={`matching-candidate-${item.id}`}>
      <Link
        href={`/objects/${item.id}`}
        className="block overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900"
      >
        <div className="relative aspect-square w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
          <SafeImage
            src={item.photos?.[0] || NO_IMAGE_URL}
            alt={item.title}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 25vw, 50vw"
            unoptimized={!item.photos?.[0]}
          />
          {showScore && (
            <span
              className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-semibold ${badgeClass}`}
            >
              {score}%
            </span>
          )}
        </div>
        <div className="p-3">
          <p className="line-clamp-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {item.title}
          </p>
          {item.category && (
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{item.category}</p>
          )}
        </div>
      </Link>
      {showScore && (
        <button
          type="button"
          data-testid={`matching-candidate-details-${item.id}`}
          onClick={() => onOpen(candidate)}
          className="mt-2 w-full rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          {t("score_detail")}
        </button>
      )}
    </div>
  );
}
