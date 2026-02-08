"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/lib/state";
import { MatchList } from "@/features/match/MatchList";
import { LoggedOutGate } from "@/components/gated";
import { CTAButton, NextStepRecommendation, Pill, SectionCard, StateShowcase } from "@/components/ui";

export default function MatchPage() {
  const router = useRouter();
  const { user, matches, featureToggles, proposeSwap } = useAppState();
  const [manualMode, setManualMode] = useState(false);

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
        title="Analiza potrivirilor"
        description="Propuneri bazate pe compatibilitate cumulativa. AI analizeaza, tu decizi."
        action={
          <button
            type="button"
            onClick={() => setManualMode((v) => !v)}
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            {manualMode ? "Revino la AI" : "Activează modul manual"}
          </button>
        }
      >
        {!featureToggles.aiEnabled ? (
          <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
            AI indisponibil: folosim reguli manuale și filtre pentru a nu bloca fluxul.
          </div>
        ) : null}
        <MatchList
          matches={manualMode ? matches.slice(0, 1) : matches}
          onProposeSwap={(match) => {
            void handleProposeSwap(match.id);
          }}
        />
      </SectionCard>

      <SectionCard title="Cum functioneaza analiza?" description="Scor cumulativ, nu verdict">
        <div className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
          <p>Fiecare potrivire primeste un scor bazat pe mai multi factori: categorie, intentie, flexibilitate, valoare perceputa, locatie, taguri.</p>
          <p>Niciun factor nu decide singur. Factorii se acumuleaza — exact ca un scor de risc: cu cat mai multi factori favorabili, cu atat potrivirea e mai puternica.</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-lg bg-red-50 p-2 text-center text-xs dark:bg-red-950/30">
              <p className="font-bold text-red-800 dark:text-red-200">0-39</p>
              <p className="text-red-600 dark:text-red-400">Slab</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-2 text-center text-xs dark:bg-amber-950/30">
              <p className="font-bold text-amber-800 dark:text-amber-200">40-69</p>
              <p className="text-amber-600 dark:text-amber-400">Posibil</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-2 text-center text-xs dark:bg-blue-950/30">
              <p className="font-bold text-blue-800 dark:text-blue-200">70-84</p>
              <p className="text-blue-600 dark:text-blue-400">Bun</p>
            </div>
            <div className="rounded-lg bg-green-50 p-2 text-center text-xs dark:bg-green-950/30">
              <p className="font-bold text-green-800 dark:text-green-200">85-100</p>
              <p className="text-green-600 dark:text-green-400">Foarte bun</p>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Alegeri geografice" description="Filtrare bazată pe locație și proximitate">
        <div className="space-y-3">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            Match-urile sunt prioritizate în funcție de distanța geografică dintre utilizatori.
            Setează raza de deplasare în profil pentru rezultate mai relevante.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-white/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/70">
              <p className="text-xs font-semibold uppercase text-zinc-500">Zona ta</p>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {user.location?.city ?? "Nesetat"}, {user.location?.country ?? "—"}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/70">
              <p className="text-xs font-semibold uppercase text-zinc-500">Rază maximă</p>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {user.location?.travelRadiusKm ? `${user.location.travelRadiusKm} km` : "Nesetat"}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/70">
              <p className="text-xs font-semibold uppercase text-zinc-500">Logistică</p>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {user.swapPreferences.logistics === "in_person"
                  ? "Întâlnire fizică"
                  : user.swapPreferences.logistics === "courier"
                    ? "Curier"
                    : "Flexibil"}
              </p>
            </div>
          </div>
          {!user.location?.city ? (
            <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
              Completează locația în profil pentru a primi match-uri geografic relevante.
              <CTAButton href="/profile" variant="ghost">Deschide profil</CTAButton>
            </div>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard title="Gamification" description="Reputație, tokeni și progres">
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
              <p className="text-xs font-semibold uppercase text-zinc-500">Swap-uri</p>
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{user.stats.completedSwaps}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white/70 p-3 text-center dark:border-zinc-800 dark:bg-zinc-900/70">
              <p className="text-xs font-semibold uppercase text-zinc-500">Listări active</p>
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{user.stats.activeListings}</p>
            </div>
          </div>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            Fiecare swap finalizat îți crește reputația și îți acordă tokeni. Utilizatorii cu reputație
            înaltă primesc match-uri prioritare și acces la funcții avansate.
          </p>
          <div className="flex flex-wrap gap-2">
            <Pill color="green">Starter → Trusted → Ambassador</Pill>
            <Pill color="blue">Tokeni câștigați per swap</Pill>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Pasul urmator" description="Deschide dialog sau propune schimb">
        <div className="flex flex-wrap gap-2 text-sm font-semibold">
          <CTAButton href="/chat">Trimite mesaj</CTAButton>
          <CTAButton href="/change" variant="ghost">Propune schimb</CTAButton>
        </div>
      </SectionCard>

      <NextStepRecommendation
        steps={[
          { label: "Trimite mesaj", href: "/chat", description: "Discuta detalii cu partenerul de schimb" },
          { label: "Propune schimb", href: "/change", description: "Incepe procesul de schimb" },
          { label: "Adauga obiect", href: "/objects/new", description: "Creste-ti sansele cu mai multe obiecte" },
        ]}
      />

      <StateShowcase
        title="Stari MATCHING"
        states={[
          {
            key: "loading",
            title: "Se analizeaza compatibilitatea",
            description: "Scor cumulativ in curs de calcul — AI sau reguli locale.",
          },
          {
            key: "empty",
            title: "Nicio potrivire momentan",
            description: "Completeaza mai multe detalii pe obiectele tale sau adauga obiecte noi.",
          },
          {
            key: "error",
            title: "AI indisponibil",
            description: "Analiza continua cu reguli locale. Nicio functionalitate blocata.",
          },
        ]}
      />
    </div>
  );
}
