"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { useDrawerStore } from "@/lib/state/drawerStore";
import { ExploreItemCard } from "@/components/explore/ExploreItemCard";
import { filterGlobalExploreItems, toGlobalExploreItems } from "@/lib/explore/globalExplore";
import { searchParamsToFilters } from "@/lib/explore/exploreFilters";

const DOMAINS = ["objects", "properties", "services", "events"] as const;

export function GlobalExploreFeed() {
  const t = useTranslations("explore");
  const tc = useTranslations("common");
  const { items, loading } = useAppState();
  const searchParams = useSearchParams();
  const drawer = useDrawerStore();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const rows = useMemo(() => {
    const filters = searchParamsToFilters(searchParams);
    return filterGlobalExploreItems(toGlobalExploreItems(items), filters, query);
  }, [items, query, searchParams]);

  const counts = useMemo(
    () => Object.fromEntries(DOMAINS.map((domain) => [domain, rows.filter((row) => row.domain === domain).length])),
    [rows],
  ) as Record<(typeof DOMAINS)[number], number>;

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900" data-testid="global-explore-feed">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{t("pageTitle")}</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t("filterDrawer")}</p>
        </div>
        <button
          type="button"
          onClick={() => drawer.openWith({ type: "explore" })}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {t("filterDrawer")}
        </button>
      </div>

      <label className="mt-4 flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950">
        <Search className="h-4 w-4 text-zinc-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`${tc("search")}…`}
          className="w-full bg-transparent text-sm outline-none"
        />
      </label>

      <div className="mt-4 flex flex-wrap gap-2">
        {DOMAINS.map((domain) => (
          <span key={domain} className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold capitalize text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {domain}: {counts[domain]}
          </span>
        ))}
      </div>

      {loading.items ? (
        <div className="mt-5 grid gap-3 md:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-48 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />)}</div>
      ) : rows.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">{tc("noData")}</div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {rows.slice(0, 24).map((item) => <ExploreItemCard key={item.id} item={item} mode="grid" />)}
        </div>
      )}
    </section>
  );
}
