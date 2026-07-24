"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAppState } from "@/lib/state";
import type { Item } from "@/lib/types";
import { SafeImage } from "@/components/SafeImage";
import { GuestBanner } from "@/components/GuestBanner";
import { ArrowLeft, Pencil } from "lucide-react";
import ObjectDetailClient from "./ObjectDetailClient";

interface ObjectDetailResolvedProps {
  itemId: string;
  initialItem: Item | null;
}

export default function ObjectDetailResolved({
  itemId,
  initialItem,
}: ObjectDetailResolvedProps) {
  const queryClient = useQueryClient();
  const { items, user, loading } = useAppState();
  const t = useTranslations("objectDetail");
  const stateItem = items.find((candidate) => candidate.id === itemId) ?? null;
  const stateDiffersFromInitial = Boolean(
    initialItem &&
      stateItem &&
      (stateItem.title !== initialItem.title ||
        stateItem.description !== initialItem.description ||
        stateItem.wishlist !== initialItem.wishlist ||
        stateItem.status !== initialItem.status ||
        stateItem.isActive !== initialItem.isActive),
  );
  const resolvedItem = stateDiffersFromInitial ? stateItem : initialItem ?? stateItem;

  useEffect(() => {
    queryClient.setQueryData(["item", itemId], resolvedItem);
  }, [itemId, queryClient, resolvedItem]);

  if (!resolvedItem) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-800 dark:bg-amber-900/40">
          <p className="text-sm text-amber-900 dark:text-amber-100">{t("notFound")}</p>
          <Link
            href="/objects"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToObjects")}
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === resolvedItem.ownerId;
  const showResolvedShell = loading.items || stateDiffersFromInitial;

  if (showResolvedShell) {
    const coverPhoto = resolvedItem.photos?.[0];

    return (
      <div>
        {!user && <GuestBanner />}
        <div className="mx-auto max-w-4xl px-4 py-6">
          <Link
            href="/objects"
            className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToObjects")}
          </Link>

          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <div className="space-y-4">
              {coverPhoto && (
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
                  <SafeImage
                    src={coverPhoto}
                    alt={resolvedItem.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    priority
                    unoptimized
                  />
                </div>
              )}

              <div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {resolvedItem.title}
                </h1>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>{resolvedItem.category}</span>
                  <span>·</span>
                  <span>{resolvedItem.condition}</span>
                  {resolvedItem.location && (
                    <>
                      <span>·</span>
                      <span>{resolvedItem.location}</span>
                    </>
                  )}
                </div>
              </div>

              {resolvedItem.description && (
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm leading-6 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                  {resolvedItem.description}
                </div>
              )}
            </div>

            <div className="space-y-4">
              {isOwner && (
                <Link
                  href={`/objects/${itemId}/edit`}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-700"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {t("editObject")}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <ObjectDetailClient />;
}
