"use client";

import HomePageClient from "./HomePageClient";
import { Link } from "@/i18n/navigation";
import { useAppState } from "@/lib/state";
import {
  ArrowRight,
  Bell,
  Bot,
  Check,
  ChevronRight,
  CircleCheck,
  Gauge,
  Handshake,
  HeartHandshake,
  ListTodo,
  MessageCircle,
  Package,
  Search,
  Sparkles,
  Star,
  Trophy,
  UserRoundCheck,
  WandSparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";

const SWAP_STEPS = [
  "pending",
  "accepted",
  "in_progress",
  "delivered",
  "completed",
] as const;

function progressForStatus(status: string) {
  if (status === "completed") return 5;
  if (status === "delivered_by_a" || status === "delivered_by_b") return 4;
  if (status === "in_progress" || status === "disputed") return 3;
  if (status === "accepted") return 2;
  return 1;
}

function AuthenticatedDashboard() {
  const {
    user,
    loading,
    lastError,
    items,
    matches,
    conversations,
    swaps,
    notifications,
    tokenBalance,
  } = useAppState();

  const tHome = useTranslations("home");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("nav");
  const tObjects = useTranslations("objects");
  const tMatch = useTranslations("matching");
  const tDesk = useTranslations("desk");
  const tProfile = useTranslations("profile");

  if (!user) return null;

  const ownItems = items.filter((item) => item.ownerId === user.id);
  const activeItems = ownItems.filter((item) => item.isActive && item.status === "active");
  const incompleteItems = ownItems.filter(
    (item) => !item.photos?.length || item.description.trim().length < 40 || !item.wishlist.trim(),
  );
  const activeSwaps = swaps.filter(
    (swap) =>
      (swap.requesterId === user.id || swap.responderId === user.id) &&
      !["completed", "cancelled", "rejected", "expired", "resolved"].includes(swap.status),
  );
  const completedSwaps = swaps.filter(
    (swap) =>
      (swap.requesterId === user.id || swap.responderId === user.id) && swap.status === "completed",
  );
  const unreadNotifications = notifications.filter((notification) => !notification.read);
  const unreadConversations = conversations.filter((conversation) =>
    conversation.messages.some((message) => message.senderId !== user.id && !message.isRead),
  );
  const relevantMatches = [...matches]
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
    .slice(0, 6);
  const recentConversation = [...conversations]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
  const recentSwap = [...activeSwaps].sort(
    (a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime(),
  )[0];
  const profileIncomplete =
    !user.displayName?.trim() ||
    !user.bio?.trim() ||
    !user.location?.country ||
    !user.location?.city ||
    user.languages.length === 0;

  const wishes = Array.from(
    new Map(
      activeItems
        .filter((item) => item.wishlist.trim())
        .map((item) => [item.wishlist.trim().toLowerCase(), { wish: item.wishlist.trim(), source: item }]),
    ).values(),
  ).slice(0, 6);

  const profileSignals = [
    {
      icon: Trophy,
      label: tProfile("completedSwaps"),
      value: Math.max(user.stats.completedSwaps, completedSwaps.length),
    },
    {
      icon: Package,
      label: tProfile("activeListings"),
      value: activeItems.length,
    },
    {
      icon: MessageCircle,
      label: tNav("messages"),
      value: unreadConversations.length,
    },
    {
      icon: Bell,
      label: tHome("statNotifs", { count: unreadNotifications.length }),
      value: unreadNotifications.length,
    },
    {
      icon: HeartHandshake,
      label: tNav("matching"),
      value: relevantMatches.length,
    },
    {
      icon: Handshake,
      label: tHome("activeSwaps", { count: activeSwaps.length }),
      value: activeSwaps.length,
    },
  ];

  const nextActions = [
    profileIncomplete
      ? {
          key: "profile",
          icon: UserRoundCheck,
          title: tHome("nudgeProfile"),
          description: tHome("nudgeProfileDesc"),
          href: "/profile",
        }
      : null,
    activeItems.length === 0
      ? {
          key: "item",
          icon: Package,
          title: tHome("nudgeNoItems"),
          description: tHome("nudgeNoItemsDesc"),
          href: "/objects/new",
        }
      : null,
    incompleteItems[0]
      ? {
          key: "complete",
          icon: ListTodo,
          title: incompleteItems[0].title,
          description: tCommon("recommendedNextStep"),
          href: `/objects/${incompleteItems[0].id}/edit`,
        }
      : null,
    recentConversation
      ? {
          key: "conversation",
          icon: MessageCircle,
          title: recentConversation.participantName,
          description: recentConversation.lastMessage || tHome("messagesLinkDesc"),
          href: "/messages",
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    icon: typeof Package;
    title: string;
    description: string;
    href: string;
  }>;

  const responseRate = Math.max(0, Math.min(100, user.responseRate ?? 0));
  const completionRate = Math.max(0, Math.min(100, user.completionRate ?? 0));
  const reputationScore =
    user.stats.reputation === "ambassador" ? 100 : user.stats.reputation === "trusted" ? 70 : 35;

  return (
    <div className="space-y-8 pb-8" data-home-state="authenticated-dashboard">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700 p-5 text-white shadow-xl sm:p-8 lg:p-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_80%_10%,#67e8f9_0,transparent_28%),radial-gradient(circle_at_12%_90%,#86efac_0,transparent_27%)]"
          aria-hidden="true"
        />
        <div className="relative grid gap-8 xl:grid-cols-[1.2fr_0.8fr] xl:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                {tHome("welcome")}
              </span>
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold capitalize backdrop-blur transition hover:bg-white/20"
              >
                <Star className="h-4 w-4" aria-hidden="true" />
                {user.stats.reputation} · {user.badge}
              </Link>
            </div>
            <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">
              {tHome("greeting", { name: user.firstName || user.displayName })}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
              {tHome("heroSubtitle")}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={activeSwaps.length ? "/desk" : activeItems.length ? "/matching" : "/objects/new"}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-bold text-blue-800 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl motion-reduce:transform-none"
              >
                {activeSwaps.length
                  ? tCommon("myDesk")
                  : activeItems.length
                    ? tNav("matching")
                    : tNav("addObject")}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/explore"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3 font-bold text-white backdrop-blur transition hover:bg-white/20"
              >
                <Search className="h-4 w-4" aria-hidden="true" />
                {tNav("explore")}
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-2">
            {profileSignals.map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <Icon className="h-5 w-5 text-blue-100" aria-hidden="true" />
                  <span className="text-2xl font-black">{value}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-xs font-semibold text-blue-100">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {lastError ? (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200" role="status">
          {tCommon("errorOccurred")} · {tCommon("tryAgain")}
        </section>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="relative overflow-hidden rounded-[2rem] border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-blue-50 p-6 shadow-sm dark:border-violet-900 dark:from-violet-950/30 dark:via-zinc-950 dark:to-blue-950/30 sm:p-7">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-violet-300/20 blur-3xl" aria-hidden="true" />
          <div className="relative flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg">
              <Bot className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">Swaply AI</p>
              <h2 className="mt-1 text-2xl font-black text-zinc-950 dark:text-white">{tMatch("ai_title")}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                {tHome("recommendedForYou")}. {tCommon("recommendedNextStep")}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/matching" className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700">
                  <WandSparkles className="h-4 w-4" aria-hidden="true" />
                  {tNav("matching")}
                </Link>
                <Link href="/messages" className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-5 py-2.5 text-sm font-bold text-violet-800 transition hover:bg-violet-50 dark:border-violet-800 dark:bg-zinc-900 dark:text-violet-200">
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  {tNav("messages")}
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">{tProfile("reputationAndTokens")}</p>
              <h2 className="mt-1 text-xl font-black text-zinc-950 dark:text-white capitalize">{user.stats.reputation}</h2>
            </div>
            <Trophy className="h-8 w-8 text-amber-500" aria-hidden="true" />
          </div>
          <div className="mt-5 space-y-4">
            <MetricBar label={tProfile("completedSwaps")} value={Math.min(100, reputationScore)} display={String(Math.max(user.stats.completedSwaps, completedSwaps.length))} />
            <MetricBar label="Response" value={responseRate} display={`${responseRate}%`} />
            <MetricBar label="Completion" value={completionRate} display={`${completionRate}%`} />
          </div>
          <div className="mt-5 flex items-center justify-between rounded-2xl bg-zinc-50 px-4 py-3 dark:bg-zinc-800/70">
            <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">{tProfile("tokens")}</span>
            <span className="text-lg font-black text-zinc-950 dark:text-white">{tokenBalance}</span>
          </div>
        </div>
      </section>

      <section aria-labelledby="personal-overview-title">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">{tHome("activityFeed")}</p>
            <h2 id="personal-overview-title" className="mt-1 text-2xl font-black text-zinc-950 dark:text-white">{tCommon("myDesk")}</h2>
          </div>
          <Link href="/desk" className="text-sm font-bold text-blue-700 hover:underline dark:text-blue-300">{tHome("viewAll")}</Link>
        </div>

        {loading.auth || loading.profile || loading.items ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((index) => <div key={index} className="h-36 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />)}
          </div>
        ) : nextActions.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {nextActions.slice(0, 4).map(({ key, icon: Icon, title, description, href }) => (
              <Link key={key} href={href} className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 motion-reduce:transform-none">
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-xl bg-blue-50 p-2.5 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                  <ChevronRight className="h-5 w-5 text-zinc-400 transition group-hover:translate-x-1" aria-hidden="true" />
                </div>
                <h3 className="mt-4 line-clamp-1 font-bold text-zinc-950 dark:text-white">{title}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">{description}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-6 dark:border-green-900 dark:bg-green-950/30">
            <CircleCheck className="h-7 w-7 text-green-700 dark:text-green-300" aria-hidden="true" />
            <p className="mt-3 font-bold text-green-950 dark:text-green-100">{tDesk("allClear")}</p>
          </div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">{tProfile("activeListings")}</p>
              <h2 className="mt-1 text-2xl font-black text-zinc-950 dark:text-white">{tHome("statItems", { count: activeItems.length })}</h2>
            </div>
            <Link href="/my/objects" className="text-sm font-bold text-blue-700 hover:underline dark:text-blue-300">{tHome("viewAll")}</Link>
          </div>
          {activeItems.length ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {activeItems.slice(0, 4).map((item) => (
                <Link key={item.id} href={`/objects/${item.id}`} className="group rounded-2xl border border-zinc-200 p-4 transition hover:border-blue-300 hover:bg-blue-50/40 dark:border-zinc-700 dark:hover:bg-blue-950/20">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><Package className="h-5 w-5" aria-hidden="true" /></span>
                    <div className="min-w-0">
                      <h3 className="line-clamp-1 font-bold text-zinc-950 dark:text-white">{item.title}</h3>
                      <p className="mt-1 line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">{item.category} · {item.condition}</p>
                      {item.wishlist ? <p className="mt-2 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-300">→ {item.wishlist}</p> : null}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <Link href="/objects/new" className="mt-5 flex items-center justify-between rounded-2xl border border-dashed border-zinc-300 p-5 font-bold text-blue-700 dark:border-zinc-700 dark:text-blue-300">
              {tObjects("addObject")}<ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </div>

        <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-pink-600 dark:text-pink-400">Wishlist</p>
              <h2 className="mt-1 text-2xl font-black text-zinc-950 dark:text-white">{tHome("recommendedForYou")}</h2>
            </div>
            <HeartHandshake className="h-7 w-7 text-pink-500" aria-hidden="true" />
          </div>
          {wishes.length ? (
            <div className="mt-5 space-y-3">
              {wishes.map(({ wish, source }, index) => {
                const possibleMatches = matches.filter((match) => match.itemOffered.id === source.id || match.itemRequested.id === source.id).length;
                return (
                  <Link key={`${source.id}-${index}`} href="/matching" className="flex items-center gap-4 rounded-2xl border border-zinc-200 p-4 transition hover:border-pink-300 hover:bg-pink-50/40 dark:border-zinc-700 dark:hover:bg-pink-950/20">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300"><HeartHandshake className="h-5 w-5" aria-hidden="true" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block line-clamp-1 font-bold text-zinc-950 dark:text-white">{wish}</span>
                      <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">{source.title} · {possibleMatches} {tNav("matching")}</span>
                    </span>
                    <ChevronRight className="h-5 w-5 text-zinc-400" aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-zinc-300 p-5 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">{tHome("nudgeNoItemsDesc")}</div>
          )}
        </div>
      </section>

      <section aria-labelledby="exchange-journey-title">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">{tHome("activeSwaps", { count: activeSwaps.length })}</p>
            <h2 id="exchange-journey-title" className="mt-1 text-2xl font-black text-zinc-950 dark:text-white">{tCommon("myDesk")}</h2>
          </div>
          <Link href="/exchange" className="text-sm font-bold text-emerald-700 hover:underline dark:text-emerald-300">{tHome("viewAll")}</Link>
        </div>

        {recentSwap ? (
          <div className="rounded-[2rem] border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm dark:border-emerald-900 dark:from-emerald-950/20 dark:to-zinc-950 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">{tDesk(`status_${recentSwap.status}`)}</p>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{tHome("activeSwapsDesc")}</p>
              </div>
              <Link href="/desk" className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800">{tCommon("nextStep")}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </div>
            <div className="mt-7 grid grid-cols-5 gap-2">
              {SWAP_STEPS.map((step, index) => {
                const reached = index + 1 <= progressForStatus(recentSwap.status);
                return (
                  <div key={step} className="min-w-0 text-center">
                    <div className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full border-2 ${reached ? "border-emerald-600 bg-emerald-600 text-white" : "border-zinc-300 bg-white text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"}`}>
                      {reached ? <Check className="h-4 w-4" aria-hidden="true" /> : <span className="text-xs font-black">{index + 1}</span>}
                    </div>
                    <div className={`mx-auto mt-2 h-1 w-full rounded-full ${reached ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-800"}`} aria-hidden="true" />
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <Handshake className="mx-auto h-8 w-8 text-zinc-400" aria-hidden="true" />
            <p className="mt-3 font-bold text-zinc-950 dark:text-white">{tDesk("noTasks")}</p>
            <Link href="/matching" className="mt-4 inline-flex items-center gap-2 font-bold text-blue-700 hover:underline dark:text-blue-300">{tNav("matching")}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </div>
        )}
      </section>

      <section aria-labelledby="recommendations-title">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-700 dark:text-green-400">{tMatch("ai_title")}</p>
            <h2 id="recommendations-title" className="mt-1 text-2xl font-black text-zinc-950 dark:text-white">{tHome("recommendedForYou")}</h2>
          </div>
          <Link href="/matching" className="text-sm font-bold text-green-700 hover:underline dark:text-green-300">{tHome("viewAll")}</Link>
        </div>

        {relevantMatches.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {relevantMatches.map((match) => (
              <Link key={match.id} href="/matching" className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-green-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 motion-reduce:transform-none">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-800 dark:bg-green-950 dark:text-green-200">{Math.round(match.compatibilityScore)}%</span>
                  <Sparkles className="h-5 w-5 text-green-600" aria-hidden="true" />
                </div>
                <h3 className="mt-4 line-clamp-1 font-bold text-zinc-950 dark:text-white">{match.itemRequested.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{match.aiSummary || match.reason || match.manualFallbackReason || tMatch("ai_title")}</p>
                <div className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-green-700 dark:text-green-300">{tMatch("express_interest")}<ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" /></div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <Sparkles className="mx-auto h-8 w-8 text-zinc-400" aria-hidden="true" />
            <p className="mt-3 font-bold text-zinc-950 dark:text-white">{tMatch("emptyTitle")}</p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{tMatch("emptyHint")}</p>
          </div>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickLink href="/objects/new" icon={Package} title={tNav("addObject")} />
        <QuickLink href="/explore" icon={Search} title={tNav("explore")} />
        <QuickLink href="/matching" icon={HeartHandshake} title={tNav("matching")} />
        <QuickLink href="/desk" icon={Gauge} title={tCommon("myDesk")} />
      </section>
    </div>
  );
}

function MetricBar({ label, value, display }: { label: string; value: number; display: string }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-zinc-600 dark:text-zinc-300">{label}</span>
        <span className="font-black text-zinc-950 dark:text-white">{display}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function QuickLink({ href, icon: Icon, title }: { href: string; icon: typeof Package; title: string }) {
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 motion-reduce:transform-none">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"><Icon className="h-5 w-5" aria-hidden="true" /></span>
      <span className="min-w-0 flex-1 font-bold text-zinc-950 dark:text-white">{title}</span>
      <ChevronRight className="h-5 w-5 text-zinc-400 transition group-hover:translate-x-1" aria-hidden="true" />
    </Link>
  );
}

export default function HomeDashboardClient() {
  const { user } = useAppState();
  return user ? <AuthenticatedDashboard /> : <HomePageClient />;
}
