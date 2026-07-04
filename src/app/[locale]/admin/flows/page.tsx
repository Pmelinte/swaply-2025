"use client";

import { AdminGuard } from "@/features/admin/AdminShell";
import { REAL_USER_FLOWS } from "@/lib/real-user-flows";
import { useAppState } from "@/lib/state";

function FlowStatus({ status }: { status: string }) {
  const tone = status.includes("ready")
    ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
    : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200";

  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${tone}`}>
      {status}
    </span>
  );
}

function FlowsContent() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Real user flows</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Product-level flow map used to turn Swaply from pages into a verified exchange system.
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid gap-3">
          {REAL_USER_FLOWS.map((flow, index) => (
            <div key={flow.key} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold text-blue-600">#{index + 1}</p>
                  <h3 className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">{flow.label}</h3>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{flow.goal}</p>
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">Route: {flow.route}</p>
                </div>
                <FlowStatus status={flow.status} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function AdminFlowsPage() {
  const { user } = useAppState();

  return (
    <AdminGuard user={user}>
      <FlowsContent />
    </AdminGuard>
  );
}
