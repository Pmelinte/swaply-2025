"use client";

import type { ComponentType, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { useAppState } from "@/lib/state";
import { getSupabaseClient } from "@/lib/supabase/client";
import { AdminGuard } from "@/features/admin/AdminShell";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Database,
  Globe2,
  HardDrive,
  Languages,
  RefreshCw,
  Route,
  ShieldCheck,
  XCircle,
} from "lucide-react";

type DiagnosticStatus = "ok" | "warn" | "fail";

type DiagnosticCategory =
  | "auth"
  | "app"
  | "database"
  | "routes"
  | "storage"
  | "i18n"
  | "build"
  | "runtime";

interface DiagnosticCheck {
  key: string;
  category: DiagnosticCategory;
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

interface RuntimeEvent {
  id: string;
  timestamp: string;
  source: string;
  detail: string;
}

interface DiagnosticSnapshot {
  generatedAt: string;
  locale: string;
  origin: string;
  dataSource: string;
  userRole: string;
  healthScore: number;
  checks: DiagnosticCheck[];
  tables: TableCheck[];
  routes: RouteCheck[];
  runtimeEvents: RuntimeEvent[];
}

const TABLES_TO_CHECK = [
  "profiles",
  "items",
  "swaps",
  "swap_messages",
  "abuse_reports",
  "notifications",
  "item_images",
  "reviews",
  "wishlist",
  "payments",
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
  "/blog",
  "/about",
  "/contact",
  "/admin",
  "/admin/diagnostic",
] as const;

const DYNAMIC_ROUTE_PATTERNS = [
  "/objects/[id]",
  "/profile/[id]",
  "/chat/[id]",
  "/exchange/[id]",
] as const;

const SUPPORTED_LOCALES = ["en", "ro", "fr", "es", "de"] as const;

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

function computeHealthScore(statuses: DiagnosticStatus[]): number {
  if (statuses.length === 0) return 0;
  const points = statuses.reduce((total, status) => {
    if (status === "ok") return total + 1;
    if (status === "warn") return total + 0.5;
    return total;
  }, 0);
  return Math.round((points / statuses.length) * 100);
}

function statusFromScore(score: number): DiagnosticStatus {
  if (score >= 85) return "ok";
  if (score >= 60) return "warn";
  return "fail";
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
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
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

function MetricCard({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-2 break-all text-sm font-semibold text-zinc-900 dark:text-zinc-50">{value}</p>
      {detail ? <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{detail}</p> : null}
    </div>
  );
}

function AdminDiagnosticContent() {
  const locale = useLocale();
  const { user, dataSource, loading, lastError, items, matches, conversations, swaps } = useAppState();
  const [snapshot, setSnapshot] = useState<DiagnosticSnapshot | null>(null);
  const [running, setRunning] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [runtimeEvents, setRuntimeEvents] = useState<RuntimeEvent[]>([]);

  const publicEnv = useMemo(
    () => ({
      supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      supabaseAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      appUrl: Boolean(process.env.NEXT_PUBLIC_APP_URL),
      cloudinaryCloud: Boolean(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME),
      vercelEnv: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
      gitSha: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ?? "unknown",
      gitBranch: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF ?? "unknown",
    }),
    [],
  );

  useEffect(() => {
    const pushEvent = (source: string, detail: string) => {
      setRuntimeEvents((prev) => [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          timestamp: new Date().toISOString(),
          source,
          detail: detail.slice(0, 180),
        },
        ...prev,
      ].slice(0, 20));
    };

    const onError = (event: ErrorEvent) => pushEvent("window.error", event.message || "Unknown error");
    const onRejection = (event: PromiseRejectionEvent) => pushEvent("promise.rejection", shortError(event.reason));

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  const runDiagnostic = useCallback(async () => {
    setRunning(true);
    const origin = typeof window !== "undefined" ? window.location.origin : "unknown";
    const supabase = getSupabaseClient();

    const checks: DiagnosticCheck[] = [
      {
        key: "admin_guard",
        category: "auth",
        label: "Admin access",
        status: user?.role === "admin" || user?.role === "moderator" ? "ok" : "fail",
        detail: user ? `role=${user.role ?? "unknown"}` : "No user in app state",
      },
      {
        key: "app_state_loading",
        category: "app",
        label: "App state loading",
        status: loading.auth || loading.profile || loading.items ? "warn" : "ok",
        detail: `auth=${loading.auth}; profile=${loading.profile}; items=${loading.items}; lastError=${lastError ? "present" : "none"}`,
      },
      {
        key: "client_counts",
        category: "app",
        label: "Client state counts",
        status: "ok",
        detail: `items=${items.length}; matches=${matches.length}; conversations=${conversations.length}; swaps=${swaps.length}`,
      },
      {
        key: "supabase_client",
        category: "database",
        label: "Supabase client",
        status: supabase ? "ok" : "fail",
        detail: supabase ? "Browser client available" : "Browser client unavailable",
      },
      {
        key: "public_env",
        category: "build",
        label: "Public env presence",
        status: publicEnv.supabaseUrl && publicEnv.supabaseAnonKey ? "ok" : "fail",
        detail: `supabaseUrl=${publicEnv.supabaseUrl}; anonKey=${publicEnv.supabaseAnonKey}; appUrl=${publicEnv.appUrl}`,
      },
      {
        key: "build_identity",
        category: "build",
        label: "Build identity",
        status: publicEnv.gitSha !== "unknown" || publicEnv.gitBranch !== "unknown" ? "ok" : "warn",
        detail: `env=${publicEnv.vercelEnv}; branch=${publicEnv.gitBranch}; sha=${publicEnv.gitSha.slice(0, 12)}`,
      },
      {
        key: "storage_env",
        category: "storage",
        label: "Image storage env",
        status: publicEnv.cloudinaryCloud ? "ok" : "warn",
        detail: `cloudinaryCloudName=${publicEnv.cloudinaryCloud ? "present" : "missing"}; fallback images remain required`,
      },
      {
        key: "i18n_locale",
        category: "i18n",
        label: "Locale health",
        status: SUPPORTED_LOCALES.includes(locale as (typeof SUPPORTED_LOCALES)[number]) ? "ok" : "warn",
        detail: `current=${locale}; expected=${SUPPORTED_LOCALES.join(", ")}`,
      },
      {
        key: "runtime_events",
        category: "runtime",
        label: "Runtime events",
        status: runtimeEvents.length === 0 ? "ok" : runtimeEvents.length <= 3 ? "warn" : "fail",
        detail: `${runtimeEvents.length} local browser event(s) captured on this page`,
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

    for (const pattern of DYNAMIC_ROUTE_PATTERNS) {
      routes.push({
        path: pattern,
        httpStatus: null,
        status: "warn",
        detail: "Pattern registered; needs seeded id for live route test",
      });
    }

    const statuses = [
      ...checks.map((item) => item.status),
      ...tables.map((item) => item.status),
      ...routes.map((item) => item.status),
    ];

    setSnapshot({
      generatedAt: new Date().toISOString(),
      locale,
      origin,
      dataSource,
      userRole: user?.role ?? "anonymous",
      healthScore: computeHealthScore(statuses),
      checks,
      tables,
      routes,
      runtimeEvents,
    });
    setRunning(false);
  }, [conversations.length, dataSource, items.length, lastError, loading.auth, loading.items, loading.profile, locale, matches.length, publicEnv, runtimeEvents, swaps.length, user]);

  useEffect(() => {
    const timer = setTimeout(() => runDiagnostic(), 0);
    return () => clearTimeout(timer);
  }, [runDiagnostic]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => runDiagnostic(), 30_000);
    return () => clearInterval(interval);
  }, [autoRefresh, runDiagnostic]);

  const summaryStatus = snapshot ? statusFromScore(snapshot.healthScore) : "warn";
  const groupedChecks = useMemo(() => {
    const groups: Record<DiagnosticCategory, DiagnosticCheck[]> = {
      auth: [],
      app: [],
      database: [],
      routes: [],
      storage: [],
      i18n: [],
      build: [],
      runtime: [],
    };
    for (const check of snapshot?.checks ?? []) groups[check.category].push(check);
    return groups;
  }, [snapshot]);

  const timeline = useMemo(() => {
    const rows = [
      snapshot ? { timestamp: snapshot.generatedAt, source: "diagnostic", detail: `Health ${snapshot.healthScore}%` } : null,
      ...runtimeEvents.map((event) => ({ timestamp: event.timestamp, source: event.source, detail: event.detail })),
    ].filter(Boolean) as Array<{ timestamp: string; source: string; detail: string }>;
    return rows.slice(0, 20);
  }, [runtimeEvents, snapshot]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            <Activity className="h-5 w-5 text-blue-600" />
            Swaply diagnostic v2
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Safe production diagnostics for auth, build, routes, storage, i18n, Supabase and runtime events. No private records are displayed.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAutoRefresh((value) => !value)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <Clock3 className="h-4 w-4" />
            Auto-refresh {autoRefresh ? "on" : "off"}
          </button>
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
      </div>

      <Card title="System summary" icon={ShieldCheck}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard label="Health score" value={`${snapshot?.healthScore ?? 0}%`} detail={summaryStatus.toUpperCase()} />
          <MetricCard label="Generated at" value={snapshot?.generatedAt ?? "Pending"} />
          <MetricCard label="Origin" value={snapshot?.origin ?? "Pending"} />
          <MetricCard label="Role / source" value={`${snapshot?.userRole ?? "Pending"} / ${snapshot?.dataSource ?? dataSource}`} />
          <MetricCard label="Build" value={publicEnv.gitSha.slice(0, 12)} detail={`${publicEnv.vercelEnv} · ${publicEnv.gitBranch}`} />
        </div>
      </Card>

      <Card title="Diagnostic groups" icon={Activity}>
        <div className="grid gap-2 md:grid-cols-2">
          {Object.entries(groupedChecks).map(([group, checks]) => (
            <div key={group} className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
              <p className="mb-2 text-sm font-semibold capitalize text-zinc-900 dark:text-zinc-50">{group}</p>
              <div className="space-y-2">
                {checks.length === 0 ? (
                  <p className="text-xs text-zinc-500">No checks in this group yet.</p>
                ) : (
                  checks.map((check) => (
                    <div key={check.key} className="flex items-start justify-between gap-3 rounded-lg bg-zinc-50 p-2 dark:bg-zinc-800/60">
                      <div>
                        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">{check.label}</p>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{check.detail}</p>
                      </div>
                      <DiagnosticBadge status={check.status} />
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
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

      <Card title="Canonical and dynamic routes" icon={Globe2}>
        <div className="grid gap-2 sm:grid-cols-2">
          {(snapshot?.routes ?? []).map((route) => (
            <div key={route.path} className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    <Route className="h-3.5 w-3.5 text-zinc-400" />
                    {route.path}
                  </p>
                  <p className="text-xs text-zinc-500">HTTP {route.httpStatus ?? "n/a"} · {route.detail}</p>
                </div>
                <DiagnosticBadge status={route.status} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Storage and i18n hints" icon={HardDrive}>
          <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
            <p><strong>Cloudinary public flag:</strong> {publicEnv.cloudinaryCloud ? "present" : "missing"}</p>
            <p><strong>Fallback expectation:</strong> object cards should render safely even when images are missing.</p>
            <p className="flex items-center gap-2"><Languages className="h-4 w-4" /> Current locale: {locale}; checked set: {SUPPORTED_LOCALES.join(", ")}</p>
          </div>
        </Card>

        <Card title="Event timeline" icon={Clock3}>
          <div className="max-h-72 space-y-2 overflow-auto">
            {timeline.length === 0 ? (
              <p className="text-sm text-zinc-500">No events captured yet.</p>
            ) : (
              timeline.map((event, index) => (
                <div key={`${event.timestamp}-${index}`} className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                  <p className="text-xs text-zinc-500">{event.timestamp}</p>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{event.source}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{event.detail}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
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
