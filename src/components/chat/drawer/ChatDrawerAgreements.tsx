"use client";

import { useTranslations } from "next-intl";
import { agendaProgress, AGENDA_ITEMS } from "@/lib/chat/chatAgenda";
import type { AgendaState } from "@/lib/chat/chatAgenda";

interface Props {
  agendaState: AgendaState;
  myRole: "userA" | "userB";
  partnerName: string;
}

const STATUS_ICON: Record<string, string> = {
  unchecked: "☐",
  in_discussion: "🔄",
  agreed: "✅",
};

export function ChatDrawerAgreements({ agendaState, myRole, partnerName }: Props) {
  const t = useTranslations("chatAgenda");
  const { agreed, total } = agendaProgress(agendaState);

  const partnerRole = myRole === "userA" ? "userB" : "userA";

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div>
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-200">{t("progress")}</span>
          <span className="font-bold text-blue-600">{agreed}/{total}</span>
        </div>
        <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-2 rounded-full bg-blue-500 transition-all"
            style={{ width: `${total > 0 ? (agreed / total) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* All items */}
      <div className="space-y-1">
        {AGENDA_ITEMS.map((item) => {
          const state = agendaState[item.key];
          if (!state) return null;
          const myStatus = state[myRole];
          const partnerStatus = state[partnerRole];

          return (
            <div
              key={item.key}
              className="flex items-center justify-between rounded-xl border border-zinc-100 px-3 py-1.5 dark:border-zinc-800"
            >
              <p className="text-xs text-zinc-700 dark:text-zinc-300">
                {t(item.labelKey as keyof object)}
              </p>
              {item.bilateral ? (
                <div className="flex items-center gap-1 text-[10px]">
                  <span title="You">{STATUS_ICON[myStatus]}</span>
                  <span className="text-zinc-300">|</span>
                  <span title={partnerName}>{STATUS_ICON[partnerStatus]}</span>
                </div>
              ) : (
                <span className="text-[10px]">{STATUS_ICON[myStatus]}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
