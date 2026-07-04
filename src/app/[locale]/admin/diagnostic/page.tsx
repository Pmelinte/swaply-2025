"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { useAppState } from "@/lib/state";
import { getSupabaseClient } from "@/lib/supabase/client";
import { AdminGuard } from "@/features/admin/AdminShell";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Database,
  Globe2,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";

type DiagnosticStatus = "ok" | "warn" | "fail";

interface DiagnosticCheck {
  key: string;
  label: string;
  status: DiagnosticStatus;
  detail: string;
}

interface TableCheck {
  table: string;
  status: DiagnosticStatus;
  count: number | null;
  detail: string;
}

interface RouteCheck {
  path: string;
  status: DiagnosticStatus;
  httpStatus: number | null;
  detail: string;
}

interface DiagnosticSnapshot {
  generatedAt: string;
  locale: string;
  origin: string;
  dataSource: string;
  userRole: string;
  checks: DiagnosticCheck[];
  tables: TableCheck[];
  routes: RouteCheck[];
}

const TABLES_TO_CHECK = [
  "profiles",
  "items",
  "swaps",
  "swap_messages",
  "abuse_reports",
  "notifications",
] as const;

const CANONICAL_ROUTES = [
  "/",
  "/objects",
  "/explore",
  "/matching",
  "/messages",
  "/exchange",
  "/chat",
  "/properties",
  "/services",
  "/events",
  "/admin",
] as const;

function shortError(error: unknown): string {
  if (!error) return "No details";
  if (error instanceof Error) return error.message.slice(0, 120);
  if (typeof error === "string") return error.slice(0, 120);
  return "Operation failed";
}

function statusClasses(status: DiagnosticStatus): string {
  if (status === "ok") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200";
  }
  if (status === "warn") {
    return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200";
  }
  return "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200";
}

function StatusIcon({ status }: { status: DiagnosticStatus }) {
  if (status === "ok") return <CheckCircle2 className="h-4 w-4" />;
  if (status === "warn") return <AlertTriangle className="h-4 w-4" />;
  return <XCircle className="h-4 w-4" />;
}

function DiagnosticBadge({ status }: { status: DiagnosticStatus }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold ${statusClasses(status)}`}>
      <StatusIcon status={status} />
      {status.toUpperCase()}
    </span>
  );
}

function Card({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5 text-blue-600" />
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function AdminDiagnosticContent() {
  const locale = useLocale();
  const { user, dataSource, loading, lastError, items, matches, conversations, swaps } = useAppState();
  const [snapshot, setSnapshot] = useState<DiagnosticSnapshot | null>(null);
  const [running, setRunning] = useState(false);

  const publicEnv = useMemo(
    () => ({
      supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      supabaseAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      appUrl: Boolean(process.env.NEXT_PUBLIC_APP_URL),
    }),
    [],
  );

  const runDiagnostic = useCallback(async () => {
    setRunning(true);
    const origin = typeof window !== "undefined" ? window.location.origin : "unknown";
    const supabase = getSupabaseClient();

    const checks: DiagnosticCheck[] = [
      {
        key: "admin_guard",
        label: "Admin access",
        status: user?.role === "admin" || user?.role === "moderator" ? "ok" : "fail",
        detail: user ? `role=${user.role ?? "unknown"}` : "No user in app state",
      },
      {
        key: "app_state",
        label: "App state loading",
        status: loading.auth || loading.profile || loading.items ? "warn" : "ok",
        detail: `auth=${loading.auth}; profile=${loading.profile}; items=${loading.items}; lastError=${lastError ? "present" : "none"}`,
      },
      {
        key: "supabase_client",
        label: "Supabase client",
        status: supabase ? "ok" : "fail",
        detail: supabase ? "Browser client available" : "Browser client unavailable",
      },
      {
        key: "public_env",
        label: "Public env presence",
        status: publicEnv.supabaseUrl && publicEnv.supabaseAnonKey ? "ok" : "fail",
        detail: `supabaseUrl=${publicEnv.supabaseUrl}; anonKey=${publicEnv.supabaseAnonKey}; appUrl=${publicEnv.appUrl}`,
      },
      {
        key: "client_counts",
        label: "Client state counts",
        status: "ok",
        detail: `items=${items.length}; matches=${matches.length}; conversations=${conversations.length}; swaps=${swaps.length}`,
      },
    ];

    const tables: TableCheck[] = [];
    if (supabase) {
      for (const table of TABLES_TO_CHECK) {
        try {
          const { count, error } = await supabase
            .from(table)
            .select("id", { count: "exact", head: true });

          tables.push({
            table,
            status: error ? "fail" : "ok",
            count: count ?? null,
            detail: error ? shortError(error.message) : "Readable with current policies",
          });
        } catch (error) {
          tables.push({
            table,
            status: "fail",
            count: null,
            detail: shortError(error),
          });
        }
      }
    } else {
      for (const table of TABLES_TO_CHECK) {
        tables.push({
          table,
          status: "fail",
          count: null,
          detail: "Supabase client unavailable",
        });
      }
    }

    const routes: RouteCheck[] = [];
    for (const path of CANONICAL_ROUTES) {
      const localizedPath = `/${locale}${path === "/" ? "" : path}`;
      try {
        const response = await fetch(localizedPath, {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });
        routes.push({
          path: localizedPath,
          httpStatus: response.status,
          status: response.ok || response.status === 401 || response.status === 403 ? "ok" : "fail",
          detail: response.ok ? "Route responded" : `HTTP ${response.status}`,
        });
      } catch (error) {
        routes.push({
          path: localizedPath,
          httpStatus: null,
          status: "fail",
          detail: shortError(error),
        });
      }
    }

    setSnapshot({
      generatedAt: new Date().toISOString(),
      locale,
      origin,
      dataSource,
      userRole: user?.role ?? "anonymous",
      checks,
      tables,
      routes,
    });
    setRunning(false);
  }, [conversations.length, dataSource, items.length, lastError, loading.auth, loading.items, loading.profile, locale, matches.length, publicEnv.appUrl, publicEnv.supabaseAnonKey, publicEnv.supabaseUrl, swaps.length, user]);

  useEffect(() => {
    const timer = setTimeout(() => runDiagnostic(), 0);
    return () => clearTimeout(timer);
  }, [runDiagnostic]);

  const summaryStatus: DiagnosticStatus = useMemo(() => {
    if (!snapshot) return "warn";
    const allStatuses = [
      ...snapshot.checks.map((item) => item.status),
      ...snapshot.tables.map((item) => item.status),
      ...snapshot.routes.map((item) => item.status),
    ];
    if (allStatuses.includes("fail")) return "fail";
    if (allStatuses.includes("warn")) return "warn";
    return "ok";
  }, [snapshot]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            <Activity className="h-5 w-5 text-blue-600" />
            Swaply diagnostic
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Safe production diagnostics for auth, routes, Supabase access and app state. No private records are displayed.
          </p>
        </div>
        <button
          type="button"
          onClick={runDiagnostic}
          disabled={running}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${running ? "animate-spin" : ""}`} />
          {running ? "Running..." : "Run diagnostic"}
        </button>
      </div>

      <Card title="System summary" icon={ShieldCheck}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
            <p className="text-xs text-zinc-500">Overall status</p>
            <div className="mt-2"><DiagnosticBadge status={summaryStatus} /></div>
          </div>
          <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
            <p className="text-xs text-zinc-500">Generated at</p>
            <p className="mt-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">{snapshot?.generatedAt ?? "Pending"}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
            <p className="text-xs text-zinc-500">Origin</p>
            <p className="mt-2 break-all text-sm font-medium text-zinc-900 dark:text-zinc-50">{snapshot?.origin ?? "Pending"}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
            <p className="text-xs text-zinc-500">Role / source</p>
            <p className="mt-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">{snapshot?.userRole ?? "Pending"} / {snapshot?.dataSource ?? dataSource}</p>
          </div>
        </div>
      </Card>

      <Card title="Core checks" icon={Activity}>
        <div className="space-y-2">
          {(snapshot?.checks ?? []).map((check) => (
            <div key={check.key} className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{check.label}</p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{check.detail}</p>
                </div>
                <DiagnosticBadge status={check.status} />
              </div>
            </div>
          ))}
          {!snapshot && <p className="text-sm text-zinc-500">Diagnostic pending...</p>}
        </div>
      </Card>

      <Card title="Supabase tables" icon={Database}>
        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-800/60">
              <tr>
                <th className="px-3 py-2">Table</th>
                <th className="px-3 py-2">Count</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {(snapshot?.tables ?? []).map((table) => (
                <tr key={table.table}>
                  <td className="px-3 py-2 font-medium text-zinc-900 dark:text-zinc-50">{table.table}</td>
                  <td className="px-3 py-2 text-zinc-600 dark:text-zinc-300">{table.count ?? "n/a"}</td>
                  <td className="px-3 py-2"><DiagnosticBadge status={table.status} /></td>
                  <td className="px-3 py-2 text-xs text-zinc-500 dark:text-zinc-400">{table.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Canonical routes" icon={Globe2}>
        <div className="grid gap-2 sm:grid-cols-2">
          {(snapshot?.routes ?? []).map((route) => (
            <div key={route.path} className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{route.path}</p>
                  <p className="text-xs text-zinc-500">HTTP {route.httpStatus ?? "n/a"} · {route.detail}</p>
                </div>
                <DiagnosticBadge status={route.status} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default function AdminDiagnosticPage() {
  const { user } = useAppState();

  return (
    <AdminGuard user={user}>
      <AdminDiagnosticContent />
    </AdminGuard>
  );
}
