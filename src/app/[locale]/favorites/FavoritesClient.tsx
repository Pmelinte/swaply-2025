"use client";

import { useState, useMemo } from "react";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { useFavorites } from "@/hooks/useFavorites";
import {
  Heart,
  MapPin,
  Tag,
  Search,
  ArrowRightLeft,
  ChevronRight,
  Bookmark,
  Loader2,
} from "lucide-react";

export default function FavoritesClient() {
  const { items, loading, user } = useAppState();
  const { favoriteIds, toggleFavorite, loaded, error, isPending } = useFavorites(user?.id);
  const t = useTranslations("favorites");
  const tCat = useTranslations("categories");
  const [search, setSearch] = useState("");

  const favoriteItems = useMemo(() => {
    return items.filter((item) => favoriteIds.has(item.id));
  }, [items, favoriteIds]);

  const filtered = useMemo(() => {
    if (!search.trim()) return favoriteItems;
    const query = search.toLowerCase();
    return favoriteItems.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query),
    );
  }, [favoriteItems, search]);

  if (loading.auth || !loaded) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-zinc-400 dark:text-zinc-500">
        <Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{t("title")}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {t("subtitle", { count: favoriteItems.length })}
          </p>
        </div>
        <Link
          href="/objects"
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          <Search className="h-4 w-4" />
          {t("browseMore")}
        </Link>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
        >
          {error}
        </p>
      )}

      {favoriteItems.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchSaved")}
            className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 py-16 dark:border-zinc-700">
          <Bookmark className="mb-4 h-12 w-12 text-zinc-300 dark:text-zinc-600" />
          <p className="mb-1 text-base font-semibold text-zinc-700 dark:text-zinc-200">
            {favoriteItems.length === 0 ? t("noFavorites") : t("noResults")}
          </p>
          <p className="mb-4 max-w-sm text-center text-sm text-zinc-500">
            {favoriteItems.length === 0 ? t("noFavoritesDesc") : t("noResultsDesc")}
          </p>
          {favoriteItems.length === 0 && (
            <Link
              href="/objects"
              className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {t("startBrowsing")}
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const pending = isPending(item.id);
            return (
              <div
                key={item.id}
                className="group relative rounded-2xl border border-zinc-200 bg-white/80 shadow-sm backdrop-blur transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/80"
              >
                <Link href={`/objects/${item.id}`}>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl bg-zinc-100 dark:bg-zinc-800">
                    {item.photos?.[0] ? (
                      <Image
                        src={item.photos[0]}
                        alt={item.title}
                        fill
                        className="object-cover transition group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, 33vw"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-3xl font-bold text-zinc-300">
                        {item.title.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {item.title}
                    </h3>
                    <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-700">
                        <Tag className="h-3 w-3" />
                        {tCat(item.category)}
                      </span>
                      {item.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {item.location}
                        </span>
                      )}
                    </div>
                    {item.wishlist && (
                      <p className="mt-1.5 flex items-center gap-1 truncate text-xs text-blue-600 dark:text-blue-400">
                        <ArrowRightLeft className="h-3 w-3 shrink-0" />
                        {item.wishlist}
                      </p>
                    )}
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => void toggleFavorite(item.id)}
                  disabled={pending}
                  aria-label={t("remove")}
                  className="absolute right-2 top-2 rounded-full bg-white/90 p-2 shadow-sm backdrop-blur transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-60 dark:bg-zinc-900/80 dark:hover:bg-red-900/30"
                >
                  {pending ? (
                    <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                  ) : (
                    <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
