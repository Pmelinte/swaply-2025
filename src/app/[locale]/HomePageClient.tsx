"use client";

import { ViewTransitionLink } from "@/components/ViewTransitionLink";
import { Link } from "@/i18n/navigation";
import { useAppState } from "@/lib/state";
import {
  ArrowRight,
  Bell,
  ChevronRight,
  CircleCheck,
  Clock3,
  Globe2,
  Handshake,
  HeartHandshake,
  ListTodo,
  MessageCircle,
  Package,
  ShieldCheck,
  Sparkles,
  Star,
  UserRoundCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";

const BRANCH_CARDS = [
  { href: "/objects", emoji: "📦", label: "objects", desc: "objectsDesc", bg: "#E6F1FB" },
  { href: "/properties", emoji: "🏠", label: "properties", desc: "propertiesDesc", bg: "#EEEDFE" },
  { href: "/services", emoji: "🔧", label: "services", desc: "servicesDesc", bg: "#E1F5EE" },
  { href: "/events", emoji: "🎫", label: "events", desc: "eventsDesc", bg: "#FAEEDA" },
] as const;

const HOW_IT_WORKS = [
  { key: "directSwap", icon: Handshake },
  { key: "aiMatching", icon: Sparkles },
  { key: "logistics", icon: CircleCheck },
] as const;

const TRUST_CARDS = [
  { key: "globalCommunity", icon: Globe2, href: "/about" },
  { key: "negotiation", icon: Handshake, href: "/about" },
  { key: "localPartners", icon: ShieldCheck, href: "/blog" },
] as const;

function GuestHome() {
  const tHero = useTranslations("hero");
  const tBranch = useTranslations("branches");
  const tBenefits = useTranslations("benefits");
  const tGuest = useTranslations("guest");
  const tNav = useTranslations("nav");
  const tLogin = useTranslations("login");

  return (
    <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm dark:bg-zinc-950">
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 px-5 py-14 text-white sm:px-10 sm:py-20 lg:px-16">
        <div className="absolute inset-0 -z-10 opacity-25 [background-image:radial-gradient(circle_at_20%_15%,white_0,transparent_28%),radial-gradient(circle_at_85%_70%,#86efac_0,transparent_24%)]" />
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">
            <Globe2 className="h-4 w-4" aria-hidden="true" />
            {tBenefits("globalCommunity")}
          </div>
          <h1 className="text-balance text-4xl font-black tracking-tight sm:text-6xl">
            {tHero("tagline")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base text-blue-50 sm:text-lg">
            {tBenefits("directSwap")} · {tBenefits("aiMatching")} · {tBenefits("logistics")}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              data-analytics-event="hero_cta_primary"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-7 py-3 font-bold text-blue-700 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transform-none"
            >
              {tGuest("bannerCta")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/explore"
              data-analytics-event="hero_cta_secondary"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/50 bg-white/10 px-7 py-3 font-bold text-white backdrop-blur transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              {tNav("explore")}
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="px-5 py-10 sm:px-10 lg:px-16" aria-labelledby="home-domains-title">
        <h2 id="home-domains-title" className="sr-only">
          {tNav("quickNav")}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {BRANCH_CARDS.map((card) => (
            <ViewTransitionLink
              key={card.href}
              href={card.href}
              className="group flex min-h-40 items-center gap-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-700 motion-reduce:transform-none"
            >
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl"
                style={{ backgroundColor: card.bg }}
                aria-hidden="true"
              >
                {card.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  {tBranch(card.label)}
                </h3>
                <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {tBranch(card.desc)}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-zinc-300 transition group-hover:translate-x-1 dark:text-zinc-600 motion-reduce:transform-none" aria-hidden="true" />
            </ViewTransitionLink>
          ))}
        </div>
      </section>

      <section className="bg-zinc-50 px-5 py-12 dark:bg-zinc-900/60 sm:px-10 lg:px-16" aria-labelledby="home-how-title">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
            {tBenefits("label")}
          </p>
          <h2 id="home-how-title" className="mt-3 text-center text-3xl font-black text-zinc-900 dark:text-zinc-50">
            {tBenefits("directSwap")}
          </h2>
          <ol className="mt-8 grid gap-5 md:grid-cols-3">
            {HOW_IT_WORKS.map(({ key, icon: Icon }, index) => (
              <li key={key} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="text-3xl font-black text-zinc-200 dark:text-zinc-700" aria-hidden="true">
                    {index + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  {tBenefits(key)}
                </h3>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-10 lg:px-16" aria-labelledby="home-trust-title">
        <div className="mx-auto max-w-5xl">
          <h2 id="home-trust-title" className="text-center text-3xl font-black text-zinc-900 dark:text-zinc-50">
            {tLogin("platformInfo")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-zinc-600 dark:text-zinc-400">
            {tLogin("platformInfoDescription")}
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {TRUST_CARDS.map(({ key, icon: Icon, href }) => (
              <Link
                key={key}
                href={href}
                data-analytics-event={href === "/blog" ? "guide_opened" : "explore_handoff"}
                className="group rounded-2xl border border-zinc-200 bg-white p-6 transition hover:border-green-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-green-700"
              >
                <Icon className="h-6 w-6 text-green-700 dark:text-green-400" aria-hidden="true" />
                <h3 className="mt-4 font-bold text-zinc-900 dark:text-zinc-50">{tBenefits(key)}</h3>
                <ArrowRight className="mt-5 h-4 w-4 text-zinc-400 transition group-hover:translate-x-1 motion-reduce:transform-none" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-emerald-50 via-green-100 to-teal-100 px-5 py-14 text-center dark:from-emerald-950/50 dark:via-green-950/50 dark:to-teal-950/50 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-3xl">
          <ShieldCheck className="mx-auto h-10 w-10 text-green-700 dark:text-green-300" aria-hidden="true" />
          <h2 className="mt-5 text-3xl font-black text-zinc-900 dark:text-white">
            {tBenefits("globalCommunity")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-zinc-700 dark:text-zinc-300">
            {tBenefits("negotiation")} · {tBenefits("localPartners")}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-blue-600 px-7 py-3 font-bold text-white shadow-lg transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
            >
              {tGuest("bannerCta")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/blog"
              data-analytics-event="guide_opened"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-green-700/30 bg-white/70 px-7 py-3 font-bold text-green-900 backdrop-blur transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-700 dark:bg-zinc-950/50 dark:text-green-200"
            >
              {tLogin("platformInfo")}
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function AuthenticatedHome() {
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
  const unreadNotifications = notifications.filter((notification) => !notification.read);
  const relevantMatches = [...matches]
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
    .slice(0, 3);
  const recentConversation = [...conversations]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
  const recentSwap = activeSwaps[0];
  const profileIncomplete =
    !user.displayName?.trim() ||
    !user.bio?.trim() ||
    !user.location?.country ||
    !user.location?.city ||
    user.languages.length === 0;

  const primaryHref = activeSwaps.length > 0 ? "/desk" : activeItems.length === 0 ? "/objects/new" : "/matching";
  const primaryLabel = activeSwaps.length > 0 ? tCommon("myDesk") : activeItems.length === 0 ? tNav("addObject") : tNav("matching");

  const prioritySignals = [
    {
      key: "matches",
      icon: HeartHandshake,
      value: relevantMatches.length,
      label: tHome("nudgeMatches", { count: relevantMatches.length }),
      href: "/matching" as const,
    },
    {
      key: "notifications",
      icon: Bell,
      value: unreadNotifications.length,
      label: tHome("statNotifs", { count: unreadNotifications.length }),
      href: "/notifications" as const,
    },
    {
      key: "swaps",
      icon: Handshake,
      value: activeSwaps.length,
      label: tHome("activeSwaps", { count: activeSwaps.length }),
      href: "/desk" as const,
    },
    {
      key: "items",
      icon: Package,
      value: activeItems.length,
      label: tHome("statItems", { count: activeItems.length }),
      href: "/my/objects" as const,
    },
  ];

  const resumeCards = [
    recentConversation
      ? {
          key: "conversation",
          icon: MessageCircle,
          title: recentConversation.participantName,
          description: recentConversation.lastMessage || tHome("messagesLinkDesc"),
          href: "/messages" as const,
        }
      : null,
    recentSwap
      ? {
          key: "swap",
          icon: Handshake,
          title: tDesk(`status_${recentSwap.status}`),
          description: tHome("activeSwapsDesc"),
          href: "/desk" as const,
        }
      : null,
    incompleteItems[0]
      ? {
          key: "item",
          icon: Package,
          title: incompleteItems[0].title,
          description: tCommon("recommendedNextStep"),
          href: `/objects/${incompleteItems[0].id}/edit` as const,
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    icon: typeof MessageCircle;
    title: string;
    description: string;
    href: string;
  }>;

  const actionCards = [
    profileIncomplete
      ? {
          key: "profile",
          icon: UserRoundCheck,
          title: tHome("nudgeProfile"),
          description: tHome("nudgeProfileDesc"),
          href: "/profile" as const,
        }
      : null,
    activeItems.length === 0
      ? {
          key: "first-item",
          icon: Package,
          title: tHome("nudgeNoItems"),
          description: tHome("nudgeNoItemsDesc"),
          href: "/objects/new" as const,
        }
      : null,
    incompleteItems.length > 0
      ? {
          key: "complete-item",
          icon: ListTodo,
          title: incompleteItems[0].title,
          description: tCommon("recommendedNextStep"),
          href: `/objects/${incompleteItems[0].id}/edit` as const,
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    icon: typeof MessageCircle;
    title: string;
    description: string;
    href: string;
  }>;

  return (
    <div className="space-y-8" data-home-state="authenticated">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-800 via-blue-700 to-cyan-600 px-5 py-8 text-white shadow-lg sm:px-8 sm:py-10">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_85%_15%,white_0,transparent_24%),radial-gradient(circle_at_10%_90%,#86efac_0,transparent_25%)]" aria-hidden="true" />
        <div className="relative">
          <p className="text-sm font-semibold text-blue-100">{tHome("welcome")}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">
            {tHome("greeting", { name: user.firstName || user.displayName })}
          </h1>
          <p className="mt-3 max-w-2xl text-blue-100">{tHome("heroSubtitle")}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label={tCommon("recommendedNextStep")}>
            {prioritySignals.map(({ key, icon: Icon, value, label, href }) => (
              <Link
                key={key}
                href={href}
                className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <div className="flex items-center justify-between gap-3">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  <span className="text-2xl font-black">{value}</span>
                </div>
                <p className="mt-3 text-sm font-semibold text-blue-50">{label}</p>
              </Link>
            ))}
          </div>

          <Link
            href={primaryHref}
            data-analytics-event="hero_cta_primary"
            className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-bold text-blue-700 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transform-none"
          >
            {primaryLabel}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {lastError ? (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200" role="status">
          {tCommon("errorOccurred")} · {tCommon("tryAgain")}
        </section>
      ) : null}

      <section aria-labelledby="resume-title">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">{tCommon("nextStep")}</p>
            <h2 id="resume-title" className="mt-1 text-2xl font-black text-zinc-900 dark:text-zinc-50">{tCommon("myDesk")}</h2>
          </div>
          <Link href="/desk" className="text-sm font-bold text-blue-700 hover:underline dark:text-blue-300">
            {tHome("viewAll")}
          </Link>
        </div>

        {loading.auth || loading.profile || loading.items ? (
          <div className="grid gap-4 md:grid-cols-3" aria-label={tCommon("loadingData")}>
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-32 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
            ))}
          </div>
        ) : resumeCards.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-3">
            {resumeCards.map(({ key, icon: Icon, title, description, href }) => (
              <Link
                key={key}
                href={href}
                data-analytics-event="resume_action_opened"
                className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-zinc-800 dark:bg-zinc-900 motion-reduce:transform-none"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="rounded-xl bg-blue-50 p-2.5 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <ChevronRight className="h-5 w-5 text-zinc-400 transition group-hover:translate-x-1 motion-reduce:transform-none" aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-bold text-zinc-900 dark:text-zinc-50">{title}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{description}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <CircleCheck className="mx-auto h-8 w-8 text-green-600" aria-hidden="true" />
            <p className="mt-3 font-bold text-zinc-900 dark:text-zinc-50">{tDesk("allClear")}</p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{tDesk("noTasks")}</p>
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]" aria-labelledby="priorities-title">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <ListTodo className="h-6 w-6 text-amber-600" aria-hidden="true" />
            <h2 id="priorities-title" className="text-2xl font-black text-zinc-900 dark:text-zinc-50">{tDesk("tasksTitle")}</h2>
          </div>
          {actionCards.length > 0 ? (
            <div className="space-y-3">
              {actionCards.map(({ key, icon: Icon, title, description, href }) => (
                <Link
                  key={key}
                  href={href}
                  data-analytics-event="onboarding_action"
                  className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-amber-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <span className="rounded-xl bg-amber-50 p-2.5 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-zinc-900 dark:text-zinc-50">{title}</span>
                    <span className="mt-1 block text-sm text-zinc-500 dark:text-zinc-400">{description}</span>
                  </span>
                  <ChevronRight className="h-5 w-5 text-zinc-400" aria-hidden="true" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-5 dark:border-green-900 dark:bg-green-950/30">
              <CircleCheck className="h-6 w-6 text-green-700 dark:text-green-300" aria-hidden="true" />
              <p className="mt-3 font-bold text-green-950 dark:text-green-100">{tDesk("allClear")}</p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <Clock3 className="h-6 w-6 text-blue-600" aria-hidden="true" />
            <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">{tHome("activityFeed")}</h2>
          </div>
          <dl className="mt-5 space-y-4">
            <div className="flex items-center justify-between gap-4 border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <dt className="text-sm text-zinc-500 dark:text-zinc-400">{tHome("activeSwaps", { count: activeSwaps.length })}</dt>
              <dd className="font-black text-zinc-900 dark:text-zinc-50">{activeSwaps.length}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <dt className="text-sm text-zinc-500 dark:text-zinc-400">{tHome("statItems", { count: activeItems.length })}</dt>
              <dd className="font-black text-zinc-900 dark:text-zinc-50">{activeItems.length}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-sm text-zinc-500 dark:text-zinc-400">{tCommon("tokenBalance")}</dt>
              <dd className="font-black text-zinc-900 dark:text-zinc-50">{tokenBalance}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section aria-labelledby="recommendations-title">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-700 dark:text-green-400">{tCommon("recommendedNextStep")}</p>
            <h2 id="recommendations-title" className="mt-1 text-2xl font-black text-zinc-900 dark:text-zinc-50">{tHome("recommendedForYou")}</h2>
          </div>
          <Link href="/matching" className="text-sm font-bold text-green-700 hover:underline dark:text-green-300">
            {tHome("viewAll")}
          </Link>
        </div>

        {relevantMatches.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-3">
            {relevantMatches.map((match) => (
              <Link
                key={match.id}
                href="/matching"
                data-analytics-event="recommendation_opened"
                className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-green-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700 dark:border-zinc-800 dark:bg-zinc-900 motion-reduce:transform-none"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-800 dark:bg-green-950 dark:text-green-200">
                    {Math.round(match.compatibilityScore)}%
                  </span>
                  <Sparkles className="h-5 w-5 text-green-600" aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-bold text-zinc-900 dark:text-zinc-50">{match.itemRequested.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {match.aiSummary || match.reason || match.manualFallbackReason || tMatch("ai_title")}
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm font-bold text-green-700 dark:text-green-300">
                  {tMatch("express_interest")}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <Sparkles className="mx-auto h-8 w-8 text-zinc-400" aria-hidden="true" />
            <p className="mt-3 font-bold text-zinc-900 dark:text-zinc-50">{tMatch("emptyTitle")}</p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{tMatch("emptyHint")}</p>
            <Link href="/objects/new" className="mt-4 inline-flex items-center gap-2 font-bold text-blue-700 hover:underline dark:text-blue-300">
              {tObjects("addObject")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-3" aria-label={tHome("guestDiscover")}>
        <Link href="/stories" data-analytics-event="story_opened" className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
          <HeartHandshake className="h-6 w-6 text-blue-600" aria-hidden="true" />
          <h2 className="mt-4 font-bold text-zinc-900 dark:text-zinc-50">{tNav("info")}</h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{tHome("activitySwap")}</p>
        </Link>
        <Link href="/blog" data-analytics-event="guide_opened" className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
          <Sparkles className="h-6 w-6 text-blue-600" aria-hidden="true" />
          <h2 className="mt-4 font-bold text-zinc-900 dark:text-zinc-50">{tHome("guestInfo")}</h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{tHome("guestBadges")}</p>
        </Link>
        <Link href="/premium" className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 shadow-sm transition hover:shadow-md dark:border-amber-800 dark:from-amber-950/30 dark:to-orange-950/30">
          <Star className="h-6 w-6 text-amber-600" aria-hidden="true" />
          <h2 className="mt-4 font-bold text-zinc-900 dark:text-zinc-50">{tHome("reputation")}</h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{user.stats.reputation}</p>
        </Link>
      </section>
    </div>
  );
}

export default function HomePageClient() {
  const { user } = useAppState();
  return user ? <AuthenticatedHome /> : <GuestHome />;
}
