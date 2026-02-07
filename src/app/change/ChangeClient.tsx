"use client";

import { useState } from "react";
import { useAppState } from "@/lib/state";
import { LoggedOutGate } from "@/components/gated";
import { CTAButton, NextStepRecommendation, Pill, SectionCard, StateShowcase } from "@/components/ui";
import { SwapTimeline } from "@/features/change/SwapTimeline";
import type { SwapIntent } from "@/lib/types";

const VALID_TRANSITIONS: Record<SwapIntent["status"], SwapIntent["status"][]> = {
  proposed: ["scheduled", "cancelled"],
  scheduled: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function ChangeClient({ swapFromQuery }: { swapFromQuery?: string | null }) {
  const { user, swaps, updateSwapStatus, addSwapFeedback, items } = useAppState();
  const [feedback, setFeedback] = useState({ rating: 5, comment: "" });
  const [statusError, setStatusError] = useState<string | null>(null);
  const [activeSwapId, setActiveSwapId] = useState<string | null>(swapFromQuery ?? null);

  const swap = swaps.find((s) => s.id === activeSwapId) ?? swaps[0];
  const requesterItem = swap ? items.find((i) => i.id === swap.requesterItemId) : null;
  const responderItem = swap ? items.find((i) => i.id === swap.responderItemId) : null;

  if (!user) {
    return <LoggedOutGate returnTo="/change" />;
  }

  return (
    <div className="space-y-4">
      <SectionCard
        title="Flux schimb (Swaply)"
        description="Confirmare + logistică + hartă (niveluri) + notificări + feedback"
      >
        {swaps.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            {swaps.map((s) => {
              const left = items.find((i) => i.id === s.requesterItemId)?.title ?? s.requesterItemId;
              const right =
                items.find((i) => i.id === s.responderItemId)?.title ?? s.responderItemId;
              const active = s.id === swap?.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveSwapId(s.id)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    active
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {left} ↔ {right}
                </button>
              );
            })}
          </div>
        ) : null}
        {swap ? (
          <SwapTimeline
            swap={swap}
            requesterLabel={requesterItem?.title ?? swap.requesterItemId}
            responderLabel={responderItem?.title ?? swap.responderItemId}
          />
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Nu există încă swap-uri. Inițiază unul din pagina de match sau chat.
          </p>
        )}
      </SectionCard>

      {swap ? (
        <SectionCard title="Confirmări" description="Actualizează statusul și oferă feedback">
          {statusError ? (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-900 dark:bg-red-900/40 dark:text-red-100">
              {statusError}
            </div>
          ) : null}
          <div className="mb-2 text-xs text-zinc-500">
            Status curent: <span className="font-semibold">{swap.status}</span>
            {VALID_TRANSITIONS[swap.status].length > 0
              ? ` — tranziții posibile: ${VALID_TRANSITIONS[swap.status].join(", ")}`
              : " — nu mai sunt tranziții posibile"}
          </div>
          <div className="flex flex-wrap gap-2 text-sm font-semibold">
            {VALID_TRANSITIONS[swap.status].includes("scheduled") ? (
              <button
                className="rounded-full bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                onClick={() => { setStatusError(null); void updateSwapStatus(swap.id, "scheduled"); }}
              >
                Programează
              </button>
            ) : null}
            {VALID_TRANSITIONS[swap.status].includes("in_progress") ? (
              <button
                className="rounded-full bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                onClick={() => { setStatusError(null); void updateSwapStatus(swap.id, "in_progress"); }}
              >
                Marchează in desfasurare
              </button>
            ) : null}
            {VALID_TRANSITIONS[swap.status].includes("completed") ? (
              <button
                className="rounded-full bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
                onClick={() => { setStatusError(null); void updateSwapStatus(swap.id, "completed"); }}
              >
                Confirma finalizarea
              </button>
            ) : null}
            {VALID_TRANSITIONS[swap.status].includes("cancelled") ? (
              <button
                className="rounded-full bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                onClick={() => { setStatusError(null); void updateSwapStatus(swap.id, "cancelled"); }}
              >
                Anuleaza swap
              </button>
            ) : null}
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
            onClick={() => void addSwapFeedback(swap.id, feedback.rating, feedback.comment)}
          >
            Trimite feedback
          </button>
        </SectionCard>
      ) : null}

      <SectionCard title="Pașii de utilizare" description="Ghid pas cu pas pentru un schimb reușit">
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { step: "1", title: "Propune schimbul", desc: "Selectează obiectul dorit și trimite o propunere de swap." },
              { step: "2", title: "Acceptare / Negociere", desc: "Partenerul acceptă, respinge sau propune modificări." },
              { step: "3", title: "Logistică", desc: "Alegeți locul de întâlnire sau opțiunea de curier." },
              { step: "4", title: "Confirmare finală", desc: "Ambii confirmă, lasă feedback și primesc tokeni." },
            ].map((s) => (
              <div
                key={s.step}
                className="rounded-xl border border-zinc-200 bg-white/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/70"
              >
                <div className="mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {s.step}
                </div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{s.title}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Funcționalitatea completă necesită integrare cu backend de mesagerie și logistică. În acest demo sunt persistate doar intențiile de swap și statusul.
          </p>
        </div>
      </SectionCard>

      <SectionCard title="Siguranță" description="Harta folosește pini anonimizati, notificările sunt server-side">
        <div className="flex flex-wrap gap-2 text-xs text-zinc-600 dark:text-zinc-300">
          <Pill color="blue">Pini Premium/Platinum</Pill>
          <Pill color="amber">Fallback fără hartă</Pill>
          <Pill color="green">Notificări automatizate</Pill>
        </div>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Acțiunile de status și feedback sunt conectate la `swap_intents`. Notificările din meniu vin din tabela `notifications`.
        </p>
        <CTAButton href="/info" variant="ghost">Vezi politicile</CTAButton>
      </SectionCard>

      <NextStepRecommendation
        steps={[
          { label: "Lasă feedback", href: "/change", description: "Evaluează experiența swap-ului" },
          { label: "Caută alt match", href: "/match", description: "Descoperă noi oportunități de schimb" },
          { label: "Vezi statistici", href: "/info#stats", description: "Verifică-ți reputația și tokenii" },
        ]}
      />

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

