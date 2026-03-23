"use client";

import { useEffect, useMemo, useState, useCallback, lazy, Suspense } from "react";
import { useRouter } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import Image from "next/image";
import { SafeImage } from "@/components/SafeImage";
import { ShareButtons } from "@/components/ShareButtons";
import { Link } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useAppState } from "@/lib/state";
import { Pill, SectionCard } from "@/components/ui";
import { AuthGateModal } from "@/components/AuthGateModal";
import { GuestBanner } from "@/components/GuestBanner";
const ReportBlockButtons = lazy(() =>
  import("@/components/safety/ReportBlockButtons").then((m) => ({ default: m.ReportBlockButtons })),
);
import { NO_IMAGE_URL } from "@/lib/storage";
import { TranslateButton } from "@/components/TranslateButton";
import { getSupabaseClient } from "@/lib/supabase/client";
import { sendGAEvent } from "@next/third-parties/google";
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
  Share2,
  Lock,
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

export default function ObjectDetailClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { items, user, loading, proposeSwap, lastError } = useAppState();
  const t = useTranslations("objectDetail");
  const [activePhoto, setActivePhoto] = useState(0);
  const [offerItemId, setOfferItemId] = useState<string>("");

  const stateItem = items.find((i) => i.id === params.id);

  // Direct Supabase fetch for guests or when item isn't in state (e.g. direct link)
  const [directItem, setDirectItem] = useState<import("@/lib/types").Item | null>(null);
  const [directFetchDone, setDirectFetchDone] = useState(false);
  const directLoading = !stateItem && !loading.items && !directFetchDone;

  useEffect(() => {
    if (stateItem || loading.items) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    let cancelled = false;
    supabase
      .from("items")
      .select("*")
      .eq("id", params.id)
      .eq("is_active", true)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (data) {
          const photos = Array.isArray(data.photos)
            ? (data.photos as (string | { url?: string })[]).map((img) =>
                typeof img === "string" ? img : String((img as Record<string, unknown>)?.url ?? ""),
              ).filter(Boolean)
            : [];
          const aiMeta = (typeof data.ai_metadata === "object" && data.ai_metadata ? data.ai_metadata : {}) as Record<string, unknown>;
          setDirectItem({
            id: String(data.id),
            ownerId: String(data.owner_id),
            title: String(data.title ?? ""),
            category: String(data.category ?? ""),
            condition: (String(data.condition ?? "good") as import("@/lib/types").Item["condition"]),
            description: String(data.description ?? ""),
            wishlist: String(data.wishlist ?? ""),
            status: (String(data.status ?? "active") as import("@/lib/types").Item["status"]),
            isDemo: Boolean(data.is_demo),
            isActive: Boolean(data.is_active),
            createdAt: String(data.created_at ?? ""),
            location: String(data.location ?? ""),
            aiSuggestedTags: Array.isArray(data.ai_suggested_tags) ? data.ai_suggested_tags as string[] : [],
            userFinalTags: Array.isArray(data.user_final_tags) ? data.user_final_tags as string[] : [],
            photos,
            intent: (String(aiMeta.intent ?? "") || undefined) as import("@/lib/types").Item["intent"],
            flexibility: (String(aiMeta.flexibility ?? "") || undefined) as import("@/lib/types").Item["flexibility"],
            perceivedValue: (String(aiMeta.perceivedValue ?? "") || undefined) as import("@/lib/types").Item["perceivedValue"],
            clarity: (String(aiMeta.clarity ?? "") || undefined) as import("@/lib/types").Item["clarity"],
            context: (String(aiMeta.context ?? "") || undefined) as import("@/lib/types").Item["context"],
            acceptsBundle: typeof aiMeta.acceptsBundle === "boolean" ? aiMeta.acceptsBundle : undefined,
            recipientMatters: typeof aiMeta.recipientMatters === "boolean" ? aiMeta.recipientMatters : undefined,
            aiNote: String(aiMeta.aiNote ?? "") || undefined,
          });
        }
        setDirectFetchDone(true);
      });
    return () => { cancelled = true; };
  }, [stateItem, loading.items, params.id]);

  const item = stateItem ?? directItem;
  const [shareToast, setShareToast] = useState(false);

  // ── Translation state ─────────────────────────────────────────────
  const locale = useLocale();
  const [translatedTitle, setTranslatedTitle] = useState<string | null>(null);
  const [translatedDesc, setTranslatedDesc] = useState<string | null>(null);
  const [translatedWishlist, setTranslatedWishlist] = useState<string | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);

  // Simple language detection: check for non-ASCII patterns
  const detectLang = useCallback((text: string): string => {
    if (/[ăâîșț]/i.test(text)) return "ro";
    if (/[äöüß]/i.test(text)) return "de";
    if (/[àâçéèêëîïôùûüÿœæ]/i.test(text)) return "fr";
    if (/[ñáéíóúü¿¡]/i.test(text)) return "es";
    if (/[àèéìíîòóùú]/i.test(text)) return "it";
    if (/[ãõçáéíóú]/i.test(text)) return "pt";
    if (/[\u0400-\u04FF]/i.test(text)) return "ru";
    if (/[\u4e00-\u9fff]/i.test(text)) return "zh";
    if (/[\u3040-\u309F\u30A0-\u30FF]/i.test(text)) return "ja";
    if (/[\uAC00-\uD7AF]/i.test(text)) return "ko";
    if (/[\u0600-\u06FF]/i.test(text)) return "ar";
    return "en";
  }, []);

  const itemLang = item ? detectLang(`${item.title} ${item.description ?? ""}`) : "en";
  const needsTranslation = item ? itemLang !== locale : false;

  const handleTranslateAll = useCallback(async () => {
    if (showTranslation || !item) {
      setShowTranslation(false);
      return;
    }
    const translateOne = async (text: string) => {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, from: itemLang, to: locale }),
      });
      const data = await res.json();
      return data.status !== "fallback" ? data.translated : null;
    };

    const [title, desc, wish] = await Promise.all([
      translateOne(item.title),
      item.description ? translateOne(item.description) : Promise.resolve(null),
      item.wishlist ? translateOne(item.wishlist) : Promise.resolve(null),
    ]);
    if (title) {
      setTranslatedTitle(title);
      setTranslatedDesc(desc);
      setTranslatedWishlist(wish);
      setShowTranslation(true);
    }
  }, [item, itemLang, locale, showTranslation]);

  // Fetch owner profile for public display
  const [ownerProfile, setOwnerProfile] = useState<{
    displayName: string;
    avatarUrl: string;
    city: string;
    badge: string;
    completedSwaps: number;
  } | null>(null);

  useEffect(() => {
    if (!item) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    supabase
      .from("profiles")
      .select("display_name, avatar_url, location, badge, stats")
      .eq("user_id", item.ownerId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const loc = typeof data.location === "object" && data.location ? data.location : {};
          const stats = typeof data.stats === "object" && data.stats ? data.stats : {};
          setOwnerProfile({
            displayName: (data.display_name as string) || "Swaply User",
            avatarUrl: (data.avatar_url as string) || "",
            city: (loc as Record<string, unknown>).city as string || "",
            badge: (data.badge as string) || "free",
            completedSwaps: (stats as Record<string, unknown>).completedSwaps as number || 0,
          });
        }
      });
  }, [item]);

  // Dynamic OG meta tags for share cards
  useEffect(() => {
    if (!item) return;
    const ogTitle = `${item.title} — Swaply`;
    const ogDesc = item.description?.slice(0, 160) || `${item.category} · ${item.condition} · ${item.location}`;
    const ogImage = item.photos?.[0] || "";

    document.title = ogTitle;

    const setMeta = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("property", property);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("og:title", ogTitle);
    setMeta("og:description", ogDesc);
    setMeta("og:type", "product");
    if (ogImage) setMeta("og:image", ogImage);
    if (typeof window !== "undefined") setMeta("og:url", window.location.href);

    return () => { document.title = "Swaply"; };
  }, [item]);

  // GA4: object_page_view event
  useEffect(() => {
    if (!item) return;
    sendGAEvent("event", "object_page_view", {
      item_id: item.id,
      item_category: item.category,
      item_location: item.location,
    });
  }, [item]);

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
  const isReserved = item?.status === "reserved";

  // Semantic fields present
  const hasSemanticFields = item && (item.intent || item.flexibility || item.perceivedValue || item.clarity || item.context);

  if (loading.items || directLoading) {
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
    <div>
      {!user && <GuestBanner />}
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
              <SafeImage
                src={photos[activePhoto] || NO_IMAGE_URL}
                alt={`${item.title} — photo ${activePhoto + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 60vw"
                priority={activePhoto === 0}
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
                  aria-label={t("previousPhoto")}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setActivePhoto((p) => (p === photos.length - 1 ? 0 : p + 1))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white backdrop-blur transition hover:bg-black/60"
                  aria-label={t("nextPhoto")}
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
                  aria-label={t("selectPhoto", { number: idx + 1 })}
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

          {/* Title + metadata + share */}
          <div>
            {/* Translate button */}
            {needsTranslation && (
              <div className="mb-2">
                <TranslateButton
                  text={`${item.title}\n${item.description ?? ""}`}
                  sourceLang={itemLang}
                  onTranslated={() => void handleTranslateAll()}
                  onShowOriginal={() => setShowTranslation(false)}
                  showingTranslation={showTranslation}
                />
              </div>
            )}
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {showTranslation && translatedTitle ? translatedTitle : item.title}
              </h1>
              <div className="flex shrink-0 items-center gap-1">
                {/* WhatsApp share */}
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`${item.title} — Swaply\n${window.location.origin}/objects/${item.id}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-emerald-100 p-2 text-emerald-600 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-800/40"
                  title="WhatsApp"
                  aria-label="Share on WhatsApp"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                </a>
                {/* Facebook share */}
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/objects/${item.id}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-blue-100 p-2 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-800/40"
                  title="Facebook"
                  aria-label="Share on Facebook"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                </a>
                {/* Copy link / native share */}
                <button
                  type="button"
                  onClick={() => {
                    const url = `${window.location.origin}/objects/${item.id}`;
                    if (navigator.share) {
                      void navigator.share({ title: `${item.title} — Swaply`, text: `${item.description?.slice(0, 100) || item.title}\n${item.category} · ${item.location}`, url });
                    } else {
                      void navigator.clipboard.writeText(url);
                      setShareToast(true);
                      setTimeout(() => setShareToast(false), 2000);
                    }
                  }}
                  className="rounded-full bg-zinc-100 p-2 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                  title={t("share")}
                  aria-label={t("share")}
                >
                  <Share2 className="h-4 w-4" />
                </button>
                {shareToast && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    Link copiat!
                  </span>
                )}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Pill color="blue">{item.category}</Pill>
              <Pill color="zinc">{item.condition}</Pill>
              {isReserved ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                  <Lock className="h-3 w-3" />
                  Rezervat
                </span>
              ) : (
                <Pill color="green">{item.status}</Pill>
              )}
              {item.location && (
                <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  <MapPin className="h-3 w-3" />
                  {item.location}
                </span>
              )}
            </div>
          </div>

          {/* Share buttons */}
          <ShareButtons title={item.title} itemId={item.id} />

          {/* Description */}
          {item.description && (
            <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {showTranslation && translatedDesc ? translatedDesc : item.description}
            </p>
          )}

          {/* Wishlist */}
          {item.wishlist && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
              <p className="text-xs font-semibold uppercase text-blue-600 dark:text-blue-400">{t("wishlist")}</p>
              <p className="mt-1 text-sm text-blue-900 dark:text-blue-100">
                {showTranslation && translatedWishlist ? translatedWishlist : item.wishlist}
              </p>
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
            <div className="mt-2 flex items-center gap-3">
              {(isOwner ? user?.avatarUrl : ownerProfile?.avatarUrl) ? (
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-700">
                  <SafeImage
                    src={(isOwner ? user?.avatarUrl : ownerProfile?.avatarUrl) || NO_IMAGE_URL}
                    alt="avatar"
                    fill
                    className="object-cover"
                    sizes="40px"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                  {(isOwner ? (user?.displayName || "U") : (ownerProfile?.displayName || "U"))[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  {isOwner ? (user?.displayName || user?.email) : (ownerProfile?.displayName || item.ownerId.slice(0, 8) + "…")}
                </p>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  {(isOwner ? user?.badge : ownerProfile?.badge) && (
                    <Pill color="blue">{isOwner ? user?.badge : ownerProfile?.badge}</Pill>
                  )}
                  {(() => {
                    const city = isOwner ? String((user?.location as Record<string, unknown>)?.city || "") : (ownerProfile?.city || "");
                    return city ? (
                      <span className="flex items-center gap-0.5">
                        <MapPin className="h-3 w-3" />
                        {city}
                      </span>
                    ) : null;
                  })()}
                </div>
                {(ownerProfile?.completedSwaps ?? 0) > 0 && !isOwner && (
                  <p className="mt-0.5 text-xs text-zinc-400">
                    {ownerProfile!.completedSwaps} {t("swaps")}
                  </p>
                )}
              </div>
            </div>
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
              {/* Reserved badge — item is locked for another swap */}
              {isReserved && !isOwner && (
                <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/30">
                  <Lock className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Acest obiect este rezervat și nu poate fi schimbat momentan.
                  </p>
                </div>
              )}
              {/* Error from proposeSwap (e.g. item lock 409) */}
              {lastError && (
                <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
                  {lastError}
                </div>
              )}
              {!isOwner && !isReserved && (
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
                {!isOwner && !isReserved && (
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
            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
              <div className="space-y-2">
                <AuthGateModal returnTo={`/register?returnTo=/objects/${item.id}`} gaEvent="propose_swap_click">
                  <button
                    type="button"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    <Repeat2 className="h-4 w-4" />
                    {t("proposeExchange")}
                  </button>
                </AuthGateModal>
                <AuthGateModal returnTo={`/register?returnTo=/objects/${item.id}`}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white dark:bg-zinc-700"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {t("startSecureChat")}
                  </button>
                </AuthGateModal>
              </div>
            </div>
          )}

          {/* Report / Block */}
          {user && !isOwner && (
            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
              <Suspense fallback={<div className="h-8 animate-pulse rounded bg-zinc-100 dark:bg-zinc-700" />}>
                <ReportBlockButtons targetUserId={item.ownerId} targetItemId={item.id} />
              </Suspense>
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
                      <SafeImage
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
    </div>
  );
}
