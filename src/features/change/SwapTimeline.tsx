"use client";

import { useTranslations, useLocale } from "next-intl";
import { formatDate } from "@/lib/utils";
import { SwapIntent } from "@/lib/types";
import { Pill } from "@/components/ui-custom";

export function SwapTimeline({
  swap,
  requesterLabel,
  responderLabel,
}: {
  swap: SwapIntent;
  requesterLabel?: string;
  responderLabel?: string;
}) {
  const t = useTranslations("swapTimeline");
  const locale = useLocale();

  const statusLabels: Record<SwapIntent["status"], string> = {
    pending: t("proposed"),
    accepted: t("scheduled"),
    in_progress: t("scheduled"),
    delivered_by_a: t("scheduled"),
    delivered_by_b: t("scheduled"),
    rejected: t("cancelled"),
    completed: t("completed"),
    cancelled: t("cancelled"),
    expired: t("cancelled"),
    disputed: t("disputed"),
    resolved: t("completed"),
  };

  const steps: Array<{ title: string; description: string; done: boolean }> = [
    {
      title: t("initialProposal"),
      description: t("proposalDescription"),
      done: true,
    },
    {
      title: t("scheduleMeeting"),
      description:
        swap.logistics.locationType === "courier"
          ? t("courierDescription")
          : t("meetupDescription"),
      done: ["accepted", "completed"].includes(swap.status),
    },
    {
      title: t("exchangeInProgress"),
      description: t("exchangeDescription"),
      done: ["accepted", "completed"].includes(swap.status),
    },
    {
      title: t("feedbackAndReputation"),
      description: t("feedbackDescription"),
      done: swap.status === "completed",
    },
  ];

  return (
    <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase text-zinc-500">{t("exchange")}</p>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {requesterLabel ?? swap.requesterItemId} ↔ {responderLabel ?? swap.responderItemId}
          </h3>
        </div>
        <Pill color="blue">{t("status")} {statusLabels[swap.status]}</Pill>
      </div>
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={step.title}
            className="flex items-start gap-3 rounded-xl border border-zinc-100 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-800/50"
          >
            <div
              className={`mt-1 h-3 w-3 rounded-full ${step.done ? "bg-green-500" : "bg-zinc-400"}`}
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {index + 1}. {step.title}
                </h4>
                {step.done ? <Pill color="green">{t("completed")}</Pill> : null}
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-blue-100 bg-blue-50/80 p-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
        {t("autoNotifications")} {swap.notifications.join(" · ")}
      </div>
      <div className="text-xs text-zinc-500 dark:text-zinc-400">
        {t("lastUpdate")} {formatDate(swap.updatedAt || swap.createdAt || new Date().toISOString(), locale)}
      </div>
    </div>
  );
}
