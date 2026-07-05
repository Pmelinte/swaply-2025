"use client";

import { useMemo } from "react";
import { sortExploreFeed, type ExploreFeedItem } from "@/lib/explore/exploreRanking";

const MOCK_ITEMS: ExploreFeedItem[] = [
  {
    id: "1",
    category: "Electronics",
    approximate_value: 1800,
    location_country: "Romania",
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    ai_metadata: { quality_score: 90 },
    owner: { rating: 4.9, trust_score: 92, completion_rate: 96 },
  },
  {
    id: "2",
    category: "Travel",
    approximate_value: 400,
    location_country: "Romania",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    ai_metadata: { quality_score: 74 },
    owner: { rating: 4.2, trust_score: 71, completion_rate: 80 },
  },
  {
    id: "3",
    category: "Collectibles",
    approximate_value: 2400,
    location_country: "France",
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    ai_metadata: { quality_score: 88 },
    owner: { rating: 5, trust_score: 98, completion_rate: 100 },
  },
];

export function TrendingFeed() {
  const ranked = useMemo(
    () =>
      sortExploreFeed(MOCK_ITEMS, {
        preferredCountry: "Romania",
        preferredCategories: ["Electronics", "Travel"],
      }),
    [],
  );

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            Trending & recommended
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Ranked by trust, freshness, relevance and activity.
          </p>
        </div>

        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          AI ranked
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {ranked.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 transition hover:-translate-y-1 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full bg-zinc-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                {item.category}
              </span>

              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Score {item.explore_score}
              </span>
            </div>

            <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Recommended exchange item
            </h3>

            <div className="mt-4 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
              <p>Country: {item.location_country}</p>
              <p>Estimated value: €{item.approximate_value}</p>
              <p>Trust score: {item.owner?.trust_score}</p>
              <p>Completion: {item.owner?.completion_rate}%</p>
            </div>

            <button
              type="button"
              className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Explore match
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
