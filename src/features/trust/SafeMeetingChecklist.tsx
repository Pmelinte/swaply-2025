"use client";

/**
 * SafeMeetingChecklist — interactive safety checklist for swap meetups.
 * Displayed when a swap status moves to "scheduled" or "in_progress".
 */

import { useState } from "react";
import { useAppState } from "@/lib/state";
import { useTranslations } from "next-intl";
import { CheckCircle2, Circle, Shield, AlertTriangle } from "lucide-react";

export function SafeMeetingChecklist({ }: { swapId?: string }) {
  const { safeMeetingChecklist } = useAppState();
  const t = useTranslations("safeMeeting");
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const requiredItems = safeMeetingChecklist.filter((c) => c.required);
  const optionalItems = safeMeetingChecklist.filter((c) => !c.required);
  const allRequiredDone = requiredItems.every((c) => checked.has(c.id));
  const progress = Math.round((checked.size / safeMeetingChecklist.length) * 100);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="mb-3 flex items-center gap-2">
        <Shield className="h-5 w-5 text-emerald-600" />
        <h3 className="text-lg font-bold">{t("title")}</h3>
      </div>

      {!allRequiredDone && (
        <div className="mb-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{t("completeRequired")}</span>
        </div>
      )}

      {/* Progress bar */}
      <div className="mb-4">
        <div className="mb-1 flex justify-between text-xs text-zinc-500">
          <span>{checked.size}/{safeMeetingChecklist.length} {t("checks", { done: checked.size, total: safeMeetingChecklist.length })}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className={`h-full rounded-full transition-all ${allRequiredDone ? "bg-emerald-500" : "bg-amber-500"}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Required items */}
      <div className="mb-3">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {t("required")}
        </h4>
        <div className="space-y-1.5">
          {requiredItems.map((item) => (
            <button
              key={item.id}
              onClick={() => toggle(item.id)}
              className="flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              {checked.has(item.id) ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-zinc-300 dark:text-zinc-600" />
              )}
              <div>
                <div className={`text-sm font-medium ${checked.has(item.id) ? "text-emerald-700 line-through dark:text-emerald-400" : ""}`}>
                  {item.label}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">{item.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Optional items */}
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {t("recommended")}
        </h4>
        <div className="space-y-1.5">
          {optionalItems.map((item) => (
            <button
              key={item.id}
              onClick={() => toggle(item.id)}
              className="flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              {checked.has(item.id) ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-zinc-300 dark:text-zinc-600" />
              )}
              <div>
                <div className={`text-sm font-medium ${checked.has(item.id) ? "text-blue-700 line-through dark:text-blue-400" : ""}`}>
                  {item.label}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">{item.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {allRequiredDone && (
        <div className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-center text-sm font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
          {t("allComplete")}
        </div>
      )}
    </div>
  );
}
