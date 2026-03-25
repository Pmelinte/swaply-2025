"use client";

import { memo } from "react";
import { SafeImage } from "@/components/SafeImage";
import { useTranslations } from "next-intl";
import { Item } from "@/lib/types";
import { Pill } from "@/components/ui";
import { NO_IMAGE_URL } from "@/lib/storage";
import { VerificationBadgeTag } from "@/features/verification/VerificationBadgeTag";
import { useItemTranslation } from "@/hooks/useItemTranslation";
import { TranslationIndicator } from "@/components/TranslationIndicator";
import { ExperienceBadge } from "@/components/ExperienceBadge";

export const ItemCard = memo(function ItemCard({
  item,
  onEdit,
  onDelete,
  onView,
  ownerVerification,
}: {
  item: Item;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  ownerVerification?: { emailVerified?: boolean; phoneVerified?: boolean; idVerified?: boolean };
}) {
  const t = useTranslations("itemCard");
  const tc = useTranslations("common");
  const { title, description, isTranslated, isLoading, showingOriginal, toggleOriginal } =
    useItemTranslation(item.id, item.title, item.description);

  const statusColor: Record<string, "green" | "amber" | "zinc" | "blue" | "red"> = {
    active: "green",
    paused: "amber",
    reserved: "blue",
    swapped: "zinc",
    archived: "zinc",
  };

  return (
    <div className="flex gap-3 rounded-2xl border border-zinc-200 bg-white/80 p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="relative h-24 w-24 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
        <SafeImage
          src={item.photos?.[0] || NO_IMAGE_URL}
          alt={title}
          fill
          className="object-cover"
          sizes="96px"
          unoptimized={!item.photos?.[0]}
        />
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs uppercase text-zinc-500">{item.category}</p>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {title}
            </h3>
            <TranslationIndicator
              isTranslated={isTranslated}
              isLoading={isLoading}
              showingOriginal={showingOriginal}
              onToggle={toggleOriginal}
            />
            <ExperienceBadge item={item} />
          </div>
          <div className="flex items-center gap-1.5">
            {ownerVerification && (
              <VerificationBadgeTag
                emailVerified={ownerVerification.emailVerified}
                phoneVerified={ownerVerification.phoneVerified}
                idVerified={ownerVerification.idVerified}
                compact
              />
            )}
            <Pill color={statusColor[item.status]}>{item.status}</Pill>
          </div>
        </div>
        <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-300">
          {description}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span>{t("location")} {item.location || tc("unknown")}</span>
          {item.aiSuggestedTags?.length ? (
            <Pill color="blue">{t("ai")} {item.aiSuggestedTags.join(", ")}</Pill>
          ) : null}
        </div>
        <div className="flex gap-2 text-xs font-semibold">
          {onView ? (
            <button
              type="button"
              onClick={onView}
              className="rounded-full bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
            >
              {t("view")}
            </button>
          ) : null}
          {onEdit ? (
            <button
              type="button"
              onClick={onEdit}
              className="rounded-full bg-zinc-900 px-3 py-1 text-white hover:bg-zinc-800"
            >
              {t("edit")}
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-full bg-red-600 px-3 py-1 text-white hover:bg-red-700"
            >
              {t("delete")}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
});
