"use client";

import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

interface Props {
  count: number | null;
  loading: boolean;
  onApply: () => void;
  onReset: () => void;
}

export function ExploreFilterCount({ count, loading, onApply, onReset }: Props) {
  const t = useTranslations("exploreDrawer");

  const countText = () => {
    if (loading || count === null) return null;
    if (count === 0) return t("noResults");
    if (count > 1000) return t("resultsCountMany");
    return t("resultsCount", { count });
  };

  return (
    <div className="border-t border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="mb-3 flex items-center justify-center gap-2 text-sm">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        ) : (
          <span className="text-lg">{count === 0 ? "🔍" : "✅"}</span>
        )}
        <span
          className={`font-medium ${
            count === 0
              ? "text-zinc-500 dark:text-zinc-400"
              : "text-zinc-900 dark:text-zinc-50"
          }`}
        >
          {loading ? t("loadingCount") : countText()}
        </span>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onReset}
          className="flex-1 rounded-full border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition"
        >
          {t("reset")}
        </button>
        <button
          type="button"
          onClick={onApply}
          disabled={count === 0 && !loading}
          className="flex-1 rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {t("apply")}
        </button>
      </div>
    </div>
  );
}
