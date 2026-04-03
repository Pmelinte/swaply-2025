"use client";

import { Link } from "@/i18n/navigation";
import { ViewTransitionLink } from "@/components/ViewTransitionLink";
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Star,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { LazyMapPreview } from "@/components/LazyMapPreview";

const BENEFITS_KEYS = [
  "directSwap",
  "globalCommunity",
  "aiMatching",
  "escrow",
  "logistics",
  "negotiation",
  "localPartners",
] as const;

const BRANCH_CARDS = [
  { href: "/objects",    emoji: "📦", label: "objects",     desc: "objectsDesc",     bg: "#E6F1FB", anim: "home-card-tl" },
  { href: "/properties", emoji: "🏠", label: "properties",  desc: "propertiesDesc",  bg: "#EEEDFE", anim: "home-card-tr" },
  { href: "/services",   emoji: "🔧", label: "services",    desc: "servicesDesc",    bg: "#E1F5EE", anim: "home-card-bl" },
  { href: "/events",     emoji: "🎫", label: "events",      desc: "eventsDesc",      bg: "#FAEEDA", anim: "home-card-br" },
] as const;

export default function HomePageClient() {
  const { user } = useAppState();
  const tHero = useTranslations("hero");
  const tBranch = useTranslations("branches");
  const tBenefits = useTranslations("benefits");
  const tMap = useTranslations("map");
  const tPremium = useTranslations("premium");
  const tGuest = useTranslations("guest");

  return (
    <div className="space-y-10">
      {/* ── 1. Hero ── */}
      <section className="home-hero flex flex-col items-center pt-12 pb-4 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          {tHero("tagline")}
        </h1>
        <div className="home-bounce-arrow mt-6 text-zinc-400 dark:text-zinc-500">
          <ChevronDown className="h-6 w-6" />
        </div>
      </section>

      {/* ── 2. Branch Cards (2×2, explosion animation) ── */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {BRANCH_CARDS.map((card) => (
          <ViewTransitionLink
            key={card.href}
            href={card.href}
            className={`${card.anim} branch-card group relative flex min-h-40 items-center gap-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-lg hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600`}
          >
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl"
              style={{ backgroundColor: card.bg }}
            >
              {card.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                {tBranch(card.label)}
              </h3>
              <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                {tBranch(card.desc)}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-zinc-300 transition group-hover:translate-x-1 group-hover:text-zinc-500 dark:text-zinc-600" />
          </ViewTransitionLink>
        ))}
      </section>

      {/* ── 3. Benefits Banner (guest only) ── */}
      {!user && (
        <section className="home-banner space-y-3">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            {tBenefits("label")}
          </p>
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white py-3 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="benefits-track">
              {/* Duplicate pills for seamless loop */}
              {[...BENEFITS_KEYS, ...BENEFITS_KEYS].map((key, i) => (
                <Link
                  key={`${key}-${i}`}
                  href="/about"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-300"
                >
                  {tBenefits(key)}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 4. Auth Buttons (guest only) ── */}
      {!user && (
        <section className="home-auth-buttons flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700"
          >
            {tGuest("bannerCta")}
            <ChevronRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-8 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            {tGuest("haveAccount")}
          </Link>
        </section>
      )}

      {/* ── 5. Map Section ── */}
      <section className="home-map space-y-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            {tMap("title")}
          </h2>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700 dark:bg-green-900/40 dark:text-green-300">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            {tMap("liveBadge")}
          </span>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-1 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <LazyMapPreview />
        </div>
        {!user && (
          <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
            {tMap("guestTooltip")}{" "}
            <Link href="/register" className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
              {tGuest("bannerCta")}
            </Link>
          </p>
        )}
      </section>

      {/* ── 6. Premium Upsell (logged-in only) ── */}
      {user && (
        <Link
          href="/premium"
          className="home-premium flex items-center gap-4 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-5 shadow-sm transition hover:shadow-md dark:border-amber-800 dark:from-amber-900/20 dark:to-orange-900/20"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-xl dark:bg-amber-900/50">
            <Star className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-zinc-900 dark:text-zinc-50">
              {tPremium("title")}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {tPremium("subtitle")}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-amber-500" />
        </Link>
      )}
    </div>
  );
}
