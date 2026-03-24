"use client";

import { useEffect, useState, useMemo } from "react";
import { useAppState } from "@/lib/state";
import { SectionCard } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import {
  Eye,
  Heart,
  ArrowRightLeft,
  TrendingUp,
  Clock,
  BarChart3,
  ArrowLeft,
  Lock,
  CheckCircle2,
  Lightbulb,
  Info,
} from "lucide-react";
import {
  fetchUserAnalytics,
  generateInsights,
  type UserAnalyticsSummary,
  type AnalyticsInsight,
} from "@/lib/item-analytics";
import { NO_IMAGE_URL } from "@/lib/storage";

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{value}</p>
        {sub && <p className="text-xs text-zinc-400 dark:text-zinc-500">{sub}</p>}
      </div>
    </div>
  );
}

function MiniBarChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="flex items-end gap-[2px] h-24">
      {data.map((d) => {
        const h = Math.max((d.count / max) * 100, 2);
        return (
          <div key={d.date} className="group relative flex-1 min-w-0">
            <div
              className="w-full rounded-t bg-blue-500 dark:bg-blue-400 transition-all hover:bg-blue-600 dark:hover:bg-blue-300"
              style={{ height: `${h}%` }}
            />
            <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 whitespace-nowrap rounded bg-zinc-800 px-2 py-1 text-[10px] text-white dark:bg-zinc-200 dark:text-zinc-900">
              {d.date.slice(5)}: {d.count}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InsightCard({ insight }: { insight: AnalyticsInsight }) {
  const iconMap = {
    positive: <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />,
    tip: <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
    info: <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
  };
  const bgMap = {
    positive: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
    tip: "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800",
    info: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",
  };

  return (
    <div className={`flex items-start gap-3 rounded-xl border p-3 ${bgMap[insight.type]}`}>
      <span className="mt-0.5">{iconMap[insight.type]}</span>
      <p className="text-sm text-zinc-700 dark:text-zinc-300">
        {insight.icon} {insight.message}
      </p>
    </div>
  );
}

export default function AnalyticsClient() {
  const { user, items, loading } = useAppState();
  const [summary, setSummary] = useState<UserAnalyticsSummary | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);

  const isPremium = user?.badge === "premium" || user?.badge === "platinum";

  const myItemCount = useMemo(
    () => items.filter((i) => i.ownerId === user?.id).length,
    [items, user?.id],
  );

  useEffect(() => {
    if (!user?.id || !isPremium) {
      setFetchLoading(false);
      return;
    }

    let cancelled = false;
    fetchUserAnalytics(user.id).then((data) => {
      if (!cancelled) {
        setSummary(data);
        setFetchLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [user?.id, isPremium]);

  const insights = useMemo(() => {
    if (!summary) return [];
    return generateInsights(summary, myItemCount);
  }, [summary, myItemCount]);

  if (loading.auth) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-zinc-400 dark:text-zinc-500">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-500 dark:border-zinc-600 dark:border-t-blue-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <SectionCard title="Analytics" description="Trebuie sa fii autentificat pentru a vedea analytics.">
          <Link href="/profile" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
            Mergi la profil
          </Link>
        </SectionCard>
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 space-y-4">
        <Link
          href="/profile"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Inapoi la profil
        </Link>
        <SectionCard
          title="Analytics Dashboard"
          description="Upgrade la Premium pentru a accesa analytics-ul complet"
        >
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30">
              <Lock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Functie Premium
              </h3>
              <p className="mt-1 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
                Vei vedea views, favorite, propuneri, rata de conversie, grafice pe zi si insights automate
                pentru fiecare obiect al tau.
              </p>
            </div>
            <Link
              href="/pricing"
              className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-amber-600 hover:to-orange-600"
            >
              Upgrade la Premium
            </Link>
          </div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              Analytics Dashboard
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Ultima luna &middot; Performanta obiectelor tale
            </p>
          </div>
        </div>
      </div>

      {fetchLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
      ) : !summary ? (
        <SectionCard title="Nicio data" description="Nu avem inca date de analytics. Viziteaza-ti obiectele pentru a incepe tracking-ul.">
          <Link href="/my-objects" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
            Obiectele mele
          </Link>
        </SectionCard>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              icon={<Eye className="h-5 w-5" />}
              label="Views totale"
              value={summary.totalViews.toLocaleString()}
              sub="ultimele 30 zile"
            />
            <StatCard
              icon={<Heart className="h-5 w-5" />}
              label="Favorite primite"
              value={summary.totalFavorites.toLocaleString()}
            />
            <StatCard
              icon={<ArrowRightLeft className="h-5 w-5" />}
              label="Propuneri primite"
              value={summary.totalProposals.toLocaleString()}
            />
            <StatCard
              icon={<TrendingUp className="h-5 w-5" />}
              label="Rata conversie"
              value={`${summary.conversionRate}%`}
              sub="propuneri / views"
            />
            <StatCard
              icon={<CheckCircle2 className="h-5 w-5" />}
              label="Swap-uri completate"
              value={summary.totalCompleted}
            />
            <StatCard
              icon={<Clock className="h-5 w-5" />}
              label="Timp mediu pana la propunere"
              value={`${summary.avgDaysToProposal} zile`}
            />
          </div>

          {/* Views Chart */}
          <SectionCard title="Views pe zi" description="Ultimele 30 de zile">
            <MiniBarChart data={summary.viewsByDay} />
            <div className="mt-2 flex justify-between text-[10px] text-zinc-400 dark:text-zinc-500">
              <span>{summary.viewsByDay[0]?.date.slice(5)}</span>
              <span>{summary.viewsByDay[summary.viewsByDay.length - 1]?.date.slice(5)}</span>
            </div>
          </SectionCard>

          {/* Top Items */}
          {summary.topItems.length > 0 && (
            <SectionCard title="Top obiecte" description="Dupa numarul de views">
              <div className="space-y-3">
                {summary.topItems.map((item, idx) => (
                  <Link
                    key={item.itemId}
                    href={`/objects/${item.itemId}`}
                    className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-3 transition hover:border-blue-200 hover:bg-blue-50/50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-800 dark:hover:bg-blue-900/20"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                      {idx + 1}
                    </span>
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-zinc-200 dark:bg-zinc-700">
                      <Image
                        src={item.photo ?? NO_IMAGE_URL}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {item.title}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {item.views} views &middot; {item.favorites} favorite &middot; {item.proposals} propuneri
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Insights */}
          {insights.length > 0 && (
            <SectionCard title="Insights automate" description="Recomandari bazate pe datele tale">
              <div className="space-y-2">
                {insights.map((insight, idx) => (
                  <InsightCard key={idx} insight={insight} />
                ))}
              </div>
            </SectionCard>
          )}
        </>
      )}
    </div>
  );
}
