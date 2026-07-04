"use client";

import { AdminGuard } from "@/features/admin/AdminShell";
import { MATCHING_ENGINE_FACTORS } from "@/lib/matching-engine";
import { useAppState } from "@/lib/state";

function MatchingEngineContent() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Real matching engine</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Deterministic scoring layer for object-to-object swap recommendations. This is the first production-safe engine layer before AI ranking and persistence.
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">Scoring factors</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {MATCHING_ENGINE_FACTORS.map((factor) => (
            <div key={factor.key} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{factor.label}</p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Key: {factor.key}</p>
                </div>
                <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
                  {Math.round(factor.weight * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">Engine contract</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Input</p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">Active offered items and active candidate items.</p>
          </div>
          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Output</p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">Ranked MatchCandidate list with score, tier, reasons and weighted explanation.</p>
          </div>
          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Persistence</p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">Next step: persist accepted candidates into matches or swaps.</p>
          </div>
          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">AI layer</p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">Next step: add AI reranking and natural language explanation on top of deterministic score.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function AdminMatchingEnginePage() {
  const { user } = useAppState();

  return (
    <AdminGuard user={user}>
      <MatchingEngineContent />
    </AdminGuard>
  );
}
