"use client";

import { AdminGuard } from "@/features/admin/AdminShell";
import { useAppState } from "@/lib/state";
import {
  CANONICAL_DYNAMIC_ROUTES,
  CANONICAL_MODELS,
  CANONICAL_ROUTES,
  LEGACY_ROUTE_ALIASES,
} from "@/lib/canonical";

function CanonicalContent() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Swaply canonical core</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Routes, aliases, models and dynamic route patterns used as the project map.
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">Canonical routes</h3>
        <div className="grid gap-2 md:grid-cols-2">
          {CANONICAL_ROUTES.map((route) => (
            <div key={route.key} className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{route.label}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{route.path} · {route.area}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">Legacy aliases</h3>
        <div className="grid gap-2 md:grid-cols-3">
          {LEGACY_ROUTE_ALIASES.map((alias) => (
            <div key={alias.legacy} className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
              {alias.legacy} → {alias.canonical}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">Canonical models</h3>
        <div className="grid gap-2 md:grid-cols-2">
          {CANONICAL_MODELS.map((model) => (
            <div key={model.key} className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{model.title}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{model.source}</p>
              <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{model.rule}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">Dynamic route patterns</h3>
        <div className="grid gap-2 md:grid-cols-2">
          {CANONICAL_DYNAMIC_ROUTES.map((route) => (
            <div key={route.key} className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{route.key}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{route.pattern}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function AdminCanonicalPage() {
  const { user } = useAppState();

  return (
    <AdminGuard user={user}>
      <CanonicalContent />
    </AdminGuard>
  );
}
