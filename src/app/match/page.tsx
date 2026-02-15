"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { MatchList } from "@/features/match/MatchList";
import { LoggedOutGate } from "@/components/gated";
import { CTAButton, NextStepRecommendation, Pill, SectionCard, StateShowcase } from "@/components/ui";

export default function MatchPage() {
  const router = useRouter();
  const { user, matches, featureToggles, proposeSwap } = useAppState();
  const [manualMode, setManualMode] = useState(false);
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
        <MatchList
          matches={manualMode ? matches.slice(0, 1) : matches}
          onProposeSwap={(match) => {
            void handleProposeSwap(match.id);
          }}
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
