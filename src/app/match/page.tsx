"use client";

import { useState } from "react";
import { useAppState } from "@/lib/state";
import { MatchList } from "@/features/match/MatchList";
import { LoggedOutGate } from "@/components/gated";
import { CTAButton, Pill, SectionCard, StateShowcase } from "@/components/ui";

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

      <SectionCard title="Pasul următor" description="Inițiază chat sau swap">
        <div className="flex flex-wrap gap-2 text-sm font-semibold">
          <CTAButton href="/chat">Chat cu traducere & moderare</CTAButton>
          <CTAButton href="/change" variant="ghost">Propune schimb</CTAButton>
        </div>
      </SectionCard>

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
