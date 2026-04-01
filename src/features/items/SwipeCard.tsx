"use client";

import { useRef, useState } from "react";
import { SafeImage } from "@/components/SafeImage";
import { useTranslations } from "next-intl";
import { Item } from "@/lib/types";
import { NO_IMAGE_URL } from "@/lib/storage";
import { Pill } from "@/components/ui-custom";
import { MapPin, Tag } from "lucide-react";
import { useItemTranslation } from "@/hooks/useItemTranslation";
import { TranslationIndicator } from "@/components/TranslationIndicator";

/** Tiny label→value row used for semantic fields */
function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-1.5 text-[11px]">
      <span className="font-medium text-zinc-400 dark:text-zinc-500">{label}</span>
      <span className="text-zinc-700 dark:text-zinc-300">{value}</span>
    </div>
  );
}

export function SwipeCard({
  item,
  onSwipeLeft,
  onSwipeRight,
  disabled,
}: {
  item: Item;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  disabled?: boolean;
}) {
  const t = useTranslations("swipeCard");
  const td = useTranslations("objectDetail");
  const { title, description, isTranslated, isLoading, showingOriginal, toggleOriginal } =
    useItemTranslation(item.id, item.title, item.description);
  const [offset, setOffset] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const startX = useRef(0);
  const threshold = 80;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    setSwiping(true);
    startX.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!swiping) return;
    setOffset(e.clientX - startX.current);
  };

  const handlePointerUp = () => {
    if (!swiping) return;
    setSwiping(false);
    if (offset > threshold) {
      onSwipeRight();
    } else if (offset < -threshold) {
      onSwipeLeft();
    }
    setOffset(0);
  };

  const direction = offset > 30 ? "right" : offset < -30 ? "left" : null;

  // Resolve semantic field display values
  const intentLabel = item.intent ? td(`intent${item.intent.charAt(0).toUpperCase() + item.intent.slice(1).replace(/_([a-z])/g, (_, c) => c.toUpperCase())}` as Parameters<typeof td>[0]) : null;
  const flexLabel = item.flexibility ? td(`flexibility${item.flexibility.charAt(0).toUpperCase() + item.flexibility.slice(1)}` as Parameters<typeof td>[0]) : null;
  const valueLabel = item.perceivedValue ? td(`value${item.perceivedValue.charAt(0).toUpperCase() + item.perceivedValue.slice(1)}` as Parameters<typeof td>[0]) : null;
  const clarityLabel = item.clarity ? td(`clarity${item.clarity.charAt(0).toUpperCase() + item.clarity.slice(1).replace(/_([a-z])/g, (_, c) => c.toUpperCase())}` as Parameters<typeof td>[0]) : null;
  const contextLabel = item.context ? td(`context${item.context.charAt(0).toUpperCase() + item.context.slice(1)}` as Parameters<typeof td>[0]) : null;

  const tags = item.userFinalTags?.length ? item.userFinalTags : item.aiSuggestedTags;

  return (
    <div className="relative select-none">
      <div
        className="cursor-grab touch-none rounded-2xl border border-zinc-200 bg-white p-4 shadow-md transition-transform dark:border-zinc-700 dark:bg-zinc-900"
        style={{
          transform: `translateX(${offset}px) rotate(${offset * 0.05}deg)`,
          opacity: disabled ? 0.5 : 1,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {direction ? (
          <div
            className={`absolute top-3 z-10 rounded-full px-4 py-1 text-sm font-bold uppercase ${
              direction === "right"
                ? "left-3 border-2 border-green-500 text-green-600"
                : "right-3 border-2 border-red-500 text-red-600"
            }`}
          >
            {direction === "right" ? t("yes") : t("no")}
          </div>
        ) : null}

        <div className="relative mx-auto h-40 w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
          <SafeImage
            src={item.photos?.[0] || NO_IMAGE_URL}
            alt={item.title}
            fill
            className="object-cover pointer-events-none"
            sizes="(max-width: 640px) 100vw, 400px"
            unoptimized={!item.photos?.[0]}
          />
          {item.photos && item.photos.length > 1 && (
            <span className="absolute bottom-1.5 right-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">
              1/{item.photos.length}
            </span>
          )}
        </div>

        <div className="mt-3 space-y-1.5">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              {title}
            </h3>
            <TranslationIndicator
              isTranslated={isTranslated}
              isLoading={isLoading}
              showingOriginal={showingOriginal}
              onToggle={toggleOriginal}
            />
          </div>

          {/* Primary pills: category, condition, location */}
          <div className="flex flex-wrap gap-1">
            <Pill color="blue">{item.category}</Pill>
            <Pill color="zinc">{item.condition}</Pill>
            {item.location && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                <MapPin className="h-2.5 w-2.5" />
                {item.location}
              </span>
            )}
          </div>

          {/* Description */}
          <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-300">
            {description}
          </p>

          {/* Wishlist */}
          {item.wishlist && (
            <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
              {t("wants")} {item.wishlist}
            </p>
          )}

          {/* Semantic fields */}
          {(intentLabel || flexLabel || valueLabel || clarityLabel || contextLabel) && (
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 rounded-lg bg-zinc-50 px-2.5 py-1.5 dark:bg-zinc-800/60">
              <Field label={td("intent")} value={intentLabel} />
              <Field label={td("flexibility")} value={flexLabel} />
              <Field label={td("perceivedValue")} value={valueLabel} />
              <Field label={td("clarity")} value={clarityLabel} />
              <Field label={td("context")} value={contextLabel} />
              {item.acceptsBundle && (
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400">{td("acceptsBundle")}</div>
              )}
            </div>
          )}

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              <Tag className="h-3 w-3 text-zinc-400" />
              {tags.slice(0, 5).map((tag) => (
                <span key={tag} className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Swipe buttons for non-touch users */}
      {!disabled ? (
        <div className="mt-3 flex justify-center gap-4">
          <button
            type="button"
            onClick={onSwipeLeft}
            className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-red-400 text-red-500 text-xl font-bold transition hover:bg-red-50 dark:hover:bg-red-950/30"
            aria-label={t("notInterested")}
          >
            ✕
          </button>
          <button
            type="button"
            onClick={onSwipeRight}
            className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-green-400 text-green-500 text-xl font-bold transition hover:bg-green-50 dark:hover:bg-green-950/30"
            aria-label={t("interested")}
          >
            ✓
          </button>
        </div>
      ) : null}
    </div>
  );
}
