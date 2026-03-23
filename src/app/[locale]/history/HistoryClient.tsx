"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import {
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  XCircle,
  Star,
  Trophy,
  Filter,
  ChevronRight,
  Package,
  Calendar,
} from "lucide-react";

type FilterStatus = "all" | "completed" | "pending" | "cancelled";

export default function HistoryClient() {
  const { user, swaps, items, loading } = useAppState();
  const t = useTranslations("history");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");

  const mySwaps = useMemo(() => {
    if (!user) return [];
    return swaps
      .filter((s) => s.requesterId === user.id || s.responderId === user.id)
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  }, [swaps, user]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return mySwaps;
    if (statusFilter === "completed") return mySwaps.filter((s) => s.status === "completed");
    if (statusFilter === "pending") return mySwaps.filter((s) => s.status === "pending" || s.status === "accepted");
    return mySwaps.filter((s) => s.status === "cancelled" || s.status === "rejected");
  }, [mySwaps, statusFilter]);

  const completedCount = mySwaps.filter((s) => s.status === "completed").length;

  const getItemTitle = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    return item?.title || t("unknownItem");
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case "pending": case "accepted": return <Clock className="h-5 w-5 text-amber-500" />;
      case "cancelled": case "rejected": return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <ArrowRightLeft className="h-5 w-5 text-blue-500" />;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "completed": return "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30";
      case "pending": case "accepted": return "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30";
      case "cancelled": case "rejected": return "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30";
      default: return "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30";
    }
  };

  // Milestones
  const milestones = [
    { count: 1, label: t("milestone1"), achieved: completedCount >= 1 },
    { count: 5, label: t("milestone5"), achieved: completedCount >= 5 },
    { count: 10, label: t("milestone10"), achieved: completedCount >= 10 },
    { count: 25, label: t("milestone25"), achieved: completedCount >= 25 },
    { count: 50, label: t("milestone50"), achieved: completedCount >= 50 },
  ];

  if (loading.auth) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-zinc-400 dark:text-zinc-500">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-500 dark:border-zinc-600 dark:border-t-blue-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <section className="rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{t("title")}</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t("subtitle")}</p>
          <div className="mt-4 text-center">
            <Link href="/register" className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
              {t("startSwapping")}
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{t("title")}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("subtitle")}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{mySwaps.length}</p>
          <p className="text-xs text-zinc-500">{t("totalSwaps")}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/30">
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{completedCount}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">{t("completed")}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm dark:border-amber-800 dark:bg-amber-950/30">
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
            {mySwaps.filter((s) => s.status === "pending" || s.status === "accepted").length}
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400">{t("inProgress")}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-amber-400" />
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {user?.stats.reputation || "starter"}
            </p>
          </div>
          <p className="text-xs text-zinc-500">{t("reputation")}</p>
        </div>
      </div>

      {/* Milestones */}
      <section className="rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mb-3 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{t("milestones")}</h3>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {milestones.map((m) => (
            <div
              key={m.count}
              className={`flex shrink-0 flex-col items-center rounded-xl border px-4 py-3 text-center ${
                m.achieved
                  ? "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/30"
                  : "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800"
              }`}
            >
              <span className={`text-lg font-bold ${m.achieved ? "text-amber-600 dark:text-amber-400" : "text-zinc-300 dark:text-zinc-600"}`}>
                {m.count}
              </span>
              <span className="mt-0.5 text-[10px] text-zinc-500">{m.label}</span>
              {m.achieved && <CheckCircle2 className="mt-1 h-3.5 w-3.5 text-amber-500" />}
            </div>
          ))}
        </div>
      </section>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-zinc-400" />
        {(["all", "completed", "pending", "cancelled"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              statusFilter === f
                ? "bg-blue-600 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300"
            }`}
          >
            {t(`filter_${f}`)}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative space-y-4">
        {/* Vertical line */}
        {filtered.length > 1 && (
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-zinc-200 dark:bg-zinc-700" />
        )}

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 py-12 dark:border-zinc-700">
            <Package className="mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-600" />
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{t("noSwaps")}</p>
            <p className="mt-1 text-xs text-zinc-500">{t("noSwapsDesc")}</p>
            <Link
              href="/objects"
              className="mt-3 inline-flex items-center gap-1 rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
            >
              {t("startSwapping")}
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          filtered.map((swap) => (
            <div key={swap.id} className="relative flex gap-4 pl-3">
              {/* Timeline dot */}
              <div className="relative z-10 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-2 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-700">
                {statusIcon(swap.status)}
              </div>

              {/* Card */}
              <div className={`flex-1 rounded-xl border p-4 ${statusColor(swap.status)}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {getItemTitle(swap.requesterItemId)}
                      </h4>
                      <ArrowRightLeft className="h-3.5 w-3.5 text-zinc-400" />
                      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {getItemTitle(swap.responderItemId)}
                      </h4>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                      <span className="capitalize rounded-full bg-white/60 px-2 py-0.5 font-medium dark:bg-zinc-800/60">
                        {swap.status}
                      </span>
                      {swap.createdAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(swap.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {swap.feedback && (
                      <div className="mt-2 flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < swap.feedback!.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-zinc-300 dark:text-zinc-600"
                            }`}
                          />
                        ))}
                        {swap.feedback.comment && (
                          <span className="ml-2 text-xs text-zinc-500 italic">
                            &ldquo;{swap.feedback.comment}&rdquo;
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <Link
                    href={`/change?swap=${swap.id}`}
                    className="shrink-0 rounded-lg bg-white/80 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-white dark:bg-zinc-800/80 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    {t("viewDetails")}
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
