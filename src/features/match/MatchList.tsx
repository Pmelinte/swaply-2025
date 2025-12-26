import { formatScore } from "@/lib/utils";
import { MatchCandidate } from "@/lib/types";
import { Pill } from "@/components/ui";

export function MatchList({ matches }: { matches: MatchCandidate[] }) {
  if (!matches.length) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white/90 p-4 text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300">
        Nicio recomandare momentan. Activează modul manual pentru a explora obiecte noi.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {matches.map((match) => (
        <div
          key={match.id}
          className="rounded-2xl border border-zinc-200 bg-white/90 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase text-zinc-500">Propunere swap</p>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                {match.itemOffered.title} ↔ {match.itemRequested.title}
              </h3>
            </div>
            <Pill color="blue">Compatibilitate {formatScore(match.compatibilityScore)}</Pill>
          </div>
          <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{match.reason}</p>
          {match.aiTrace ? (
            <p className="text-xs text-blue-700 dark:text-blue-200">
              AI trace: {match.aiTrace}
            </p>
          ) : null}
          {match.manualFallbackReason ? (
            <p className="text-xs text-amber-700 dark:text-amber-200">
              Fallback manual: {match.manualFallbackReason}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
            <button className="rounded-full bg-blue-600 px-3 py-1 text-white hover:bg-blue-700">
              Vezi detalii match
            </button>
            <button className="rounded-full bg-zinc-900 px-3 py-1 text-white hover:bg-zinc-800">
              Inițiază chat
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
