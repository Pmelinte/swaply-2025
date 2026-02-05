"use client";

import { useState } from "react";
import { useAppState } from "@/lib/state";
import { MatchList } from "@/features/match/MatchList";
import { LoggedOutGate } from "@/components/gated";
import { CTAButton, NextStepRecommendation, Pill, SectionCard, StateShowcase } from "@/components/ui";

export default function MatchPage() {
  const { user, matches, featureToggles } = useAppState();
  const [manualMode, setManualMode] = useState(false);

  if (!user) {
    return <LoggedOutGate returnTo="/match" />;
  }

  return (
    <div className="space-y-4">
      <SectionCard
        title="Match-uri recomandate"
        description="Recomandări + explicații + modul manual dacă AI e down."
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
        <MatchList matches={manualMode ? matches.slice(0, 1) : matches} />
      </SectionCard>

      <SectionCard title="De ce acest match?" description="Explicații și trasabilitate">
        <div className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
          <p>Explicații scurte: compatibilitate, locație similară, preferințe de schimb aliniate.</p>
          <p>
            Trace AI: provider/model_version/trace_id, fără a expune date private. Manual fallback dacă serviciul nu răspunde.
          </p>
          <Pill color="blue">Explainability</Pill>
          <Pill color="green">RLS aplicat</Pill>
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

      <SectionCard title="Pasul următor" description="Inițiază chat sau swap">
        <div className="flex flex-wrap gap-2 text-sm font-semibold">
          <CTAButton href="/chat">Chat cu traducere & moderare</CTAButton>
          <CTAButton href="/change" variant="ghost">Propune schimb</CTAButton>
        </div>
      </SectionCard>

      <NextStepRecommendation
        steps={[
          { label: "Inițiază un chat", href: "/chat", description: "Discută detalii cu partenerul de schimb" },
          { label: "Propune un swap", href: "/change", description: "Începe procesul de schimb" },
          { label: "Adaugă obiect", href: "/objects/new", description: "Crește-ți șansele de match cu mai multe obiecte" },
        ]}
      />

      <StateShowcase
        title="Stări MATCH"
        states={[
          {
            key: "loading",
            title: "Calcul scor compatibilitate",
            description: "Indicator de încărcare pentru recomputarea match-urilor (AI sau manual).",
          },
          {
            key: "empty",
            title: "Nicio recomandare",
            description: "Empty state deja vizibil în listă + CTA spre mod manual și filtre.",
          },
          {
            key: "error",
            title: "AI down / eroare serviciu",
            description: "Mesaj explicit + fallback manual clar, fără a bloca navigația către /chat sau /objects.",
          },
        ]}
      />
    </div>
  );
}
