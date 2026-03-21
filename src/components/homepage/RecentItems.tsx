"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MapPin, ChevronRight, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

interface RecentItem {
  id: string;
  title: string;
  category: string;
  images: unknown;
  image_url: string | null;
  location: string | null;
  location_city: string | null;
  estimated_value: number | null;
  created_at: string;
  condition: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Electronică": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "Sport & Outdoor": "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  "Hobby & Jocuri": "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  "Cărți & Media": "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "Casă & Grădină": "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  "Modă & Accesorii": "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
};

const DEFAULT_BADGE = "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";

function getItemImage(item: RecentItem): string | null {
  // Try images JSONB (could be array of strings or array of objects)
  if (item.images && Array.isArray(item.images) && item.images.length > 0) {
    const first = item.images[0];
    if (typeof first === "string") return first;
    if (typeof first === "object" && first !== null && "url" in first)
      return (first as { url: string }).url;
  }
  // Fallback to image_url
  if (item.image_url) return item.image_url;
  return null;
}

function getCategoryBadge(category: string): string {
  // Check exact match first, then check if the category starts with a known prefix
  if (CATEGORY_COLORS[category]) return CATEGORY_COLORS[category];
  for (const [key, val] of Object.entries(CATEGORY_COLORS)) {
    if (category.startsWith(key) || key.startsWith(category)) return val;
  }
  return DEFAULT_BADGE;
}

const CONDITION_MAP: Record<string, string> = {
  new: "conditionNew",
  good: "conditionGood",
  used: "conditionUsed",
  used_good: "conditionGood",
};

export function RecentItems() {
  const t = useTranslations("home");
  const tObj = useTranslations("objects");
  const [items, setItems] = useState<RecentItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/items/recent");
        if (res.ok && !cancelled) {
          const data = await res.json();
          setItems(data);
        }
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Don't render until loaded
  if (!loaded) return null;

  // Empty state CTA
  if (items.length === 0) {
    return (
      <section>
        <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-zinc-50">
          {t("recentItemsTitle")}
        </h2>
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/80 p-8 text-center shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/80">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {t("recentItemsEmpty")}
          </p>
          <Link
            href="/register"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-green-700"
          >
            <Plus className="h-4 w-4" />
            {t("recentItemsAddCta")}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
          {t("recentItemsTitle")}
        </h2>
        <Link
          href="/objects"
          className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {t("recentItemsViewAll")}
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => {
          const imageUrl = getItemImage(item);
          const city = item.location_city || item.location || null;
          const conditionKey = CONDITION_MAP[item.condition] || "conditionUsed";

          return (
            <Link
              key={item.id}
              href={`/objects/${item.id}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white/80 shadow-sm backdrop-blur transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/80"
            >
              {/* Image */}
              {imageUrl ? (
                <div className="relative aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                  <Image
                    src={imageUrl}
                    alt={item.title}
                    fill
                    className="object-cover transition group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="flex aspect-square items-center justify-center bg-zinc-100 text-3xl font-bold text-zinc-300 dark:bg-zinc-800 dark:text-zinc-600">
                  {item.title.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Content */}
              <div className="flex flex-1 flex-col gap-1.5 p-3">
                {/* Title */}
                <p className="line-clamp-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {item.title.length > 50
                    ? item.title.slice(0, 50) + "…"
                    : item.title}
                </p>

                {/* Category badge */}
                <span
                  className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-medium ${getCategoryBadge(item.category)}`}
                >
                  {item.category}
                </span>

                {/* Location */}
                {city && (
                  <p className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{city}</span>
                  </p>
                )}

                {/* Condition */}
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                  {tObj(conditionKey)}
                </p>

                {/* Estimated value */}
                {item.estimated_value != null && item.estimated_value > 0 && (
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                    ~{item.estimated_value} €
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
