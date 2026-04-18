"use client";

import { useTranslations } from "next-intl";
import type { AgendaItemDef, AgendaItemState } from "@/lib/chat/chatAgenda";

interface Props {
  def: AgendaItemDef;
  state: AgendaItemState;
  myRole: "userA" | "userB";
  partnerName: string;
  onAdvance: (key: string) => void;
}

const STATUS_COLOR = {
  unchecked:    "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500",
  in_discussion: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  agreed:        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-500",
};

const STATUS_ICON = {
  unchecked:    "☐",
  in_discussion: "🔄",
  agreed:        "✅",
};

export function ChatAgendaItem({ def, state, myRole, partnerName, onAdvance }: Props) {
  const t = useTranslations("chatAgenda");
  const tc = useTranslations("chat");

  const myStatus = state[myRole];
  const partnerRole = myRole === "userA" ? "userB" : "userA";
  const partnerStatus = state[partnerRole];

  const isFullyAgreed = def.bilateral
    ? state.userA === "agreed" && state.userB === "agreed"
    : myStatus === "agreed";

  return (
    <div className={`rounded-xl border p-2 transition ${
      isFullyAgreed
        ? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20"
        : "border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900"
    }`}>
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={() => onAdvance(def.key)}
          disabled={myStatus === "agreed"}
          className={`shrink-0 rounded-lg px-1.5 py-0.5 text-sm ${STATUS_COLOR[myStatus]} disabled:cursor-default`}
        >
          {STATUS_ICON[myStatus]}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium ${isFullyAgreed ? "text-green-700 line-through dark:text-green-400" : "text-zinc-700 dark:text-zinc-200"}`}>
            {t(def.labelKey as keyof object)}
          </p>

          {/* Bilateral status */}
          {def.bilateral && (
            <div className="mt-0.5 flex flex-wrap gap-1 text-[9px]">
              <span className={`rounded-full px-1.5 py-0.5 ${STATUS_COLOR[myStatus]}`}>
                {t("you")}: {STATUS_ICON[myStatus]}
              </span>
              <span className={`rounded-full px-1.5 py-0.5 ${STATUS_COLOR[partnerStatus]}`}>
                {partnerName}: {STATUS_ICON[partnerStatus]}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
