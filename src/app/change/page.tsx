"use client";

import { useState } from "react";
import { useAppState } from "@/lib/state";
import { LoggedOutGate } from "@/components/gated";
import { CTAButton, Pill, SectionCard, StateShowcase } from "@/components/ui";
import { SwapTimeline } from "@/features/change/SwapTimeline";

export default function ChangePage() {
  const { user, swaps, updateSwapStatus, addSwapFeedback } = useAppState();
  const [feedback, setFeedback] = useState({ rating: 5, comment: "" });

  if (!user) {
    return <LoggedOutGate returnTo="/change" />;
  }

  const swap = swaps[0];

  return (
    <div className="space-y-4">
      <SectionCard
        title="Flux schimb (Swaply)"
        description="Confirmare + logistică + hartă (niveluri) + notificări + feedback"
      >
        {swap ? (
          <SwapTimeline swap={swap} />
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Nu există încă swap-uri. Inițiază unul din pagina de match sau chat.
          </p>
        )}
      </SectionCard>

      {swap ? (
        <SectionCard title="Confirmări" description="Actualizează statusul și oferă feedback">
          <div className="flex flex-wrap gap-2 text-sm font-semibold">
            <button
              className="rounded-full bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              onClick={() => updateSwapStatus(swap.id, "in_progress")}
            >
              Marchează în desfășurare
            </button>
            <button
              className="rounded-full bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
              onClick={() => updateSwapStatus(swap.id, "completed")}
            >
              Confirmă finalizarea
            </button>
            <button
              className="rounded-full bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              onClick={() => updateSwapStatus(swap.id, "cancelled")}
            >
              Anulează swap
            </button>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
              Rating
              <input
                type="number"
                value={feedback.rating}
                min={1}
                max={5}
                onChange={(e) => setFeedback({ ...feedback, rating: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              />
            </label>
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
              Comentariu
              <input
                value={feedback.comment}
                onChange={(e) => setFeedback({ ...feedback, comment: e.target.value })}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              />
            </label>
          </div>
          <button
            className="mt-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
            onClick={() => addSwapFeedback(swap.id, feedback.rating, feedback.comment)}
          >
            Trimite feedback
          </button>
        </SectionCard>
      ) : null}

      <SectionCard title="Siguranță" description="Harta folosește pini anonimizati, notificările sunt server-side">
        <div className="flex flex-wrap gap-2 text-xs text-zinc-600 dark:text-zinc-300">
          <Pill color="blue">Pini Premium/Platinum</Pill>
          <Pill color="amber">Fallback fără hartă</Pill>
          <Pill color="green">Notificări automatizate</Pill>
        </div>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Toate acțiunile critice folosesc server actions / API routes în implementarea completă. În acest demo sunt simulate fără a rupe build-ul.
        </p>
        <CTAButton href="/info" variant="ghost">Vezi politicile</CTAButton>
      </SectionCard>

      <StateShowcase
        title="Stări CHANGE / SWAPLY"
        states={[
          {
            key: "loading",
            title: "Timeline în încărcare",
            description: "Afișăm skeleton pe pași și butoanele sunt disabled până sosesc datele swap.",
          },
          {
            key: "empty",
            title: "Niciun swap activ",
            description: "Mesaj de empty state (există deja) + CTA spre /match sau /chat pentru inițiere.",
          },
          {
            key: "error",
            title: "Blocaje de confirmare",
            description: "Mesaj clar când statusul nu poate fi actualizat; oferim buton „reîncearcă” sau contact suport.",
          },
        ]}
      />
    </div>
  );
}
