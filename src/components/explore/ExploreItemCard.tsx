"use client";

import { useRouter } from "@/i18n/navigation";
import { SafeImage } from "@/components/SafeImage";
import { useTranslatedText } from "@/hooks/useTranslation";
import { normalizeCategory, normalizeCondition } from "@/lib/normalize-i18n";
import { NO_IMAGE_URL } from "@/lib/storage";
import { MapPin, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Item } from "@/lib/types";
import { CAT, getListingCat } from "@/lib/categoryColors";

function TranslatedText({ text }: { text: string }) {
  const out = useTranslatedText(text);
  return <>{out}</>;
}

export function ExploreItemCard({
  item,
  mode,
}: {
  item: Item;
  mode: "grid" | "list";
}) {
  const router = useRouter();
  const t = useTranslations("objects");
  const tCat = useTranslations("categories");
  const titleOut = useTranslatedText(item.title);
  const detailPath = "detailPath" in item && typeof item.detailPath === "string" ? item.detailPath : `/objects/${item.id}`;

  if (mode === "list") {
    return (
      <button
        type="button"
        onClick={() => router.push(detailPath)}
        className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 text-left shadow-sm transition hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800"
      >
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-700">
          <SafeImage
            src={item.photos?.[0] || NO_IMAGE_URL}
            alt={item.title}
            fill
            className="object-cover"
            sizes="56px"
            unoptimized={!item.photos?.[0]}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {titleOut}
            {item.isBoosted && (
              <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                <Zap className="h-2.5 w-2.5" />
              </span>
            )}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500">
            <span className={`rounded-full px-2 py-0.5 ${CAT[getListingCat(item.listingType)].chip}`}>
              {tCat(normalizeCategory(item.category) as Parameters<typeof tCat>[0])}
            </span>
            <span>{t(`condition_${normalizeCondition(item.condition)}` as Parameters<typeof t>[0])}</span>
          </p>
          {item.location && (
            <p className="mt-0.5 flex items-center gap-0.5 text-xs text-zinc-400">
              <MapPin className="h-3 w-3 shrink-0" />
              <TranslatedText text={item.location} />
            </p>
          )}
        </div>
      </button>
    );
  }

  // grid
  const cat = getListingCat(item.listingType);
  return (
    <button
      type="button"
      onClick={() => router.push(detailPath)}
      className={`group flex w-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800 ${CAT[cat].topBorder}`}
    >
      <div className={`relative aspect-[4/3] w-full overflow-hidden dark:bg-zinc-700 ${CAT[cat].placeholder}`}>
        <SafeImage
          src={item.photos?.[0] || NO_IMAGE_URL}
          alt={item.title}
          fill
          className="object-cover transition group-hover:scale-105"
          sizes="100cqi"
          unoptimized={!item.photos?.[0]}
        />
        <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur ${CAT[cat].badge}`}>
          {CAT[cat].icon}
        </span>
        {item.isBoosted && (
          <span className="absolute left-2 top-8 flex items-center gap-0.5 rounded-full bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-bold text-white">
            <Zap className="h-2.5 w-2.5" />
          </span>
        )}
        <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 backdrop-blur dark:bg-zinc-900/80 dark:text-zinc-200">
          {t(`condition_${normalizeCondition(item.condition)}` as Parameters<typeof t>[0])}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-2.5">
        <p className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-50">{titleOut}</p>
        <p className="mt-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">
          {tCat(normalizeCategory(item.category) as Parameters<typeof tCat>[0])}
        </p>
        {item.location && (
          <p className="mt-1 flex items-center gap-0.5 text-[10px] text-zinc-400">
            <MapPin className="h-2.5 w-2.5 shrink-0" />
            <TranslatedText text={item.location} />
          </p>
        )}
      </div>
    </button>
  );
}
