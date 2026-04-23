"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SafeImage } from "@/components/SafeImage";
import { NO_IMAGE_URL } from "@/lib/storage";
import type { SelectedMatch } from "@/lib/matching/matchingStore";

interface Props {
  selected: SelectedMatch[];
  onDecline: (itemId: string) => void;
}

export default function MatchingSelected({ selected, onDecline }: Props) {
  const t = useTranslations("matching");

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">
        {t("selected_title", { count: selected.length })}
      </h2>

      {selected.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("selected_empty")}</p>
      ) : (
        <div className="space-y-3">
          {selected.map((s) => (
            <div
              key={s.itemId}
              className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/60"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-700">
                <SafeImage
                  src={s.item.photos?.[0] || NO_IMAGE_URL}
                  alt={s.item.title}
                  fill
                  className="object-cover"
                  sizes="56px"
                  unoptimized={!s.item.photos?.[0]}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {s.item.title}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.score}%</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => onDecline(s.itemId)}
                  className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  {t("selected_refuse")}
                </button>
                <Link
                  href={`/objects/${s.itemId}`}
                  className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  {t("selected_chat")}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
