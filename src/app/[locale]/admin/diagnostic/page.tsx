"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Globe2,
  RefreshCw,
  Shield,
  XCircle,
} from "lucide-react";
import { AdminGuard } from "@/features/admin/AdminShell";
import { useAppState } from "@/lib/state";
import { getSupabaseClient } from "@/lib/supabase/client";

type DiagnosticStatus = "ok" | "warn" | "fail" | "info";

type DiagnosticCheck = {
  name: string;
  status: DiagnosticStatus;
  detail: string;
  meta?: string;
};

type TableCheck = DiagnosticCheck & {
  table: string;
  count?: number | null;
};

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
];

const TABLES_TO_CHECK = [
  "profiles",
  "items",
  "swaps",
  "swap_messages",
  "abuse_reports",
  "notifications",
  "payments",
] as const;

function maskError(error: unknown): string {
  if (!error) return "No error";
  if (typeof error === "string") return error.slice(0, 180);
  if (error instanceof Error) return error.message.slice(0, 180);
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message?: unknown }).message ?? "Unknown error").slice(0, 180);
  }
  return "Unknown error";
}

function statusClasses(status: DiagnosticStatus): string {
  switch (status) {
    case "ok":
      return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200";
    case "warn":
      return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200";
    case "fail":
      return "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200";
    default:
      return "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200";
  }
}

function StatusIcon({ status }: { status: DiagnosticStatus }) {
  if (status === "ok") return <CheckCircle2 className="h-4 w-4" />;
  if (status === "warn") return <AlertTriangle className="h-4 w-4" />;
  if (status === "fail") return <XCircle className="h-4 w-4" />;
  return <Activity className="h-4 w-4" />;
}

function DiagnosticCard({ check }: { check: DiagnosticCheck }) {
  return (
    <div className={`rounded-xl border p-4 ${statusClasses(check.status)}`}>
      <div className="flex items-start gap-3">
        <StatusIcon status={check.status} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{check.name}</p>
          <p className="mt-1 text-xs opacity-90">{check.detail}</p>
          {check.meta ? <p className="mt-2 break-all text-[11px] opacity-70">{check.meta}</p> : null}
        </div>
      </div>
    </div>
  );
}

function DiagnosticContent() {
  const app = useAppState();
  const [loading, setLoading] = useState(false);
  const [tableChecks, setTableChecks] = useState<TableCheck[]>([]);
  const [lastRunAt, setLastRunAt] = useState<string | null>(null);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);

  const envChecks = useMemo<DiagnosticCheck[]>(() => {
    const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
    const hasSupabaseAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const hasSiteUrl = Boolean(process.env.NEXT_PUBLIC_SITE_URL);
    const hasCloudName = Boolean(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);

    return [
      {
        name: "Supabase URL",
        status: hasSupabaseUrl ? "ok" : "fail",
        detail: hasSupabaseUrl ? "Public Supabase URL is configured." : "Missing NEXT_PUBLIC_SUPABASE_URL.",
      },
      {
        name: "Supabase anon key",
        status: hasSupabaseAnonKey ? "ok" : "fail",
        detail: hasSupabaseAnonKey ? "Public anon key is present. Value is intentionally hidden." : "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      },
      {
        name: "Site URL",
        status: hasSiteUrl ? "ok" : "warn",
        detail: hasSiteUrl ? "NEXT_PUBLIC_SITE_URL is configured." : "NEXT_PUBLIC_SITE_URL is missing; fallback routing may still work.",
      },
      {
        name: "Cloudinary public config",
        status: hasCloudName ? "ok" : "warn",
        detail: hasCloudName ? "Cloudinary public cloud name is configured." : "Cloudinary public cloud name is missing or not exposed.",
      },
    ];
  }, []);

  const appChecks = useMemo<DiagnosticCheck[]>(() => {
    return [
      {
        name: "Admin access",
        status: app.user?.role === "admin" || app.user?.role === "moderator" ? "ok" : "fail",
        detail: app.user ? `Current role: ${app.user.role ?? "unknown"}` : "No authenticated user in app state.",
      },
      {
        name: "Data source",
        status: app.dataSource === "supabase" ? "ok" : "warn",
        detail: `Current app data source: ${app.dataSource}`,
      },
      {
        name: "Auth loading",
        status: app.loading.auth ? "warn" : "ok",
        detail: app.loading.auth ? "Auth state is still loading." : "Auth state is settled.",
      },
      {
        name: "Profile loading",
        status: app.loading.profile ? "warn" : "ok",
        detail: app.loading.profile ? "Profile state is still loading." : "Profile state is settled.",
      },
      {
        name: "Items loading",
        status: app.loading.items ? "warn" : "ok",
        detail: app.loading.items ? "Items are still loading." : "Items state is settled.",
      },
      {
        name: "Last app error",
        status: app.lastError ? "fail" : "ok",
        detail: app.lastError ? app.lastError.slice(0, 180) : "No app-level error currently reported.",
      },
      {
        name: "Client state counters",
        status: "info",
        detail: "Non-sensitive counts from in-memory app state.",
        meta: `items=${app.items.length}; matches=${app.matches.length}; conversations=${app.conversations.length}; swaps=${app.swaps.length}; notifications=${app.notifications.length}`,
      },
    ];
  }, [app]);

  const routeChecks = useMemo<DiagnosticCheck[]>(() => {
    return CANONICAL_ROUTES.map((route) => ({
      name: route,
      status: "info",
      detail: "Canonical route listed for smoke/audit coverage. Runtime navigation is tested by Playwright.",
    }));
  }, []);

  const runDatabaseChecks = useCallback(async () => {
    setLoading(true);
    setRuntimeError(null);
    setLastRunAt(new Date().toISOString());

    const supabase = getSupabaseClient();
    if (!supabase) {
      setTableChecks([
        {
          table: "supabase-client",
          name: "Supabase client",
          status: "fail",
          detail: "Supabase browser client could not be created. Check public env vars.",
        },
      ]);
      setLoading(false);
      return;
    }

    try {
      const checks = await Promise.all(
        TABLES_TO_CHECK.map(async (table) => {
          const started = performance.now();
          const response = await supabase.from(table).select("id", { count: "exact", head: true });
          const elapsed = Math.round(performance.now() - started);

          if (response.error) {
            return {
              table,
              name: `Table: ${table}`,
              status: "fail" as const,
              detail: maskError(response.error),
              meta: `latency=${elapsed}ms`,
              count: null,
            };
          }

          return {
            table,
            name: `Table: ${table}`,
            status: "ok" as const,
            detail: "Readable with current session and RLS policies.",
            meta: `count=${response.count ?? "unknown"}; latency=${elapsed}ms`,
            count: response.count,
          };
        }),
      );

      setTableChecks(checks);
    } catch (error) {
      setRuntimeError(maskError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void runDatabaseChecks();
  }, [runDatabaseChecks]);

  const overallStatus = useMemo<DiagnosticStatus>(() => {
    const all = [...envChecks, ...appChecks, ...tableChecks];
    if (all.some((check) => check.status === "fail")) return "fail";
    if (all.some((check) => check.status === "warn")) return "warn";
    return "ok";
  }, [appChecks, envChecks, tableChecks]);

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl border p-5 ${statusClasses(overallStatus)}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 h-6 w-6" />
            <div>
              <h2 className="text-lg font-bold">Swaply diagnostic</h2>
              <p className="mt-1 text-sm opacity-90">
                Protected operational view. Secrets, tokens, email addresses, and personal data are intentionally hidden.
              </p>
              {lastRunAt ? <p className="mt-2 text-xs opacity-70">Last run: {lastRunAt}</p> : null}
            </div>
          </div>
          <button
            type="button"
            onClick={runDatabaseChecks}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh checks
          </button>
        </div>
      </div>

      {runtimeError ? (
        <DiagnosticCard
          check={{
            name: "Diagnostic runtime error",
            status: "fail",
            detail: runtimeError,
          }}
        />
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          <Activity className="h-4 w-4" /> App state
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {appChecks.map((check) => <DiagnosticCard key={check.name} check={check} />)}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          <Database className="h-4 w-4" /> Database / RLS checks
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {tableChecks.length === 0 && loading ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
              Running database checks...
            </div>
          ) : (
            tableChecks.map((check) => <DiagnosticCard key={check.table} check={check} />)
          )}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          <Globe2 className="h-4 w-4" /> Public environment
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {envChecks.map((check) => <DiagnosticCard key={check.name} check={check} />)}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          <Clock className="h-4 w-4" /> Canonical route inventory
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {routeChecks.map((check) => <DiagnosticCard key={check.name} check={check} />)}
        </div>
      </section>
    </div>
  );
}

export default function AdminDiagnosticPage() {
  const { user } = useAppState();

  return (
    <AdminGuard user={user}>
      <DiagnosticContent />
    </AdminGuard>
  );
}
