"use client";

import { useMemo } from "react";
import { SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { useDrawerStore } from "@/lib/state/drawerStore";
import { ExploreItemCard } from "@/components/explore/ExploreItemCard";
import { filterGlobalExploreItems, toGlobalExploreItems } from "@/lib/explore/globalExplore";
import { searchParamsToFilters } from "@/lib/explore/exploreFilters";

const DOMAINS = ["objects", "properties", "services", "events"] as const;

export function GlobalExploreFeed({ query }: { query: string; onQueryChange: (value: string) => void }) {
  const t = useTranslations("explore.architecture");
  const tb = useTranslations("branches");
  const tc = useTranslations("common");
  const { items, loading } = useAppState();
  const searchParams = useSearchParams();
  const drawer = useDrawerStore();

  const rows = useMemo(() => {
    const filters = searchParamsToFilters(searchParams);
    return filterGlobalExploreItems(toGlobalExploreItems(items), filters, query);
  }, [items, query, searchParams]);

  const counts = useMemo(
    () => Object.fromEntries(DOMAINS.map((domain) => [domain, rows.filter((row) => row.domain === domain).length])),
    [rows],
  ) as Record<(typeof DOMAINS)[number], number>;

  return (
    <section className="rounded-3xl border border-emerald-200/80 bg-white/72 p-5 shadow-sm backdrop-blur-xl" data-testid="global-explore-feed" aria-labelledby="global-explore-feed-title">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 id="global-explore-feed-title" className="text-lg font-black text-slate-950">{t("catalogueTitle")}</h2>
          <p className="mt-1 text-sm text-slate-600">{t("catalogueDescription")}</p>
        </div>
        <button
          type="button"
          onClick={() => drawer.openWith({ type: "explore" })}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white/70 px-4 py-2 text-sm font-black text-emerald-900 hover:bg-white"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {t("openFilters")}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {DOMAINS.map((domain) => (
          <span key={domain} className="rounded-full border border-emerald-100 bg-emerald-50/70 px-3 py-1 text-xs font-bold text-emerald-900">
            {tb(domain)}: {counts[domain]}
          </span>
        ))}
      </div>

      {loading.items ? (
        <div className="mt-5 grid gap-3 md:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-48 animate-pulse rounded-xl bg-emerald-50" />)}</div>
      ) : rows.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-emerald-200 p-6 text-center text-sm text-slate-500">{tc("noData")}</div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {rows.slice(0, 24).map((item) => <ExploreItemCard key={item.id} item={item} mode="grid" />)}
        </div>
      )}
    </section>
  );
}
