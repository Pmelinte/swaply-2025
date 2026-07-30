"use client";

import { ViewTransitionLink } from "@/components/ViewTransitionLink";
import { Link } from "@/i18n/navigation";
import { useAppState } from "@/lib/state";
import {
  ArrowRight,
  ChevronRight,
  CircleCheck,
  Globe2,
  Handshake,
  ShieldCheck,
  Sparkles,
  Star,
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
  const tHero = useTranslations("hero");
  const tPremium = useTranslations("premium");

  return (
    <div className="space-y-10">
      <section className="flex flex-col items-center pt-12 pb-4 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          {tHero("tagline")}
        </h1>
      </section>
      <Link
        href="/premium"
        className="flex items-center gap-4 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-5 shadow-sm transition hover:shadow-md dark:border-amber-800 dark:from-amber-900/20 dark:to-orange-900/20"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/50">
          <Star className="h-6 w-6 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-zinc-900 dark:text-zinc-50">{tPremium("title")}</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{tPremium("subtitle")}</p>
        </div>
        <ChevronRight className="h-5 w-5 text-amber-500" aria-hidden="true" />
      </Link>
    </div>
  );
}

export default function HomePageClient() {
  const { user } = useAppState();
  return user ? <AuthenticatedHome /> : <GuestHome />;
}
