"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { X, Target, Search, SlidersHorizontal } from "lucide-react";
import { useDrawerStore } from "@/lib/state/drawerStore";

export default function DrawerMatching() {
  const t = useTranslations("matching");
  const close = useDrawerStore((s) => s.close);

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-600" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {t("emptyTitle")}
          </h2>
        </div>
        <button
          type="button"
          onClick={close}
          className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          {t("emptyHint")}
        </p>

        <div className="space-y-2">
          <Link
            href="/matching"
            onClick={close}
            className="flex items-center gap-3 rounded-xl border border-zinc-100 px-3 py-3 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
          >
            <Target className="h-5 w-5 shrink-0 text-blue-600" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {t("emptyTitle")}
              </p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                View your active matching slots
              </p>
            </div>
          </Link>

          <Link
            href="/explore"
            onClick={close}
            className="flex items-center gap-3 rounded-xl border border-zinc-100 px-3 py-3 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
          >
            <Search className="h-5 w-5 shrink-0 text-zinc-500" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Explore</p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                Browse items to add to slots
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => {
              close();
              // The matching page opens its own ExploreFilterDrawer via its
              // onOpenDrawer handler — closing here lets the page take over.
            }}
            className="flex w-full items-center gap-3 rounded-xl border border-zinc-100 px-3 py-3 text-left hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
          >
            <SlidersHorizontal className="h-5 w-5 shrink-0 text-zinc-500" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Filters</p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                Use the Filters button on the matching page
              </p>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
