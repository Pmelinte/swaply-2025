"use client";

import { AdminGuard } from "@/features/admin/AdminShell";
import { LIVE_DATA_REALITY } from "@/lib/live-data-reality";
import { useAppState } from "@/lib/state";

function StatusBadge({ hasData }: { hasData: boolean }) {
  const tone = hasData
    ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
    : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200";

  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${tone}`}>
      {hasData ? "live-data" : "empty-or-mock"}
    </span>
  );
}

function LiveDataContent() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Live data reality</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Database reality map showing which product layers already contain live data.
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid gap-3">
          {LIVE_DATA_REALITY.map((entry) => (
            <div key={entry.key} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{entry.label}</h3>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Table: {entry.table}</p>
                  <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{entry.notes}</p>
                </div>
                <StatusBadge hasData={entry.hasData} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function AdminLiveDataPage() {
  const { user } = useAppState();

  return (
    <AdminGuard user={user}>
      <LiveDataContent />
    </AdminGuard>
  );
}
