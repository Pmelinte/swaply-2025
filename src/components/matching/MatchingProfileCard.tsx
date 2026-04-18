"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import Image from "next/image";
import { MatchScoreBadge } from "./MatchScoreBadge";
import { MatchingScoreBreakdown } from "./MatchingScoreBreakdown";
import type { SelectedProfile } from "@/lib/matching/matchingStore";
import type { ScoredItem } from "@/hooks/useMatchingResults";
// useAppState imported for potential future use (conversations, etc.)

interface Props {
  profile: SelectedProfile;
  onRefuse: (userId: string) => void;
  allScoredItems: ScoredItem[];
}

export function MatchingProfileCard({ profile, onRefuse, allScoredItems }: Props) {
  const t = useTranslations("matching");
  const tc = useTranslations("common");
  const router = useRouter();

  const scored = allScoredItems.find((s) => s.item.id === profile.item.id);
  const displayName = profile.profile.displayName || profile.profile.username || profile.userId.slice(0, 8);
  const avatar = profile.profile.avatarUrl;
  const reputation = profile.profile.stats?.reputation ?? "starter";
  const isVerified = profile.profile.phoneVerified || profile.profile.idVerified;
  const completedSwaps = profile.profile.stats?.completedSwaps ?? 0;

  const reputationLabel: Record<string, string> = {
    starter: "⭐ Starter",
    trusted: "⭐⭐ Trusted",
    ambassador: "⭐⭐⭐ Ambassador",
  };

  function handleChat() {
    // Navigate to chat — the conversation will be pre-created with context
    router.push(`/chat`);
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      {/* Profile header */}
      <div className="flex items-start gap-3">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          {avatar ? (
            <Image src={avatar} alt={displayName} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xl">👤</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-zinc-900 dark:text-zinc-50">@{displayName}</p>
            {isVerified && (
              <span className="text-xs text-green-600 dark:text-green-400">✅ {t("verified")}</span>
            )}
            {profile.source === "ai" && (
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                🤖 AI
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400">
            {reputationLabel[reputation] ?? reputation} · {completedSwaps} swaps
          </p>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <MatchScoreBadge score={profile.matchScore} size="md" />
          <p className="text-[10px] text-zinc-400">{t("matchScore")}</p>
        </div>
      </div>

      {/* Their item */}
      <div className="mt-3 rounded-xl bg-zinc-50 p-2 dark:bg-zinc-800">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">{t("theyOffer")}</p>
        <p className="mt-0.5 text-sm font-medium text-zinc-800 dark:text-zinc-100">{profile.item.title}</p>
        <p className="text-[10px] text-zinc-400">{profile.item.category}</p>
      </div>

      {/* Score breakdown */}
      {scored && (
        <div className="mt-2">
          <MatchingScoreBreakdown scored={scored} />
        </div>
      )}

      {/* Actions */}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => onRefuse(profile.userId)}
          className="flex-1 rounded-xl border border-zinc-200 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {t("refuse")}
        </button>
        <button
          type="button"
          onClick={handleChat}
          className="flex-1 rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-700"
        >
          💬 {t("goToChat")}
        </button>
      </div>
    </div>
  );
}
