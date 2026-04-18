"use client";

import { useTranslations } from "next-intl";
import { MatchingProfileCard } from "./MatchingProfileCard";
import type { SelectedProfile } from "@/lib/matching/matchingStore";
import type { ScoredItem } from "@/hooks/useMatchingResults";

interface Props {
  selectedProfiles: SelectedProfile[];
  allScoredItems: ScoredItem[];
  onRefuse: (userId: string) => void;
}

export function MatchingSelectedProfiles({ selectedProfiles, allScoredItems, onRefuse }: Props) {
  const t = useTranslations("matching");

  return (
    <section className="rounded-2xl border-2 border-blue-300 bg-gradient-to-b from-blue-50 to-white p-4 shadow-sm dark:border-blue-700 dark:from-blue-950/40 dark:to-zinc-900">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
          🤝 {t("selectedTitle")} ({selectedProfiles.length}/2)
        </h2>
      </div>

      {selectedProfiles.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-blue-200 p-6 text-center dark:border-blue-800">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("noSelectedYet")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {selectedProfiles.map((profile) => (
            <MatchingProfileCard
              key={profile.userId}
              profile={profile}
              onRefuse={onRefuse}
              allScoredItems={allScoredItems}
            />
          ))}

          {selectedProfiles.length < 2 && (
            <div className="rounded-2xl border-2 border-dashed border-blue-200 p-4 text-center dark:border-blue-800">
              <p className="text-xs text-zinc-400">{t("oneMoreSlot")}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
