"use client";

import { useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const STORAGE_KEY = "swaply_matching_slots";

function getSlotIds(): [string | null, string | null] {
  if (typeof window === "undefined") return [null, null];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [null, null];
    const parsed = JSON.parse(raw);
    return [parsed[0] ?? null, parsed[1] ?? null];
  } catch {
    return [null, null];
  }
}

interface Props {
  itemId: string;
  className?: string;
}

/**
 * Small button that adds an item to the matching page slots via URL params.
 * Reads the current localStorage state to decide which slot param to set.
 * Placed at bottom-left of item cards (grid/list) in the objects page.
 */
export function AddToMatchingButton({ itemId, className }: Props) {
  const t = useTranslations("matching");
  const router = useRouter();

  const handleClick = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      const [s1, s2] = getSlotIds();

      // If this item is already in a slot, navigate to matching
      if (s1 === itemId || s2 === itemId) {
        router.push("/matching");
        return;
      }

      // Fill the first empty slot
      const params = new URLSearchParams();
      if (s1) {
        params.set("s1", s1);
        params.set("s2", itemId);
      } else {
        params.set("s1", itemId);
        if (s2) params.set("s2", s2);
      }

      router.push(`/matching?${params.toString()}`);
    },
    [itemId, router],
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      title={t("addToMatching")}
      className={
        className ??
        "absolute bottom-3 left-3 z-10 rounded-full bg-blue-600/90 px-2 py-1 text-[10px] font-semibold text-white shadow-sm backdrop-blur hover:bg-blue-700 dark:bg-blue-500/90 dark:hover:bg-blue-600"
      }
    >
      {t("addToMatchingShort")}
    </button>
  );
}
