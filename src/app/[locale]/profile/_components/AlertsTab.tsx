"use client";

import { useTranslations } from "next-intl";
import { useSavedSearches } from "@/hooks/useSavedSearches";
import { Bell, BellOff, Trash2, Search, MapPin, Tag, Package } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { SavedSearchFilters } from "@/hooks/useSavedSearches";

function FilterBadges({ filters }: { filters: SavedSearchFilters }) {
  const entries = Object.entries(filters).filter(
    ([, v]) => v !== null && v !== undefined && v !== "" && v !== "all",
  );
  if (entries.length === 0) return null;

  const iconMap: Record<string, React.ReactNode> = {
    category: <Tag className="h-2.5 w-2.5" />,
    city: <MapPin className="h-2.5 w-2.5" />,
    keywords: <Search className="h-2.5 w-2.5" />,
    listingType: <Package className="h-2.5 w-2.5" />,
  };

  return (
    <div className="flex flex-wrap gap-1">
      {entries.map(([key, value]) => (
        <span
          key={key}
          className="inline-flex items-center gap-0.5 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
        >
          {iconMap[key] ?? null}
          {String(value)}
        </span>
      ))}
    </div>
  );
}

export default function AlertsTab({ userId }: { userId: string }) {
  const t = useTranslations("savedSearches");
  const {
    searches,
    loading,
    deleteSearch,
    toggleAlert,
    markNotificationsSeen,
  } = useSavedSearches(userId);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
            <div className="h-4 w-1/3 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="mt-2 h-3 w-2/3 rounded bg-zinc-200 dark:bg-zinc-700" />
          </div>
        ))}
      </div>
    );
  }

  if (searches.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-800">
        <Bell className="mx-auto mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-600" />
        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          {t("emptyTitle")}
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {t("emptyDescription")}
        </p>
        <Link
          href="/objects"
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Search className="h-4 w-4" />
          {t("browseObjects")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          {t("tabTitle")} ({searches.length})
        </h3>
      </div>

      {searches.map((search) => (
        <div
          key={search.id}
          className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {search.name}
                </h4>
                {(search.new_count ?? 0) > 0 && (
                  <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-900/40 dark:text-red-300">
                    {search.new_count} {t("newItems")}
                  </span>
                )}
              </div>
              <div className="mt-1.5">
                <FilterBadges filters={search.filters} />
              </div>
              <p className="mt-1.5 text-[10px] text-zinc-400">
                {t("created")} {new Date(search.created_at).toLocaleDateString("ro-RO")}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              {/* View matching objects */}
              {(search.new_count ?? 0) > 0 && (
                <Link
                  href={buildSearchUrl(search.filters)}
                  onClick={() => void markNotificationsSeen(search.id)}
                  className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                >
                  {t("viewNew")}
                </Link>
              )}

              {/* Toggle alert */}
              <button
                type="button"
                onClick={() => void toggleAlert(search.id, !search.alert_enabled)}
                className={`rounded-lg p-1.5 transition ${
                  search.alert_enabled
                    ? "bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400"
                    : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-500"
                }`}
                title={search.alert_enabled ? t("disableAlert") : t("enableAlert")}
              >
                {search.alert_enabled ? (
                  <Bell className="h-4 w-4" />
                ) : (
                  <BellOff className="h-4 w-4" />
                )}
              </button>

              {/* Delete */}
              <button
                type="button"
                onClick={() => void deleteSearch(search.id)}
                className="rounded-lg bg-red-50 p-1.5 text-red-500 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                title={t("delete")}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function buildSearchUrl(filters: SavedSearchFilters): string {
  const params = new URLSearchParams();
  if (filters.category) params.set("category", filters.category);
  if (filters.city) params.set("city", filters.city);
  if (filters.keywords) params.set("q", filters.keywords);
  if (filters.listingType && filters.listingType !== "all") params.set("type", filters.listingType);
  if (filters.condition) params.set("condition", filters.condition);
  const qs = params.toString();
  return `/objects${qs ? `?${qs}` : ""}`;
}
