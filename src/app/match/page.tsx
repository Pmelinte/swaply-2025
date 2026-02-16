"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { MatchList } from "@/features/match/MatchList";
import { LoggedOutGate } from "@/components/gated";
import { CTAButton, NextStepRecommendation, Pill, SectionCard, StateShowcase } from "@/components/ui";
import type { MatchTier } from "@/lib/types";

type SortOption = "score" | "category" | "location";

export default function MatchPage() {
  const router = useRouter();
  const { user, matches, featureToggles, proposeSwap } = useAppState();
  const [manualMode, setManualMode] = useState(false);
  const [tierFilter, setTierFilter] = useState<MatchTier | "all">("all");
  const [sortBy, setSortBy] = useState<SortOption>("score");
  const t = useTranslations("match");

  if (!user) {
    return <LoggedOutGate returnTo="/match" />;
  }

  const handleProposeSwap = async (matchId: string) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;
    const swap = await proposeSwap({
      requesterItemId: match.itemOffered.id,
      responderItemId: match.itemRequested.id,
      responderId: match.itemRequested.ownerId,
    });
    router.push(swap ? `/change?swap=${swap.id}` : "/change");
  };

  const handleNegotiate = (matchId: string) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;
    router.push(`/chat?to=${encodeURIComponent(match.itemRequested.ownerId)}`);
  };

  const tierCounts = useMemo(() => {
    const counts = { all: matches.length, weak: 0, possible: 0, good: 0, strong: 0 };
    for (const m of matches) counts[m.tier] = (counts[m.tier] ?? 0) + 1;
    return counts;
  }, [matches]);

  const filteredAndSorted = useMemo(() => {
    let result = tierFilter === "all" ? matches : matches.filter((m) => m.tier === tierFilter);
    if (manualMode) result = result.slice(0, 1);

    if (sortBy === "category") {
      result = [...result].sort((a, b) => a.itemRequested.category.localeCompare(b.itemRequested.category));
    } else if (sortBy === "location") {
      result = [...result].sort((a, b) => (a.itemRequested.location ?? "").localeCompare(b.itemRequested.location ?? ""));
    }
    // default "score" keeps original sort (already sorted by score)
    return result;
  }, [matches, tierFilter, sortBy, manualMode]);

  const TIER_BUTTONS: { key: MatchTier | "all"; color: string }[] = [
    { key: "all", color: "bg-zinc-900 text-white" },
    { key: "strong", color: "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-200" },
    { key: "good", color: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200" },
    { key: "possible", color: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200" },
    { key: "weak", color: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200" },
  ];

  return (
    <div className="space-y-4">
      <SectionCard
        title={t("title")}
        description={t("description")}
        action={
          <button
            type="button"
            onClick={() => setManualMode((v) => !v)}
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            {manualMode ? t("backToAi") : t("enableManual")}
          </button>
        }
      >
        {!featureToggles.aiEnabled ? (
          <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
            {t("aiUnavailable")}
          </div>
        ) : null}

        {/* Filter & Sort controls */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">{t("filterByTier")}:</span>
            {TIER_BUTTONS.map(({ key, color }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTierFilter(key)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  tierFilter === key ? color : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                {key === "all" ? t("allTiers") : t(key === "strong" ? "veryGood" : key)} ({tierCounts[key]})
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">{t("sortBy")}:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800"
            >
              <option value="score">{t("sortScore")}</option>
              <option value="category">{t("sortCategory")}</option>
              <option value="location">{t("sortLocation")}</option>
            </select>
            <span className="text-xs text-zinc-500">
              {filteredAndSorted.length} {t("resultsShown")}
            </span>
          </div>
        </div>

        <MatchList
          matches={filteredAndSorted}
          onAccept={(match) => void handleProposeSwap(match.id)}
          onNegotiate={(match) => handleNegotiate(match.id)}
          onReject={() => {/* rejected matches fade out via MatchList internal state */}}
        />
      </SectionCard>

      <SectionCard title={t("howItWorks")} description={t("cumulativeScore")}>
        <div className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
          <p>{t("cumulativeScoreDescription")}</p>
          <p>{t("noSingleFactor")}</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-lg bg-red-50 p-2 text-center text-xs dark:bg-red-950/30">
              <p className="font-bold text-red-800 dark:text-red-200">0-39</p>
              <p className="text-red-600 dark:text-red-400">{t("weak")}</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-2 text-center text-xs dark:bg-amber-950/30">
              <p className="font-bold text-amber-800 dark:text-amber-200">40-69</p>
              <p className="text-amber-600 dark:text-amber-400">{t("possible")}</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-2 text-center text-xs dark:bg-blue-950/30">
              <p className="font-bold text-blue-800 dark:text-blue-200">70-84</p>
              <p className="text-blue-600 dark:text-blue-400">{t("good")}</p>
            </div>
            <div className="rounded-lg bg-green-50 p-2 text-center text-xs dark:bg-green-950/30">
              <p className="font-bold text-green-800 dark:text-green-200">85-100</p>
              <p className="text-green-600 dark:text-green-400">{t("veryGood")}</p>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title={t("geographicChoices")} description={t("geographicDescription")}>
        <div className="space-y-3">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            {t("matchesPrioritized")}
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-white/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/70">
              <p className="text-xs font-semibold uppercase text-zinc-500">{t("yourArea")}</p>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {user.location?.city ?? t("notSet")}, {user.location?.country ?? "—"}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/70">
              <p className="text-xs font-semibold uppercase text-zinc-500">{t("maxRadius")}</p>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {user.location?.travelRadiusKm ? `${user.location.travelRadiusKm} km` : t("notSet")}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/70">
              <p className="text-xs font-semibold uppercase text-zinc-500">{t("logistics")}</p>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {user.swapPreferences.logistics === "in_person"
                  ? t("inPerson")
                  : user.swapPreferences.logistics === "courier"
                    ? "Curier"
                    : "Flexibil"}
              </p>
            </div>
          </div>
          {!user.location?.city ? (
            <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
              {t("completeLocationNote")}
              <CTAButton href="/profile" variant="ghost">Deschide profil</CTAButton>
            </div>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard title={t("gamification")} description={t("gamificationDescription")}>
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-zinc-200 bg-white/70 p-3 text-center dark:border-zinc-800 dark:bg-zinc-900/70">
              <p className="text-xs font-semibold uppercase text-zinc-500">Reputație</p>
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{user.stats.reputation}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white/70 p-3 text-center dark:border-zinc-800 dark:bg-zinc-900/70">
              <p className="text-xs font-semibold uppercase text-zinc-500">Tokeni</p>
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{user.stats.tokens}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white/70 p-3 text-center dark:border-zinc-800 dark:bg-zinc-900/70">
              <p className="text-xs font-semibold uppercase text-zinc-500">{t("swaps")}</p>
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{user.stats.completedSwaps}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white/70 p-3 text-center dark:border-zinc-800 dark:bg-zinc-900/70">
              <p className="text-xs font-semibold uppercase text-zinc-500">Listări active</p>
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{user.stats.activeListings}</p>
            </div>
          </div>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            {t("gamificationExplanation")}
          </p>
          <div className="flex flex-wrap gap-2">
            <Pill color="green">{t("reputationPath")}</Pill>
            <Pill color="blue">{t("tokensPerSwap")}</Pill>
          </div>
        </div>
      </SectionCard>

      <SectionCard title={t("nextStep")} description={t("nextStepDescription")}>
        <div className="flex flex-wrap gap-2 text-sm font-semibold">
          <CTAButton href="/chat">{t("sendMessage")}</CTAButton>
          <CTAButton href="/change" variant="ghost">{t("proposeExchange")}</CTAButton>
        </div>
      </SectionCard>

      <NextStepRecommendation
        steps={[
          { label: t("sendMessage"), href: "/chat", description: t("sendMessageDescription") },
          { label: t("proposeExchange"), href: "/change", description: t("proposeExchangeDescription") },
          { label: t("addObject"), href: "/objects/new", description: t("addObjectDescription") },
        ]}
      />

      <StateShowcase
        title="Stari MATCHING"
        states={[
          {
            key: "loading",
            title: t("analyzingCompatibility"),
            description: "Scor cumulativ in curs de calcul — AI sau reguli locale.",
          },
          {
            key: "empty",
            title: t("noMatchesNow"),
            description: "Completeaza mai multe detalii pe obiectele tale sau adauga obiecte noi.",
          },
          {
            key: "error",
            title: t("aiUnavailableNote"),
            description: t("analysisContinues"),
          },
        ]}
      />
    </div>
  );
}
