"use client";

import { useTranslations } from "next-intl";
import type { Item } from "@/lib/types";

const EXPERIENCE_CATEGORIES = new Set([
  "experiences",
]);

/** Check if an item is an experience */
export function isExperienceItem(item: Item): boolean {
  return EXPERIENCE_CATEGORIES.has(item.category);
}

/** Calculate days until expiry from experience data */
function getDaysUntilExpiry(item: Item): number | null {
  const dateStr = item.experienceData?.eventDate;
  if (!dateStr) return null;
  const eventDate = new Date(dateStr);
  if (isNaN(eventDate.getTime())) return null;
  const now = new Date();
  return Math.ceil((eventDate.getTime() - now.getTime()) / 86400000);
}

/**
 * Badge for experience items: shows "Experience" tag + expiry warning.
 */
export function ExperienceBadge({ item }: { item: Item }) {
  const t = useTranslations("experiences");

  if (!isExperienceItem(item)) return null;

  const daysLeft = getDaysUntilExpiry(item);
  const isExpiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 30;
  const isExpired = daysLeft !== null && daysLeft < 0;

  return (
    <div className="flex items-center gap-1.5">
      <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
        🎫 {t("badge")}
      </span>
      {isExpired ? (
        <span className="inline-flex items-center gap-0.5 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {t("expired")}
        </span>
      ) : isExpiringSoon ? (
        <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
          ⚠️ {t("expiresIn", { days: daysLeft })}
        </span>
      ) : null}
    </div>
  );
}
