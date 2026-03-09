"use client";

/**
 * ProductControl — Admin dashboard for feature flags, cron jobs, and metrics.
 * Accessible at /admin route (gated by admin role check).
 */

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import {
  ToggleLeft,
  ToggleRight,
  Clock,
  BarChart3,
  Zap,
  Shield,
  Coins,
  Beaker,
  TrendingDown,
  TrendingUp,
  ArrowRight,
  Activity,
  Settings,
} from "lucide-react";

type AdminTab = "flags" | "cron" | "metrics" | "trust";

export function ProductControl() {
  const t = useTranslations("productControl");
  const {
    featureFlags, setFeatureFlag, cronJobs, metricsFunnel, funnelRates,
    trustScore, frictionLimits, items, conversations, swaps, user,
  } = useAppState();

  const [tab, setTab] = useState<AdminTab>("flags");
  const [filter, setFilter] = useState<string>("all");

  const tabs = [
    { id: "flags" as const, label: t("featureFlags"), icon: <Settings className="h-4 w-4" /> },
    { id: "cron" as const, label: t("cronJobs"), icon: <Clock className="h-4 w-4" /> },
    { id: "metrics" as const, label: t("metrics"), icon: <BarChart3 className="h-4 w-4" /> },
    { id: "trust" as const, label: t("trustSafety"), icon: <Shield className="h-4 w-4" /> },
  ];

  const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    core: <Zap className="h-3.5 w-3.5 text-blue-500" />,
    ai: <Activity className="h-3.5 w-3.5 text-purple-500" />,
    social: <Shield className="h-3.5 w-3.5 text-emerald-500" />,
    monetization: <Coins className="h-3.5 w-3.5 text-amber-500" />,
    experimental: <Beaker className="h-3.5 w-3.5 text-rose-500" />,
  };

  const filteredFlags = useMemo(() => {
    if (filter === "all") return featureFlags;
    return featureFlags.filter((f) => f.category === filter);
  }, [featureFlags, filter]);

  const enabledCount = featureFlags.filter((f) => f.enabled).length;
  const totalFlags = featureFlags.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {t("subtitle")}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tabItem) => (
          <button
            key={tabItem.id}
            onClick={() => setTab(tabItem.id)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
              tab === tabItem.id
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {tabItem.icon}
            {tabItem.label}
          </button>
        ))}
      </div>

      {/* ── Feature Flags ── */}
      {tab === "flags" && (
        <div className="space-y-4">
          {/* Summary bar */}
          <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-4 py-2 dark:bg-zinc-800">
            <span className="text-sm">
              <span className="font-bold text-emerald-600">{enabledCount}</span> / {totalFlags} {t("active")}
            </span>
            <div className="flex gap-1">
              {["all", "core", "ai", "social", "monetization", "experimental"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                    filter === cat
                      ? "bg-zinc-900 text-white dark:bg-zinc-200 dark:text-zinc-900"
                      : "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {cat === "all" ? t("all") : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Flags list */}
          <div className="space-y-2">
            {filteredFlags.map((flag) => (
              <div
                key={flag.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
              >
                <div className="flex items-center gap-3">
                  {CATEGORY_ICONS[flag.category]}
                  <div>
                    <div className="text-sm font-semibold">{flag.name}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">{flag.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {flag.rolloutPercent < 100 && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                      {flag.rolloutPercent}%
                    </span>
                  )}
                  <button
                    onClick={() => setFeatureFlag(flag.id, !flag.enabled)}
                    className="transition hover:opacity-80"
                  >
                    {flag.enabled ? (
                      <ToggleRight className="h-7 w-7 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="h-7 w-7 text-zinc-300 dark:text-zinc-600" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Cron Jobs ── */}
      {tab === "cron" && (
        <div className="space-y-4">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {t("cronDescription")}
          </p>
          <div className="space-y-2">
            {cronJobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
              >
                <div className="flex items-center gap-3">
                  <Clock className={`h-4 w-4 ${job.enabled ? "text-blue-500" : "text-zinc-300"}`} />
                  <div>
                    <div className="text-sm font-semibold">{job.name}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">{job.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {job.schedule}
                  </span>
                  <span className={`h-2 w-2 rounded-full ${
                    job.status === "running" ? "bg-blue-500 animate-pulse" :
                    job.status === "error" ? "bg-red-500" : "bg-emerald-500"
                  }`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Metrics Funnel ── */}
      {tab === "metrics" && (
        <div className="space-y-4">
          {/* Funnel visualization */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="mb-4 text-lg font-bold">{t("conversionFunnel")}</h3>
            <div className="space-y-3">
              {[
                { label: t("visitors"), value: metricsFunnel.visitors, rate: 100, color: "bg-zinc-400" },
                { label: t("signups"), value: metricsFunnel.signups, rate: funnelRates.visitToSignup, color: "bg-blue-500" },
                { label: t("listedItems"), value: metricsFunnel.itemsListed, rate: funnelRates.signupToList, color: "bg-purple-500" },
                { label: t("chatStarted"), value: metricsFunnel.chatStarted, rate: funnelRates.listToChat, color: "bg-emerald-500" },
                { label: t("swapProposed"), value: metricsFunnel.swapProposed, rate: funnelRates.chatToPropose, color: "bg-amber-500" },
                { label: t("swapCompleted"), value: metricsFunnel.swapCompleted, rate: funnelRates.proposeToComplete, color: "bg-rose-500" },
              ].map((step, i) => (
                <div key={step.label}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium">{step.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{step.value}</span>
                      {i > 0 && (
                        <span className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${
                          step.rate >= 50 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300" :
                          step.rate >= 20 ? "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300" :
                          "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-300"
                        }`}>
                          {step.rate}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-3 rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className={`h-full rounded-full transition-all ${step.color}`}
                      style={{ width: `${Math.max(2, (step.value / Math.max(1, metricsFunnel.visitors)) * 100)}%` }}
                    />
                  </div>
                  {i < 5 && (
                    <div className="flex justify-center py-1">
                      <ArrowRight className="h-3 w-3 text-zinc-300" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: t("activeItems"), value: items.filter((i) => i.isActive).length, icon: <TrendingUp className="h-4 w-4 text-emerald-500" /> },
              { label: t("conversations"), value: conversations.length, icon: <Activity className="h-4 w-4 text-blue-500" /> },
              { label: t("totalSwaps"), value: swaps.length, icon: <BarChart3 className="h-4 w-4 text-purple-500" /> },
              { label: t("totalConversion"), value: `${funnelRates.overallConversion}%`, icon: funnelRates.overallConversion > 0 ? <TrendingUp className="h-4 w-4 text-emerald-500" /> : <TrendingDown className="h-4 w-4 text-red-500" /> },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              >
                <div className="flex items-center gap-2">
                  {stat.icon}
                  <span className="text-xs text-zinc-500">{stat.label}</span>
                </div>
                <div className="mt-1 text-xl font-bold">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Trust Overview ── */}
      {tab === "trust" && (
        <div className="space-y-4">
          {/* Current user trust */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="mb-3 text-lg font-bold">{t("trustScore")}</h3>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-2xl font-bold dark:bg-zinc-800">
                {trustScore.score}
              </div>
              <div>
                <div className="text-lg font-bold capitalize">{trustScore.level}</div>
                <div className="text-sm text-zinc-500">{t("trustScoreLabel", { score: trustScore.score })}</div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Object.entries(trustScore.breakdown).map(([key, value]) => (
                <div key={key} className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800">
                  <div className="text-xs text-zinc-500 capitalize">{key.replace(/([A-Z])/g, " $1")}</div>
                  <div className="text-lg font-bold">{typeof value === "number" ? Math.round(value) : value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Friction limits */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="mb-3 text-lg font-bold">{t("frictionLimits")}</h3>
            {frictionLimits.autoHold && (
              <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
                {t("accountSuspended", { reason: frictionLimits.holdReason ?? "" })}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <div className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800">
                <div className="text-xs text-zinc-500">{t("messagesPerDay")}</div>
                <div className="text-lg font-bold">{frictionLimits.maxMessagesPerDay}</div>
              </div>
              <div className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800">
                <div className="text-xs text-zinc-500">{t("chatsPerDay")}</div>
                <div className="text-lg font-bold">{frictionLimits.maxChatsPerDay}</div>
              </div>
              <div className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800">
                <div className="text-xs text-zinc-500">{t("proposalsPerDay")}</div>
                <div className="text-lg font-bold">{frictionLimits.maxSwapProposalsPerDay}</div>
              </div>
              <div className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800">
                <div className="text-xs text-zinc-500">{t("links")}</div>
                <div className={`text-lg font-bold ${frictionLimits.canSendLinks ? "text-emerald-600" : "text-red-500"}`}>
                  {frictionLimits.canSendLinks ? t("yes") : t("no")}
                </div>
              </div>
              <div className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800">
                <div className="text-xs text-zinc-500">{t("locationSharing")}</div>
                <div className={`text-lg font-bold ${frictionLimits.canShareLocation ? "text-emerald-600" : "text-red-500"}`}>
                  {frictionLimits.canShareLocation ? t("yes") : t("no")}
                </div>
              </div>
              <div className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800">
                <div className="text-xs text-zinc-500">{t("autoModeration")}</div>
                <div className={`text-lg font-bold ${frictionLimits.requiresModeration ? "text-amber-600" : "text-emerald-600"}`}>
                  {frictionLimits.requiresModeration ? t("yes") : t("no")}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
