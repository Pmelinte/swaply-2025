"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Item } from "@/lib/types";
import { NO_IMAGE_URL } from "@/lib/storage";
import { Pill } from "@/components/ui";

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
            {direction === "right" ? "DA" : "NU"}
          </div>
        ) : null}

        <div className="relative mx-auto h-40 w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
          <Image
            src={item.photos?.[0] || NO_IMAGE_URL}
            alt={item.title}
            fill
            className="object-cover pointer-events-none"
            sizes="(max-width: 640px) 100vw, 400px"
            unoptimized={!item.photos?.[0]}
          />
        </div>

        <div className="mt-3 space-y-1">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
            {item.title}
          </h3>
          <div className="flex flex-wrap gap-1">
            <Pill color="blue">{item.category}</Pill>
            <Pill color="zinc">{item.condition}</Pill>
            <Pill color="zinc">{item.location || "?"}</Pill>
          </div>
          <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-300">
            {item.description}
          </p>
          {item.wishlist ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Doreste: {item.wishlist}
            </p>
          ) : null}
        </div>
      </div>

      {/* Swipe buttons for non-touch users */}
      {!disabled ? (
        <div className="mt-3 flex justify-center gap-4">
          <button
            type="button"
            onClick={onSwipeLeft}
            className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-red-400 text-red-500 text-xl font-bold transition hover:bg-red-50 dark:hover:bg-red-950/30"
            aria-label="Nu ma intereseaza"
          >
            ✕
          </button>
          <button
            type="button"
            onClick={onSwipeRight}
            className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-green-400 text-green-500 text-xl font-bold transition hover:bg-green-50 dark:hover:bg-green-950/30"
            aria-label="Ma intereseaza"
          >
            ✓
          </button>
        </div>
      ) : null}
    </div>
  );
}
