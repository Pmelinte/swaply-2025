import {
  calculatePublicTrustProfile,
  type TrustProfileInput,
} from "@/lib/trust/trustProfile";

type Props = {
  profile: TrustProfileInput & {
    full_name?: string | null;
    username?: string | null;
  };
  compact?: boolean;
};

function rankTone(rank: string): string {
  if (rank === "Platinum") return "border-purple-200 bg-purple-50 text-purple-900 dark:border-purple-900 dark:bg-purple-950/30 dark:text-purple-100";
  if (rank === "Gold") return "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100";
  if (rank === "Silver") return "border-zinc-300 bg-zinc-100 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";
  return "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-100";
}

function riskTone(level: string): string {
  if (level === "high") return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300";
  if (level === "medium") return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
  return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";
}

export function TrustProfileCard({ profile, compact = false }: Props) {
  const trust = calculatePublicTrustProfile(profile);
  const displayName = profile.full_name || profile.username || "Swaply user";

  return (
    <section className={`rounded-2xl border p-4 ${rankTone(trust.rank)}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide">Trust profile</p>
          <h3 className="mt-1 text-base font-bold">{displayName}</h3>
        </div>

        <div className="text-right">
          <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold dark:bg-black/20">
            {trust.rank}
          </span>
          <p className="mt-2 text-2xl font-black">{trust.public_score}</p>
        </div>
      </div>

      {!compact && <p className="mt-3 text-sm">{trust.summary}</p>}

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
        <div className="rounded-xl bg-white/60 p-3 dark:bg-black/20">
          <p className="font-semibold">Rating</p>
          <p className="mt-1 text-sm font-bold">{trust.rating || "—"} ★</p>
        </div>
        <div className="rounded-xl bg-white/60 p-3 dark:bg-black/20">
          <p className="font-semibold">Reviews</p>
          <p className="mt-1 text-sm font-bold">{trust.rating_count}</p>
        </div>
        <div className="rounded-xl bg-white/60 p-3 dark:bg-black/20">
          <p className="font-semibold">Completed</p>
          <p className="mt-1 text-sm font-bold">{trust.completed_swaps}</p>
        </div>
        <div className="rounded-xl bg-white/60 p-3 dark:bg-black/20">
          <p className="font-semibold">Completion</p>
          <p className="mt-1 text-sm font-bold">{trust.completion_rate}%</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${riskTone(trust.risk_level)}`}>
          {trust.risk_level} risk
        </span>
        <span className="rounded-full bg-white/60 px-2.5 py-1 text-xs font-semibold dark:bg-black/20">
          Trust score {trust.trust_score}/100
        </span>
      </div>
    </section>
  );
}
