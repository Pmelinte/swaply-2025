"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { Pill, SectionCard } from "@/components/ui";
import { NO_IMAGE_URL } from "@/lib/storage";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Tag,
  Sparkles,
  ArrowLeft,
  MessageCircle,
  Repeat2,
  Pencil,
  Target,
  Gauge,
  Eye,
  Clock,
  Package,
  Heart,
} from "lucide-react";

const INTENT_LABELS: Record<string, string> = {
  explore: "intentExplore",
  open: "intentOpen",
  committed: "intentCommitted",
  high_commitment: "intentHighCommitment",
};

const FLEXIBILITY_LABELS: Record<string, string> = {
  strict: "flexibilityStrict",
  moderate: "flexibilityModerate",
  broad: "flexibilityBroad",
};

const VALUE_LABELS: Record<string, string> = {
  small: "valueSmall",
  medium: "valueMedium",
  large: "valueLarge",
  sentimental: "valueSentimental",
};

const CLARITY_LABELS: Record<string, string> = {
  exploring: "clarityExploring",
  have_idea: "clarityHaveIdea",
  know_exactly: "clarityKnowExactly",
};

const CONTEXT_LABELS: Record<string, string> = {
  permanent: "contextPermanent",
  vacation: "contextVacation",
  temporary: "contextTemporary",
  urgent: "contextUrgent",
};

export default function ObjectDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { items, user, loading, proposeSwap } = useAppState();
  const t = useTranslations("objectDetail");
  const [activePhoto, setActivePhoto] = useState(0);
  const [offerItemId, setOfferItemId] = useState<string>("");

  const item = items.find((i) => i.id === params.id);

  const myActiveItems = useMemo(
    () =>
      user
        ? items.filter((i) => i.ownerId === user.id && i.isActive && i.status === "active")
        : [],
    [items, user],
  );

  const validOfferItemId = myActiveItems.some((i) => i.id === offerItemId) ? offerItemId : "";
  const effectiveOfferItemId = validOfferItemId || myActiveItems[0]?.id || "";

  // Similar items: same category, different item, active
  const similarItems = useMemo(() => {
    if (!item) return [];
    return items
      .filter((i) => i.id !== item.id && i.category === item.category && i.isActive && i.status === "active")
      .slice(0, 4);
  }, [items, item]);

  const isOwner = user && item ? item.ownerId === user.id : false;

  // Semantic fields present
  const hasSemanticFields = item && (item.intent || item.flexibility || item.perceivedValue || item.clarity || item.context);

  if (loading.items) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6">
        <SectionCard title={t("loading")} description={t("loadingDescription")}>
          <div className="h-64 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
        </SectionCard>
      </div>
    );
  }

  if (!item) {
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

  const photos = item.photos?.length ? item.photos : [NO_IMAGE_URL];
  const hasMultiplePhotos = item.photos?.length > 1;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* Back nav */}
      <Link
        href="/objects"
        className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToObjects")}
      </Link>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Left column — photo + details */}
        <div className="space-y-4">
          {/* Photo gallery */}
          <div className="relative overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
            <div className="relative aspect-[4/3]">
              <Image
                src={photos[activePhoto] || NO_IMAGE_URL}
                alt={`${item.title} — photo ${activePhoto + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 60vw"
                unoptimized={!item.photos?.[activePhoto]}
              />
            </div>
            {/* Photo nav arrows */}
            {hasMultiplePhotos && (
              <>
                <button
                  type="button"
                  onClick={() => setActivePhoto((p) => (p === 0 ? photos.length - 1 : p - 1))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white backdrop-blur transition hover:bg-black/60"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setActivePhoto((p) => (p === photos.length - 1 ? 0 : p + 1))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white backdrop-blur transition hover:bg-black/60"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <span className="absolute bottom-2 right-2 rounded-full bg-black/40 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
                  {t("photoCount", { current: activePhoto + 1, total: photos.length })}
                </span>
              </>
            )}
          </div>
          {/* Thumbnails */}
          {hasMultiplePhotos && (
            <div className="flex gap-2 overflow-x-auto">
              {photos.map((photo, idx) => (
                <button
                  key={`${photo}-${idx}`}
                  type="button"
                  onClick={() => setActivePhoto(idx)}
                  className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition ${
                    idx === activePhoto
                      ? "border-blue-600"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={photo}
                    alt={`${item.title} — thumb ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                    unoptimized
                  />
                </button>
              ))}
            </div>
          )}

          {/* Title + metadata */}
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{item.title}</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <Pill color="blue">{item.category}</Pill>
              <Pill color="zinc">{item.condition}</Pill>
              <Pill color="green">{item.status}</Pill>
              {item.location && (
                <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  <MapPin className="h-3 w-3" />
                  {item.location}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          {item.description && (
            <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{item.description}</p>
          )}

          {/* Wishlist */}
          {item.wishlist && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
              <p className="text-xs font-semibold uppercase text-blue-600 dark:text-blue-400">{t("wishlist")}</p>
              <p className="mt-1 text-sm text-blue-900 dark:text-blue-100">{item.wishlist}</p>
            </div>
          )}

          {/* Tags */}
          {(item.aiSuggestedTags?.length || item.userFinalTags?.length) ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {item.aiSuggestedTags?.length ? (
                <div className="rounded-xl bg-blue-50 p-3 dark:bg-blue-950/30">
                  <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
                    <Sparkles className="h-3 w-3" />
                    {t("aiSuggestedTags")}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {item.aiSuggestedTags.map((tag) => (
                      <span key={tag} className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">{tag}</span>
                    ))}
                  </div>
                </div>
              ) : null}
              {item.userFinalTags?.length ? (
                <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-950/30">
                  <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    <Tag className="h-3 w-3" />
                    {t("userFinalTags")}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {item.userFinalTags.map((tag) => (
                      <span key={tag} className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">{tag}</span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Semantic contract fields */}
          {hasSemanticFields && (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
              <p className="mb-3 text-xs font-semibold uppercase text-zinc-500">{t("semanticDetails")}</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {item.intent && (
                  <div className="flex items-start gap-2">
                    <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-zinc-400">{t("intent")}</p>
                      <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200">{t(INTENT_LABELS[item.intent] as Parameters<typeof t>[0])}</p>
                    </div>
                  </div>
                )}
                {item.flexibility && (
                  <div className="flex items-start gap-2">
                    <Gauge className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-zinc-400">{t("flexibility")}</p>
                      <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200">{t(FLEXIBILITY_LABELS[item.flexibility] as Parameters<typeof t>[0])}</p>
                    </div>
                  </div>
                )}
                {item.perceivedValue && (
                  <div className="flex items-start gap-2">
                    <Package className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-zinc-400">{t("perceivedValue")}</p>
                      <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200">{t(VALUE_LABELS[item.perceivedValue] as Parameters<typeof t>[0])}</p>
                    </div>
                  </div>
                )}
                {item.clarity && (
                  <div className="flex items-start gap-2">
                    <Eye className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-zinc-400">{t("clarity")}</p>
                      <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200">{t(CLARITY_LABELS[item.clarity] as Parameters<typeof t>[0])}</p>
                    </div>
                  </div>
                )}
                {item.context && (
                  <div className="flex items-start gap-2">
                    <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-zinc-400">{t("context")}</p>
                      <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200">{t(CONTEXT_LABELS[item.context] as Parameters<typeof t>[0])}</p>
                    </div>
                  </div>
                )}
                {item.acceptsBundle && (
                  <div className="flex items-start gap-2">
                    <Package className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-400" />
                    <div>
                      <p className="text-xs font-medium text-blue-700 dark:text-blue-300">{t("acceptsBundle")}</p>
                    </div>
                  </div>
                )}
                {item.recipientMatters && (
                  <div className="flex items-start gap-2">
                    <Heart className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                    <div>
                      <p className="text-xs font-medium text-red-700 dark:text-red-300">{t("recipientMatters")}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right column — actions sidebar */}
        <div className="space-y-4">
          {/* Owner card */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
            <p className="text-xs font-semibold uppercase text-zinc-400">{t("owner")}</p>
            <p className="mt-1 text-sm font-bold text-zinc-900 dark:text-zinc-50">
              {isOwner && user ? (user.displayName || user.email) : item.ownerId.slice(0, 8) + "…"}
            </p>
            {isOwner && (
              <Link
                href={`/objects/${item.id}/edit`}
                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                <Pencil className="h-3.5 w-3.5" />
                {t("editObject")}
              </Link>
            )}
          </div>

          {/* Swap offer + actions */}
          {user ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
              {!isOwner && (
                <label className="mb-3 block text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  {t("yourOfferedObject")}
                  <select
                    value={effectiveOfferItemId}
                    onChange={(e) => setOfferItemId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  >
                    {myActiveItems.length ? (
                      myActiveItems.map((i) => (
                        <option key={i.id} value={i.id}>{i.title}</option>
                      ))
                    ) : (
                      <option value="">{t("noActiveObjects")}</option>
                    )}
                  </select>
                </label>
              )}
              <div className="space-y-2">
                {!isOwner && (
                  <button
                    type="button"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    disabled={!effectiveOfferItemId}
                    onClick={() => {
                      void (async () => {
                        const swap = await proposeSwap({
                          requesterItemId: effectiveOfferItemId,
                          responderItemId: item.id,
                          responderId: item.ownerId,
                        });
                        router.push(swap ? `/change?swap=${swap.id}` : "/change");
                      })();
                    }}
                  >
                    <Repeat2 className="h-4 w-4" />
                    {t("proposeExchange")}
                  </button>
                )}
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-700 dark:hover:bg-zinc-600"
                  onClick={() =>
                    router.push(
                      isOwner ? "/chat" : `/chat?to=${encodeURIComponent(item.ownerId)}`,
                    )
                  }
                >
                  <MessageCircle className="h-4 w-4" />
                  {t("startSecureChat")}
                </button>
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-700"
                  onClick={() => router.push("/match")}
                >
                  <Sparkles className="h-4 w-4" />
                  {t("requestMatch")}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center dark:border-amber-800 dark:bg-amber-900/30">
              <p className="mb-3 text-sm text-amber-900 dark:text-amber-100">{t("loginToInteract")}</p>
              <Link
                href={`/login?returnTo=/objects/${item.id}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Login
              </Link>
            </div>
          )}

          {/* Similar items */}
          {similarItems.length > 0 && (
            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase text-zinc-500">{t("similarItems")}</p>
                <Link href={`/objects`} className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400">
                  {t("viewAll")}
                </Link>
              </div>
              <div className="space-y-2">
                {similarItems.map((si) => (
                  <Link
                    key={si.id}
                    href={`/objects/${si.id}`}
                    className="flex items-center gap-3 rounded-lg p-1.5 transition hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-700">
                      <Image
                        src={si.photos?.[0] || NO_IMAGE_URL}
                        alt={si.title}
                        fill
                        className="object-cover"
                        sizes="48px"
                        unoptimized={!si.photos?.[0]}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{si.title}</p>
                      <p className="text-xs text-zinc-500">{si.condition}{si.location ? ` · ${si.location}` : ""}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
