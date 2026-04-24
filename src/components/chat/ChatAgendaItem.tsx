"use client";

import { useTranslations } from "next-intl";
import type { AgendaItemDef, AgendaItemState, AgendaStatus } from "@/lib/chat/chatAgenda";

interface Props {
  def: AgendaItemDef;
  state: AgendaItemState;
  myRole: "userA" | "userB";
  partnerName: string;
  onToggle: (key: string, nextStatus: AgendaStatus) => void;
}

const STATUS_ICON: Record<AgendaStatus, string> = {
  unchecked: "☐",
  in_discussion: "🔄",
  agreed: "✅",
};

const STATUS_COLOR: Record<AgendaStatus, string> = {
  unchecked: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  in_discussion: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  agreed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-500",
};

function nextStatus(current: AgendaStatus): AgendaStatus {
  if (current === "unchecked") return "agreed";
  if (current === "agreed") return "unchecked";
  return "agreed";
}

export function ChatAgendaItem({ def, state, myRole, partnerName, onToggle }: Props) {
  const t = useTranslations("chat.agenda");

  const myStatus = state[myRole];
  const partnerRole = myRole === "userA" ? "userB" : "userA";
  const partnerStatus = state[partnerRole];

  const isFullyAgreed = def.bilateral
    ? state.userA === "agreed" && state.userB === "agreed"
    : myStatus === "agreed";

  return (
    <div
      className={`rounded-xl border p-2 transition ${
        isFullyAgreed
          ? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20"
          : "border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={() => onToggle(def.key, nextStatus(myStatus))}
          aria-label={t(def.labelKey)}
          aria-pressed={myStatus === "agreed"}
          className={`shrink-0 rounded-lg px-1.5 py-0.5 text-sm ${STATUS_COLOR[myStatus]}`}
        >
          {STATUS_ICON[myStatus]}
        </button>
        <div className="flex-1 min-w-0">
          <p
            className={`text-xs font-medium ${
              isFullyAgreed
                ? "text-green-700 line-through dark:text-green-400"
                : "text-zinc-700 dark:text-zinc-200"
            }`}
          >
            {t(def.labelKey)}
          </p>

          {def.bilateral && (
            <div className="mt-0.5 flex flex-wrap gap-1 text-[9px]">
              <span className={`rounded-full px-1.5 py-0.5 ${STATUS_COLOR[myStatus]}`}>
                {myStatus === "agreed"
                  ? `✅ ${t("bilateral.youAgreed")}`
                  : `${STATUS_ICON[myStatus]} ${t("you")}`}
              </span>
              <span className={`rounded-full px-1.5 py-0.5 ${STATUS_COLOR[partnerStatus]}`}>
                {partnerStatus === "agreed"
                  ? `✅ @${partnerName}`
                  : `⏳ ${t("bilateral.waitingFor")} @${partnerName}`}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
