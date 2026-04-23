"use client";

import { useTranslations } from "next-intl";
import type { Item } from "@/lib/types";

interface Props {
  slotItems: Item[];
  onFetch: () => void;
  loading: boolean;
  profilesCount: number;
}

export function MatchingAIButton({ slotItems, onFetch, loading, profilesCount }: Props) {
  const t = useTranslations("matching");

  const noSlots = slotItems.length === 0;
  const slotsFull = profilesCount >= 2;
  const disabled = noSlots || slotsFull;

  return (
    <section className="flex justify-center">
      <div className="w-full max-w-md rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 p-5 text-center dark:border-purple-800 dark:from-purple-950/40 dark:to-blue-950/20">
        <div className="mb-2 text-2xl">🤖</div>
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          {t("aiTitle")}
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {t("aiSubtitle")}
        </p>

        {slotsFull ? (
          <p className="mt-3 text-xs font-medium text-zinc-400">
            {t("aiDisabledFull")}
          </p>
        ) : noSlots ? (
          <p className="mt-3 text-xs font-medium text-zinc-400">
            {t("aiNoSlotHint")}
          </p>
        ) : (
          <button
            type="button"
            onClick={onFetch}
            disabled={loading}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="animate-spin">⟳</span>
                {t("aiLoading")}
              </>
            ) : (
              <>✨ {t("aiButton")}</>
            )}
          </button>
        )}
      </div>
    </section>
  );
}
