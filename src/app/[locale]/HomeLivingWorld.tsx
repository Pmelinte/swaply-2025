"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Bot,
  Clock3,
  Globe2,
  House,
  Lightbulb,
  Newspaper,
  Package,
  Sparkles,
  Ticket,
  Wrench,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAppState } from "@/lib/state";

type StoryDomain = "object" | "property" | "service" | "event" | "unknown";

type FreshnessPayload = {
  since: string;
  stories: Array<{
    slug: string;
    title: string;
    excerpt: string;
    domain: StoryDomain;
    publishedAt: string;
    isNew: boolean;
  }>;
  blog: Array<{
    slug: string;
    title: string;
    description: string;
    category: string;
    date: string;
    isNew: boolean;
  }>;
  featureUpdates: Array<{
    id: string;
    href: string;
    releasedAt: string;
    isNew: boolean;
  }>;
};

const DOMAIN_ICONS = {
  object: Package,
  property: House,
  service: Wrench,
  event: Ticket,
  unknown: Globe2,
} as const;

const DOMAIN_LINKS = [
  { domain: "object", href: "/objects" },
  { domain: "property", href: "/properties" },
  { domain: "service", href: "/services" },
  { domain: "event", href: "/events" },
] as const;

export function HomeWorldMap() {
  const tBenefits = useTranslations("benefits");

  return (
    <section
      className="relative overflow-hidden rounded-[2rem] border border-blue-200 bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-900 px-5 py-7 text-white shadow-xl dark:border-blue-950 sm:px-8"
      aria-labelledby="home-world-title"
      data-home-world-map
    >
      <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur">
            <Globe2 className="h-4 w-4" aria-hidden="true" />
            Swaply
          </span>
          <h2 id="home-world-title" className="mt-4 text-2xl font-black sm:text-3xl">
            {tBenefits("globalCommunity")}
          </h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-blue-100">
            {tBenefits("directSwap")} · {tBenefits("aiMatching")} · {tBenefits("logistics")}
          </p>
        </div>

        <div className="relative min-h-48 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-3" aria-hidden="true">
          <svg viewBox="0 0 900 420" className="h-full min-h-48 w-full opacity-90">
            <defs>
              <linearGradient id="swaply-world" x1="0" x2="1">
                <stop offset="0" stopColor="#7dd3fc" />
                <stop offset="1" stopColor="#86efac" />
              </linearGradient>
              <filter id="soft-glow">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <g fill="url(#swaply-world)" opacity="0.72">
              <path d="M74 126 118 83l74-20 62 15 52 42-21 42-45 13-29 45-51 3-23-37-39-13Z" />
              <path d="m251 225 37 19 25 49-7 55-25 52-24-11-10-58-25-45Z" />
              <path d="m394 94 58-34 88 5 37 30-28 29-61 7-32 30-45-17Z" />
              <path d="m430 167 76-24 69 21 38 53-21 51-43 17-25 70-48-24-23-74-38-34Z" />
              <path d="m558 91 82-30 99 21 81 51-29 41-78-13-57 28-47-22-59-31Z" />
              <path d="m700 283 61-25 58 31-8 49-52 29-56-27Z" />
              <path d="m816 188 25 4 18 23-11 22-29-10Z" />
            </g>
            <g fill="#fff" filter="url(#soft-glow)">
              <circle cx="190" cy="142" r="5" />
              <circle cx="278" cy="279" r="4" />
              <circle cx="472" cy="118" r="5" />
              <circle cx="520" cy="222" r="5" />
              <circle cx="635" cy="133" r="4" />
              <circle cx="739" cy="145" r="5" />
              <circle cx="758" cy="309" r="5" />
            </g>
            <g stroke="#bae6fd" strokeWidth="2" opacity="0.35" fill="none">
              <path d="M190 142 Q350 25 472 118" />
              <path d="M472 118 Q610 55 739 145" />
              <path d="M520 222 Q660 210 758 309" />
              <path d="M278 279 Q380 185 520 222" />
            </g>
          </svg>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(2,6,23,0.45)_100%)]" />
        </div>
      </div>
    </section>
  );
}

function NewDot({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <span className="relative inline-flex h-3 w-3" aria-label="New">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:animate-none" aria-hidden="true" />
      <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" aria-hidden="true" />
    </span>
  );
}

function domainLabel(domain: StoryDomain, tBranch: ReturnType<typeof useTranslations>) {
  if (domain === "object") return tBranch("objects");
  if (domain === "property") return tBranch("properties");
  if (domain === "service") return tBranch("services");
  if (domain === "event") return tBranch("events");
  return "Swaply";
}

export default function HomeLivingWorld() {
  const locale = useLocale();
  const { user, items, matches, swaps, conversations } = useAppState();
  const tHome = useTranslations("home");
  const tNav = useTranslations("nav");
  const tBranch = useTranslations("branches");
  const tBenefits = useTranslations("benefits");
  const tGuest = useTranslations("guest");
  const [feed, setFeed] = useState<FreshnessPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const visitKey = `swaply:home:last-visit:${user?.id ?? "guest"}`;

  useEffect(() => {
    let cancelled = false;
    const stored = window.localStorage.getItem(visitKey);
    const fallback = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const since = stored ?? fallback;

    async function load() {
      try {
        const response = await fetch(
          `/api/home-freshness?locale=${encodeURIComponent(locale)}&since=${encodeURIComponent(since)}`,
        );
        if (!response.ok) throw new Error("home freshness unavailable");
        const payload = (await response.json()) as FreshnessPayload;
        if (!cancelled) setFeed(payload);
      } catch {
        if (!cancelled) setFeed(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
          window.localStorage.setItem(visitKey, new Date().toISOString());
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [locale, visitKey]);

  const consultant = useMemo(() => {
    if (!user) {
      return {
        text: `${tBenefits("aiMatching")} · ${tBenefits("directSwap")}`,
        href: "/explore",
        action: tNav("explore"),
      };
    }

    const activeSwaps = swaps.filter(
      (swap) =>
        (swap.requesterId === user.id || swap.responderId === user.id) &&
        !["completed", "cancelled", "rejected", "expired", "resolved"].includes(swap.status),
    );
    const ownActive = items.filter(
      (item) => item.ownerId === user.id && item.isActive && item.status === "active",
    );
    const unread = conversations.reduce(
      (count, conversation) =>
        count +
        conversation.messages.filter(
          (message) => message.senderId !== user.id && !message.isRead,
        ).length,
      0,
    );

    if (activeSwaps.length > 0) {
      return {
        text: tHome("activeSwaps", { count: activeSwaps.length }),
        href: "/desk",
        action: tNav("exchange"),
      };
    }
    if (unread > 0) {
      return {
        text: tHome("messagesLinkDesc"),
        href: "/messages",
        action: tNav("messages"),
      };
    }
    if (matches.length > 0) {
      return {
        text: tHome("nudgeMatches", { count: Math.min(matches.length, 6) }),
        href: "/matching",
        action: tNav("matching"),
      };
    }
    if (ownActive.length === 0) {
      return {
        text: tHome("nudgeNoItemsDesc"),
        href: "/objects/new",
        action: tNav("addObject"),
      };
    }
    return {
      text: tHome("recommendedForYou"),
      href: "/matching",
      action: tNav("matching"),
    };
  }, [conversations, items, matches, swaps, tBenefits, tHome, tNav, user]);

  return (
    <div className="space-y-8" data-home-living-world>
      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]" aria-labelledby="swaply-consultant-title">
        <div className="rounded-[2rem] border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-blue-50 p-6 shadow-sm dark:border-violet-900 dark:from-violet-950/30 dark:via-zinc-950 dark:to-blue-950/30">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg">
              <Bot className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">Swaply AI</p>
                <Sparkles className="h-4 w-4 text-violet-500" aria-hidden="true" />
              </div>
              <h2 id="swaply-consultant-title" className="mt-1 text-2xl font-black text-zinc-950 dark:text-white">
                {tHome("recommendedForYou")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                {consultant.text}
              </p>
              <Link
                href={consultant.href}
                className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-violet-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700"
              >
                {consultant.action}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <Clock3 className="h-5 w-5 text-blue-600" aria-hidden="true" />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
                {tHome("activityFeed")}
              </p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {feed
                  ? new Intl.DateTimeFormat(locale, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(feed.since))
                  : tHome("recommendedForYou")}
              </p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            <FreshCount icon={BookOpen} value={feed?.stories.filter((entry) => entry.isNew).length ?? 0} label="Stories" />
            <FreshCount icon={Newspaper} value={feed?.blog.filter((entry) => entry.isNew).length ?? 0} label="Blog" />
            <FreshCount icon={Lightbulb} value={feed?.featureUpdates.filter((entry) => entry.isNew).length ?? 0} label="Swaply" />
          </div>
        </div>
      </section>

      <section aria-labelledby="home-fresh-stories-title">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">Stories</p>
            <h2 id="home-fresh-stories-title" className="mt-1 text-2xl font-black text-zinc-950 dark:text-white">
              {tHome("activityFeed")}
            </h2>
          </div>
          <Link href="/stories" className="text-sm font-bold text-blue-700 hover:underline dark:text-blue-300">
            {tHome("viewAll")}
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5" aria-busy="true">
            {[0, 1, 2, 3, 4].map((index) => (
              <div key={index} className="h-44 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
            ))}
          </div>
        ) : feed?.stories.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {feed.stories.map((story) => {
              const Icon = DOMAIN_ICONS[story.domain];
              return (
                <Link
                  key={story.slug}
                  href="/stories"
                  data-analytics-event="story_opened"
                  className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 motion-reduce:transform-none"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {domainLabel(story.domain, tBranch)}
                    </span>
                    <NewDot active={story.isNew} />
                  </div>
                  <h3 className="mt-4 line-clamp-2 font-black text-zinc-950 dark:text-white">{story.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{story.excerpt}</p>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50/70 p-5 dark:border-emerald-900 dark:bg-emerald-950/20">
            <p className="text-sm leading-6 text-emerald-950 dark:text-emerald-100">{tBenefits("globalCommunity")}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {DOMAIN_LINKS.map(({ domain, href }) => {
                const Icon = DOMAIN_ICONS[domain];
                return (
                  <Link
                    key={domain}
                    href={href}
                    className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-white px-4 py-4 font-bold text-emerald-950 transition hover:-translate-y-0.5 hover:shadow-sm dark:border-emerald-800 dark:bg-zinc-900 dark:text-emerald-100 motion-reduce:transform-none"
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                      {domainLabel(domain, tBranch)}
                    </span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-blue-600" aria-hidden="true" />
              <h2 className="text-xl font-black text-zinc-950 dark:text-white">Blog</h2>
            </div>
            <Link href="/blog" data-analytics-event="guide_opened" className="text-sm font-bold text-blue-700 hover:underline dark:text-blue-300">
              {tHome("viewAll")}
            </Link>
          </div>
          <div className="space-y-3">
            {feed?.blog.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="flex items-start justify-between gap-4 rounded-2xl bg-zinc-50 p-4 transition hover:bg-blue-50 dark:bg-zinc-800/70 dark:hover:bg-blue-950/30"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-blue-600 dark:text-blue-300">{post.category}</p>
                  <h3 className="mt-1 line-clamp-2 font-bold text-zinc-950 dark:text-white">{post.title}</h3>
                </div>
                <NewDot active={post.isNew} />
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-emerald-200 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-100 p-6 shadow-sm dark:border-emerald-900 dark:from-emerald-950/40 dark:via-green-950/40 dark:to-teal-950/40">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
            <h2 className="text-xl font-black">Swaply</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-emerald-950/70 dark:text-emerald-100/80">{tGuest("bannerCta")} · {tHome("recommendedForYou")}</p>
          <div className="mt-5 space-y-2">
            {feed?.featureUpdates.length ? (
              feed.featureUpdates.map((feature) => (
                <Link
                  key={feature.id}
                  href={feature.href}
                  className="flex items-center justify-between rounded-xl border border-emerald-200/70 bg-white/70 px-4 py-3 text-sm font-bold text-emerald-950 transition hover:bg-white dark:border-emerald-800 dark:bg-zinc-950/40 dark:text-emerald-100"
                >
                  <span>{feature.id === "stories" ? "Stories" : feature.id}</span>
                  <span className="flex items-center gap-2">
                    <NewDot active={feature.isNew} />
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </Link>
              ))
            ) : (
              <Link
                href="/blog"
                className="flex items-center justify-between rounded-xl border border-emerald-200/70 bg-white/70 px-4 py-3 text-sm font-bold text-emerald-950 transition hover:bg-white dark:border-emerald-800 dark:bg-zinc-950/40 dark:text-emerald-100"
              >
                <span>Blog</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function FreshCount({ icon: Icon, value, label }: { icon: typeof BookOpen; value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-zinc-50 px-3 py-4 dark:bg-zinc-800/70">
      <Icon className="mx-auto h-4 w-4 text-blue-600" aria-hidden="true" />
      <div className="mt-2 text-xl font-black text-zinc-950 dark:text-white">{value}</div>
      <div className="mt-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">{label}</div>
    </div>
  );
}
