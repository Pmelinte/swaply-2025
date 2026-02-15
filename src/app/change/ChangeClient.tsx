"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("change");
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
        title={t("title")}
        description={t("description")}
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
            {t("noSwaps")}
          </p>
        )}
      </SectionCard>

      {swap ? (
        <SectionCard title={t("confirmations")} description={t("updateStatus")}>
          {statusError ? (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-900 dark:bg-red-900/40 dark:text-red-100">
              {statusError}
            </div>
          ) : null}
          <div className="mb-2 text-xs text-zinc-500">
            {t("currentStatus")} <span className="font-semibold">{swap.status}</span>
            {VALID_TRANSITIONS[swap.status].length > 0
              ? ` — ${t("possibleTransitions")} ${VALID_TRANSITIONS[swap.status].join(", ")}`
              : ` — ${t("noMoreTransitions")}`}
          </div>
          <div className="flex flex-wrap gap-2 text-sm font-semibold">
            {VALID_TRANSITIONS[swap.status].includes("scheduled") ? (
              <button
                className="rounded-full bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                onClick={() => { setStatusError(null); void updateSwapStatus(swap.id, "scheduled"); }}
              >
                {t("schedule")}
              </button>
            ) : null}
            {VALID_TRANSITIONS[swap.status].includes("in_progress") ? (
              <button
                className="rounded-full bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                onClick={() => { setStatusError(null); void updateSwapStatus(swap.id, "in_progress"); }}
              >
                {t("markInProgress")}
              </button>
            ) : null}
            {VALID_TRANSITIONS[swap.status].includes("completed") ? (
              <button
                className="rounded-full bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
                onClick={() => { setStatusError(null); void updateSwapStatus(swap.id, "completed"); }}
              >
                {t("confirmCompletion")}
              </button>
            ) : null}
            {VALID_TRANSITIONS[swap.status].includes("cancelled") ? (
              <button
                className="rounded-full bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                onClick={() => { setStatusError(null); void updateSwapStatus(swap.id, "cancelled"); }}
              >
                {t("cancelSwap")}
              </button>
            ) : null}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
              {t("rating")}
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
              {t("comment")}
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
            {t("submitFeedback")}
          </button>
        </SectionCard>
      ) : null}

      <SectionCard title={t("usageSteps")} description={t("usageStepsDescription")}>
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { step: "1", title: t("step1Title"), desc: t("step1Description") },
              { step: "2", title: t("step2Title"), desc: t("step2Description") },
              { step: "3", title: t("step3Title"), desc: t("step3Description") },
              { step: "4", title: t("step4Title"), desc: t("step4Description") },
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
            {t("demoNote")}
          </p>
        </div>
      </SectionCard>

      <SectionCard title={t("safety")} description={t("safetyDescription")}>
        <div className="flex flex-wrap gap-2 text-xs text-zinc-600 dark:text-zinc-300">
          <Pill color="blue">{t("premiumPins")}</Pill>
          <Pill color="amber">{t("mapFallback")}</Pill>
          <Pill color="green">{t("automatedNotifications")}</Pill>
        </div>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          {t("statusNote")}
        </p>
        <CTAButton href="/info" variant="ghost">{t("viewPolicies")}</CTAButton>
      </SectionCard>

      <NextStepRecommendation
        steps={[
          { label: t("leaveFeedback"), href: "/change", description: t("leaveFeedbackDescription") },
          { label: t("findAnotherMatch"), href: "/match", description: t("findAnotherMatchDescription") },
          { label: t("viewStats"), href: "/info#stats", description: t("viewStatsDescription") },
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

