"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAppState } from "@/lib/state";
import {
  Leaf,
  Recycle,
  TreePine,
  Droplets,
  Zap,
  TrendingUp,
  Award,
  Globe,
  ArrowRightLeft,
} from "lucide-react";

export default function EcoClient() {
  const { user, swaps, items, loading } = useAppState();
  const t = useTranslations("eco");

  const stats = useMemo(() => {
    if (!user) return null;

    const completedSwaps = swaps.filter(
      (s) => s.status === "completed" && (s.requesterId === user.id || s.responderId === user.id)
    ).length;

    // Estimates per swap
    const CO2_PER_SWAP_KG = 2.5; // avg CO2 saved by reusing vs buying new
    const WATER_PER_SWAP_L = 50; // avg water saved
    const WASTE_PER_SWAP_KG = 1.2; // avg waste prevented

    const totalSwaps = Math.max(completedSwaps, user.stats.completedSwaps);

    return {
      totalSwaps,
      co2Saved: (totalSwaps * CO2_PER_SWAP_KG).toFixed(1),
      waterSaved: Math.round(totalSwaps * WATER_PER_SWAP_L),
      wastePrevented: (totalSwaps * WASTE_PER_SWAP_KG).toFixed(1),
      treesEquivalent: (totalSwaps * CO2_PER_SWAP_KG / 21).toFixed(1), // avg tree absorbs 21kg CO2/year
      itemsRescued: items.filter((i) => i.ownerId === user.id && i.status === "traded").length + totalSwaps,
    };
  }, [user, swaps, items]);

  if (loading.auth) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-zinc-400 dark:text-zinc-500">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-500 dark:border-zinc-600 dark:border-t-blue-400" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <section className="rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{t("title")}</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t("subtitle")}</p>
          <div className="mt-4 text-center">
            <Link href="/register" className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700">
              {t("tip1Title")}
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const ecoLevel =
    stats.totalSwaps >= 50
      ? { name: t("levelChampion"), color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30" }
      : stats.totalSwaps >= 20
        ? { name: t("levelAdvocate"), color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30" }
        : stats.totalSwaps >= 5
          ? { name: t("levelContributor"), color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30" }
          : { name: t("levelStarter"), color: "text-zinc-600 dark:text-zinc-400", bg: "bg-zinc-100 dark:bg-zinc-800" };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-6 text-white shadow-xl sm:p-8">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5 blur-xl" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <Leaf className="h-6 w-6" />
            <h1 className="text-2xl font-bold sm:text-3xl">{t("title")}</h1>
          </div>
          <p className="mt-2 max-w-lg text-sm text-emerald-100">{t("subtitle")}</p>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2">
            <Award className="h-4 w-4" />
            <span className="text-sm font-semibold">{ecoLevel.name}</span>
          </div>
        </div>
      </div>

      {/* Main stats grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={<Recycle className="h-6 w-6 text-emerald-500" />}
          value={`${stats.co2Saved} kg`}
          label={t("co2Saved")}
          detail={t("co2Detail")}
          gradient="from-emerald-50 to-white dark:from-emerald-950/20 dark:to-zinc-900"
        />
        <StatCard
          icon={<Droplets className="h-6 w-6 text-blue-500" />}
          value={`${stats.waterSaved} L`}
          label={t("waterSaved")}
          detail={t("waterDetail")}
          gradient="from-blue-50 to-white dark:from-blue-950/20 dark:to-zinc-900"
        />
        <StatCard
          icon={<Zap className="h-6 w-6 text-amber-500" />}
          value={`${stats.wastePrevented} kg`}
          label={t("wastePrevented")}
          detail={t("wasteDetail")}
          gradient="from-amber-50 to-white dark:from-amber-950/20 dark:to-zinc-900"
        />
        <StatCard
          icon={<TreePine className="h-6 w-6 text-green-600" />}
          value={stats.treesEquivalent}
          label={t("treesEquivalent")}
          detail={t("treesDetail")}
          gradient="from-green-50 to-white dark:from-green-950/20 dark:to-zinc-900"
        />
        <StatCard
          icon={<ArrowRightLeft className="h-6 w-6 text-purple-500" />}
          value={String(stats.totalSwaps)}
          label={t("totalSwaps")}
          detail={t("swapsDetail")}
          gradient="from-purple-50 to-white dark:from-purple-950/20 dark:to-zinc-900"
        />
        <StatCard
          icon={<Globe className="h-6 w-6 text-teal-500" />}
          value={String(stats.itemsRescued)}
          label={t("itemsRescued")}
          detail={t("itemsDetail")}
          gradient="from-teal-50 to-white dark:from-teal-950/20 dark:to-zinc-900"
        />
      </div>

      {/* Progress to next level */}
      <section className="rounded-2xl border border-zinc-200 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{t("ecoProgress")}</h3>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${ecoLevel.color} ${ecoLevel.bg}`}>
            {ecoLevel.name}
          </span>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-zinc-500 mb-1">
            <span>{stats.totalSwaps} swaps</span>
            <span>{t("nextLevel")}: {stats.totalSwaps < 5 ? 5 : stats.totalSwaps < 20 ? 20 : 50}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all"
              style={{
                width: `${Math.min(100, (stats.totalSwaps / (stats.totalSwaps < 5 ? 5 : stats.totalSwaps < 20 ? 20 : 50)) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Tips */}
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-900/20">
            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">{t("tip1Title")}</p>
            <p className="mt-0.5 text-[11px] text-emerald-600 dark:text-emerald-400">{t("tip1Desc")}</p>
          </div>
          <div className="rounded-xl bg-blue-50 p-3 dark:bg-blue-900/20">
            <p className="text-xs font-semibold text-blue-800 dark:text-blue-200">{t("tip2Title")}</p>
            <p className="mt-0.5 text-[11px] text-blue-600 dark:text-blue-400">{t("tip2Desc")}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  detail,
  gradient,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  detail: string;
  gradient: string;
}) {
  return (
    <div className={`rounded-2xl border border-zinc-200 bg-gradient-to-br ${gradient} p-5 shadow-sm dark:border-zinc-800`}>
      <div className="mb-3">{icon}</div>
      <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{value}</p>
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{label}</p>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{detail}</p>
    </div>
  );
}
