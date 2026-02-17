"use client";

import Link from "next/link";
import {
  ArrowRightLeft,
  Box,
  MessageCircle,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
  Trophy,
  Zap,
  MapPin,
  ChevronRight,
  Bell,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { MapPreview } from "@/components/MapPreview";

export default function HomePage() {
  const {
    user,
    announcements,
    items,
    matches,
    swaps,
    notifications,
  } = useAppState();
  const t = useTranslations("home");

  const hasLocation = Boolean(user?.location?.city);
  const myItems = items.filter((item) => item.ownerId === user?.id);
  const activeItems = myItems.filter((i) => i.status === "active");
  const unreadNotifs = notifications.filter((n) => !n.read).length;
  const pendingSwaps = swaps.filter(
    (s) => s.status === "proposed" || s.status === "scheduled" || s.status === "in_progress",
  ).length;

  return (
    <div className="space-y-8">
      {/* ── Hero ── */}
      {user ? (
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 text-white shadow-xl sm:p-8">
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5 blur-xl" />
          <div className="relative">
            <p className="text-sm font-medium text-blue-200">
              {t("welcome")}
            </p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
              {t("greeting", { name: user.displayName || user.email.split("@")[0] })}
            </h1>
            <p className="mt-2 max-w-lg text-sm text-blue-100">
              {t("heroSubtitle")}
            </p>

            {/* Quick stats */}
            <div className="mt-5 flex flex-wrap gap-3">
              <StatChip
                icon={<Box className="h-3.5 w-3.5" />}
                label={t("statItems", { count: activeItems.length })}
              />
              <StatChip
                icon={<ArrowRightLeft className="h-3.5 w-3.5" />}
                label={t("statSwaps", { count: user.stats.completedSwaps })}
              />
              <StatChip
                icon={<Zap className="h-3.5 w-3.5" />}
                label={t("statTokens", { count: user.stats.tokens })}
              />
              {unreadNotifs > 0 && (
                <StatChip
                  icon={<Bell className="h-3.5 w-3.5" />}
                  label={t("statNotifs", { count: unreadNotifs })}
                  highlight
                />
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 text-white shadow-xl sm:p-10">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
          <div className="relative max-w-lg">
            <h1 className="text-3xl font-bold sm:text-4xl">
              {t("guestHeadline")}
            </h1>
            <p className="mt-3 text-base text-blue-100">
              {t("guestSubtitle")}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-blue-700 shadow-lg transition hover:bg-blue-50"
              >
                {t("getStarted")}
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                href="/objects"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <Search className="h-4 w-4" />
                {t("browseObjects")}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── How it works (guest) ── */}
      {!user && (
        <section>
          <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-zinc-50">{t("howItWorks")}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { step: "1", icon: <Box className="h-5 w-5" />, title: t("howStep1Title"), desc: t("howStep1Desc"), gradient: "from-emerald-500 to-teal-600" },
              { step: "2", icon: <Sparkles className="h-5 w-5" />, title: t("howStep2Title"), desc: t("howStep2Desc"), gradient: "from-blue-500 to-cyan-600" },
              { step: "3", icon: <MessageCircle className="h-5 w-5" />, title: t("howStep3Title"), desc: t("howStep3Desc"), gradient: "from-violet-500 to-purple-600" },
              { step: "4", icon: <ArrowRightLeft className="h-5 w-5" />, title: t("howStep4Title"), desc: t("howStep4Desc"), gradient: "from-amber-500 to-orange-600" },
            ].map((s) => (
              <div key={s.step} className="rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${s.gradient} text-white shadow-sm`}>
                  {s.icon}
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.title}</h3>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Quick Actions (logged in) ── */}
      {user && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ActionCard
            href="/objects/new"
            icon={<Plus className="h-5 w-5" />}
            title={t("actionAdd")}
            description={t("actionAddDesc")}
            gradient="from-emerald-500 to-teal-600"
          />
          <ActionCard
            href="/objects"
            icon={<Search className="h-5 w-5" />}
            title={t("actionExplore")}
            description={t("actionExploreDesc")}
            gradient="from-blue-500 to-cyan-600"
          />
          <ActionCard
            href="/match"
            icon={<Sparkles className="h-5 w-5" />}
            title={t("actionMatch")}
            description={t("actionMatchDesc")}
            badge={matches.length > 0 ? String(matches.length) : undefined}
            gradient="from-violet-500 to-purple-600"
          />
          <ActionCard
            href="/change"
            icon={<ArrowRightLeft className="h-5 w-5" />}
            title={t("actionSwaps")}
            description={t("actionSwapsDesc")}
            badge={pendingSwaps > 0 ? String(pendingSwaps) : undefined}
            gradient="from-amber-500 to-orange-600"
          />
        </div>
      )}

      {/* ── Map + Sidebar ── */}
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {t("mapTitle")}
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {t("mapSubtitle")}
              </p>
            </div>
            {user?.location?.city && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
                <MapPin className="h-3 w-3" />
                {user.location.city}
              </span>
            )}
          </div>
          <MapPreview />
          {!hasLocation && user && (
            <Link
              href="/profile"
              className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 transition hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-100 dark:hover:bg-amber-900/40"
            >
              <MapPin className="h-4 w-4 shrink-0" />
              <span>{t("addLocationHint")}</span>
              <ChevronRight className="ml-auto h-4 w-4 shrink-0" />
            </Link>
          )}
        </section>

        <div className="space-y-4">
          {/* Announcements */}
          {announcements.length > 0 && (
            <section className="rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
              <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {t("announcements")}
              </h3>
              <div className="space-y-2">
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className={`rounded-xl p-3 text-sm ${
                      ann.priority === "warning"
                        ? "bg-amber-50 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100"
                        : ann.priority === "success"
                          ? "bg-green-50 text-green-900 dark:bg-green-900/40 dark:text-green-100"
                          : "bg-zinc-50 text-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-100"
                    }`}
                  >
                    {ann.message}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Nudges */}
          {user && myItems.length === 0 && (
            <NudgeCard
              icon={<Box className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
              title={t("nudgeNoItems")}
              description={t("nudgeNoItemsDesc")}
              href="/objects/new"
              cta={t("actionAdd")}
            />
          )}

          {user && !user.bio && (
            <NudgeCard
              icon={<TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
              title={t("nudgeProfile")}
              description={t("nudgeProfileDesc")}
              href="/profile"
              cta={t("nudgeProfileCta")}
            />
          )}

          {user && matches.length > 0 && (
            <NudgeCard
              icon={<Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />}
              title={t("nudgeMatches", { count: matches.length })}
              description={t("nudgeMatchesDesc")}
              href="/match"
              cta={t("nudgeMatchesCta")}
            />
          )}

          {/* Reputation card */}
          {user && (
            <section className="rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {t("reputation")}
                </h3>
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">{t("repLevel")}</span>
                  <span className="font-semibold capitalize text-zinc-900 dark:text-zinc-100">
                    {user.stats.reputation}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        user.stats.reputation === "ambassador"
                          ? 100
                          : user.stats.reputation === "trusted"
                            ? 60
                            : 25,
                      )}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {t("repPath")}
                </p>
              </div>
            </section>
          )}

          {/* Guest: info links */}
          {!user && (
            <section className="rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
              <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {t("guestDiscover")}
              </h3>
              <div className="space-y-1">
                <GuestLink href="/objects" label={t("guestObjects")} />
                <GuestLink href="/info" label={t("guestInfo")} />
                <GuestLink href="/info#monetizare" label={t("guestBadges")} />
              </div>
            </section>
          )}
        </div>
      </div>

      {/* ── Active Swaps Banner ── */}
      {user && pendingSwaps > 0 && (
        <Link
          href="/change"
          className="flex items-center justify-between rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm transition hover:shadow-md dark:border-amber-800 dark:from-amber-900/20 dark:to-orange-900/20"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
              <ArrowRightLeft className="h-5 w-5 text-amber-700 dark:text-amber-300" />
            </div>
            <div>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                {t("activeSwaps", { count: pendingSwaps })}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {t("activeSwapsDesc")}
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </Link>
      )}

      {/* ── Messages shortcut ── */}
      {user && (
        <Link
          href="/chat"
          className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm backdrop-blur transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/80"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30">
              <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                {t("messagesLink")}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {t("messagesLinkDesc")}
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-zinc-400" />
        </Link>
      )}
    </div>
  );
}

/* ── Sub-components ── */

function StatChip({
  icon,
  label,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  highlight?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
        highlight
          ? "bg-amber-400/20 text-amber-100"
          : "bg-white/15 text-blue-100"
      }`}
    >
      {icon}
      {label}
    </span>
  );
}

function ActionCard({
  href,
  icon,
  title,
  description,
  badge,
  gradient,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  gradient: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm backdrop-blur transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/80"
    >
      <div className="flex items-start justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-sm`}
        >
          {icon}
        </div>
        {badge && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">
            {badge}
          </span>
        )}
      </div>
      <h3 className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        {title}
      </h3>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        {description}
      </p>
      <ChevronRight className="absolute bottom-4 right-4 h-4 w-4 text-zinc-300 transition group-hover:text-zinc-500 dark:text-zinc-600 dark:group-hover:text-zinc-400" />
    </Link>
  );
}

function NudgeCard({
  icon,
  title,
  description,
  href,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">{icon}</div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {title}
          </h4>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
          <Link
            href={href}
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {cta}
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function GuestLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
    >
      {label}
      <ChevronRight className="h-4 w-4 text-zinc-400" />
    </Link>
  );
}
