"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useAppState } from "@/lib/state";
import { getSupabaseClient } from "@/lib/supabase/client";
import { AdminGuard, StatCard } from "@/features/admin/AdminShell";
import { ProductControl } from "@/features/admin/ProductControl";
import {
  Users,
  Package,
  Repeat2,
  Flag,
  ChevronRight,
  RefreshCw,
  Settings,
} from "lucide-react";

interface OverviewStats {
  totalUsers: number;
  activeItems: number;
  activeSwaps: number;
  openReports: number;
}

function AdminOverview() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProductControl, setShowProductControl] = useState(false);

  const fetchStats = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    setLoading(true);

    const [usersRes, itemsRes, swapsRes, reportsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("account_status", "active"),
      supabase
        .from("items")
        .select("id", { count: "exact", head: true })
        .eq("status", "active")
        .eq("is_active", true),
      supabase
        .from("swaps")
        .select("id", { count: "exact", head: true })
        .in("status", ["pending", "accepted"]),
      supabase
        .from("abuse_reports")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);

    setStats({
      totalUsers: usersRes.count ?? 0,
      activeItems: itemsRes.count ?? 0,
      activeSwaps: swapsRes.count ?? 0,
      openReports: reportsRes.count ?? 0,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchStats(), 0);
    const interval = setInterval(() => fetchStats(), 60_000);
    return () => {
      clearTimeout(t);
      clearInterval(interval);
    };
  }, [fetchStats]);

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Statistici platformă
        </h2>
        <button
          type="button"
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
          />
          Actualizează
        </button>
      </div>

      {stats ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Utilizatori activi"
            value={stats.totalUsers}
            icon={Users}
            color="bg-blue-500"
          />
          <StatCard
            label="Obiecte active"
            value={stats.activeItems}
            icon={Package}
            color="bg-emerald-500"
          />
          <StatCard
            label="Swap-uri în curs"
            value={stats.activeSwaps}
            icon={Repeat2}
            color="bg-violet-500"
          />
          <Link href="/admin/reports">
            <StatCard
              label="Rapoarte deschise"
              value={stats.openReports}
              icon={Flag}
              color={
                stats.openReports > 0 ? "bg-red-500" : "bg-zinc-400"
              }
            />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800"
            />
          ))}
        </div>
      )}

      {/* Quick links */}
      <div className="grid gap-2 sm:grid-cols-3">
        {[
          {
            href: "/admin/reports",
            label: "Rapoarte deschise",
            desc: "Gestionează rapoartele de abuz",
          },
          {
            href: "/admin/users",
            label: "Utilizatori",
            desc: "Caută, suspendă, modifică badge",
          },
          {
            href: "/admin/items",
            label: "Obiecte",
            desc: "Activare, dezactivare, demo",
          },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-blue-300 hover:bg-blue-50/50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-800 dark:hover:bg-blue-950/20"
          >
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {item.label}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {item.desc}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-zinc-300 transition-transform group-hover:translate-x-0.5 dark:text-zinc-600" />
          </Link>
        ))}
      </div>

      {/* Product Control toggle */}
      <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setShowProductControl((p) => !p)}
          className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <Settings className="h-4 w-4" />
          {showProductControl
            ? "Ascunde Product Control"
            : "Afișează Product Control"}
        </button>
        {showProductControl && (
          <div className="mt-4">
            <ProductControl />
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user } = useAppState();

  return (
    <AdminGuard user={user}>
      <AdminOverview />
    </AdminGuard>
  );
}
