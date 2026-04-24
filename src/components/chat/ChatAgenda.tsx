"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import { ChatAgendaItem } from "./ChatAgendaItem";
import { agendaProgress, allRequiredAgreed, AGENDA_ITEMS } from "@/lib/chat/chatAgenda";
import type { AgendaItemDef, AgendaState, AgendaStatus } from "@/lib/chat/chatAgenda";

type Group = AgendaItemDef["group"];

interface Props {
  agendaState: AgendaState;
  myRole: "userA" | "userB";
  partnerName: string;
  onToggle: (key: string, nextStatus: AgendaStatus) => void;
  onGenerateSummary?: () => void;
  defaultOpen?: boolean;
  showGenerateButton?: boolean;
  /** When set, renders as a sidebar column (always expanded, no accordion). */
  variant?: "accordion" | "sidebar";
  /** Content rendered at the bottom of the sidebar (typically <ChatSummary />). */
  summarySlot?: ReactNode;
}

const GROUP_ORDER: Group[] = ["items", "exchange", "bilateral", "individual", "final"];

export function ChatAgenda({
  agendaState,
  myRole,
  partnerName,
  onToggle,
  onGenerateSummary,
  defaultOpen = false,
  showGenerateButton = true,
  variant = "accordion",
  summarySlot,
}: Props) {
  const t = useTranslations("chat.agenda");
  const [open, setOpen] = useState(defaultOpen);
  const { agreed, total } = agendaProgress(agendaState);
  const canGenerate = allRequiredAgreed(agendaState);
  const isSidebar = variant === "sidebar";

  const itemsSection = (
    <>
      {/* Progress bar */}
      <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className="h-1.5 rounded-full bg-blue-500 transition-all"
          style={{ width: `${total > 0 ? (agreed / total) * 100 : 0}%` }}
        />
      </div>

      {/* Groups */}
      <div className="mt-3 space-y-3">
        {GROUP_ORDER.map((group) => {
          const items = AGENDA_ITEMS.filter((i) => i.group === group);
          if (!items.length) return null;
          return (
            <div key={group}>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                {t(`sections.${group}`)}
              </p>
              <div className="space-y-1">
                {items.map((item) => (
                  <ChatAgendaItem
                    key={item.key}
                    def={item}
                    state={
                      agendaState[item.key] ?? {
                        userA: "unchecked",
                        userB: "unchecked",
                        bilateral: item.bilateral,
                      }
                    }
                    myRole={myRole}
                    partnerName={partnerName}
                    onToggle={onToggle}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Generate summary button — only when no summarySlot is provided */}
      {showGenerateButton && onGenerateSummary && !summarySlot && (
        <>
          <button
            type="button"
            onClick={onGenerateSummary}
            disabled={!canGenerate}
            className="mt-4 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            📄 {t("generateSummary")}
          </button>
          {!canGenerate && (
            <p className="mt-1 text-center text-[10px] text-zinc-400">
              {t("generateSummaryHint")}
            </p>
          )}
        </>
      )}
    </>
  );

  if (isSidebar) {
    return (
      <div className="flex h-full min-h-0 flex-col bg-white dark:bg-zinc-900">
        {/* Sidebar header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              📋 {t("title")}
            </span>
          </div>
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            {agreed}/{total}
          </span>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto px-3 pb-3">{itemsSection}</div>

        {/* Summary pinned at bottom */}
        {summarySlot && (
          <div className="border-t border-zinc-100 p-3 dark:border-zinc-800">
            {summarySlot}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
      {/* Accordion header */}
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
          {open ? (
            <ChevronUp className="h-4 w-4 text-zinc-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-zinc-400" />
          )}
        </div>
      </button>

      {open && (
        <div className="border-t border-zinc-100 px-3 pb-3 dark:border-zinc-800">
          {itemsSection}
          {summarySlot && <div className="mt-3">{summarySlot}</div>}
        </div>
      )}
    </div>
  );
}
