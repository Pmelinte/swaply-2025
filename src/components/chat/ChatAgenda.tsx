"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import { ChatAgendaItem } from "./ChatAgendaItem";
import { agendaProgress, allRequiredAgreed, AGENDA_ITEMS } from "@/lib/chat/chatAgenda";
import type { AgendaState } from "@/lib/chat/chatAgenda";

interface Props {
  agendaState: AgendaState;
  myRole: "userA" | "userB";
  partnerName: string;
  onAdvance: (key: string) => void;
  onGenerateSummary: () => void;
  defaultOpen?: boolean;
}

const GROUP_LABELS: Record<string, string> = {
  items:      "agendaGroupItems",
  exchange:   "agendaGroupExchange",
  services:   "agendaGroupServices",
  logistics:  "agendaGroupLogistics",
  completion: "agendaGroupCompletion",
};

export function ChatAgenda({
  agendaState,
  myRole,
  partnerName,
  onAdvance,
  onGenerateSummary,
  defaultOpen = false,
}: Props) {
  const t = useTranslations("chatAgenda");
  const [open, setOpen] = useState(defaultOpen);
  const { agreed, total } = agendaProgress(agendaState);
  const canGenerate = allRequiredAgreed(agendaState);

  // Group items
  const groups = Array.from(new Set(AGENDA_ITEMS.map((i) => i.group)));

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((v: boolean) => !v)}
        className="flex w-full items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            📋 {t("title")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            {agreed}/{total}
          </span>
          {open ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-zinc-100 px-3 pb-3 dark:border-zinc-800">
          {/* Progress bar */}
          <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-1.5 rounded-full bg-blue-500 transition-all"
              style={{ width: `${total > 0 ? (agreed / total) * 100 : 0}%` }}
            />
          </div>

          {/* Groups */}
          <div className="mt-3 space-y-3">
            {groups.map((group) => {
              const items = AGENDA_ITEMS.filter((i) => i.group === group);
              return (
                <div key={group}>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                    {t(GROUP_LABELS[group] as keyof object)}
                  </p>
                  <div className="space-y-1">
                    {items.map((item) => (
                      <ChatAgendaItem
                        key={item.key}
                        def={item}
                        state={agendaState[item.key] ?? { userA: "unchecked", userB: "unchecked", bilateral: item.bilateral }}
                        myRole={myRole}
                        partnerName={partnerName}
                        onAdvance={onAdvance}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Generate summary button */}
          <button
            type="button"
            onClick={onGenerateSummary}
            disabled={!canGenerate}
            className="mt-4 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            📄 {t("generateSummary")}
          </button>
          {!canGenerate && (
            <p className="mt-1 text-center text-[10px] text-zinc-400">{t("generateSummaryHint")}</p>
          )}
        </div>
      )}
    </div>
  );
}
