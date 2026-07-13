"use client";

import { CheckCircle2, Circle, MessageSquareText, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  MATCH_CONVERSATION_STAGES,
  type MatchConversationAgendaState,
  type MatchConversationStage,
} from "@/lib/chat/chatQueries";

interface Props {
  agenda: MatchConversationAgendaState;
  savingStage: MatchConversationStage | null;
  saveFailed?: boolean;
  disabled?: boolean;
  onUpdateStage: (
    stage: MatchConversationStage,
    completed?: boolean | null,
  ) => void;
  onInsertDraft: (text: string) => void;
}

const quickReplyKeys = [
  "interested",
  "condition",
  "offer",
  "local",
  "courier",
] as const;

const refusalKeys = ["notRightFit", "needTime", "preferDifferent"] as const;

export function MatchConversationGuide({
  agenda,
  savingStage,
  saveFailed = false,
  disabled = false,
  onUpdateStage,
  onInsertDraft,
}: Props) {
  const t = useTranslations("guidedMatchConversation");
  const completed = new Set(agenda.completed_stages);
  const stageControlsDisabled = disabled || savingStage !== null;

  return (
    <section
      data-testid="match-conversation-guide"
      className="space-y-4 border-b border-zinc-200 bg-blue-50/50 p-4 dark:border-zinc-800 dark:bg-blue-950/10"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquareText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {t("title")}
            </h3>
          </div>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-zinc-600 dark:text-zinc-300">
            {t("description")}
          </p>
        </div>
        <p
          data-testid="match-guide-progress"
          className="shrink-0 text-xs font-semibold text-blue-700 dark:text-blue-300"
        >
          {t("progress", {
            completed: agenda.completed_stages.length,
            total: MATCH_CONVERSATION_STAGES.length,
          })}
        </p>
      </div>

      {saveFailed ? (
        <p
          role="alert"
          data-testid="match-agenda-save-error"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"
        >
          {t("saveError")}
        </p>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {MATCH_CONVERSATION_STAGES.map((stage) => {
          const isActive = agenda.active_stage === stage;
          const isCompleted = completed.has(stage);
          const isSaving = savingStage === stage;

          return (
            <div
              key={stage}
              className={`rounded-xl border p-2 transition ${
                isActive
                  ? "border-blue-400 bg-white shadow-sm dark:border-blue-700 dark:bg-zinc-900"
                  : "border-zinc-200 bg-white/70 dark:border-zinc-800 dark:bg-zinc-950/40"
              }`}
            >
              <button
                type="button"
                data-testid={`match-stage-${stage}`}
                aria-pressed={isActive}
                disabled={stageControlsDisabled}
                onClick={() => onUpdateStage(stage, null)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-zinc-800 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-100 dark:hover:bg-blue-950/30"
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-zinc-400" />
                )}
                <span>{t(`stages.${stage}`)}</span>
              </button>
              <button
                type="button"
                data-testid={`match-stage-complete-${stage}`}
                disabled={stageControlsDisabled}
                onClick={() => onUpdateStage(stage, !isCompleted)}
                className="mt-1 w-full rounded-lg border border-zinc-200 px-2 py-1 text-[11px] font-medium text-zinc-600 hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-blue-700 dark:hover:text-blue-300"
              >
                {isSaving
                  ? t("saving")
                  : isCompleted
                    ? t("markIncomplete")
                    : t("markComplete")}
              </button>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
            {t("quickRepliesTitle")}
          </h4>
          <p className="mt-1 text-[11px] leading-5 text-zinc-500 dark:text-zinc-400">
            {t("quickRepliesDescription")}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {quickReplyKeys.map((key) => (
              <button
                key={key}
                type="button"
                data-testid={`quick-reply-${key}`}
                disabled={disabled}
                onClick={() => onInsertDraft(t(`quickReplies.${key}`))}
                className="rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-800 hover:border-blue-400 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-blue-900 dark:bg-zinc-900 dark:text-blue-200 dark:hover:bg-blue-950/40"
              >
                {t(`quickReplyLabels.${key}`)}
              </button>
            ))}
          </div>
        </div>

        <details className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-semibold text-zinc-900 dark:text-zinc-50">
            <XCircle className="h-4 w-4 text-zinc-500" />
            {t("refusalTitle")}
          </summary>
          <p className="mt-2 text-[11px] leading-5 text-zinc-500 dark:text-zinc-400">
            {t("refusalDescription")}
          </p>
          <div className="mt-2 space-y-2">
            {refusalKeys.map((key) => (
              <button
                key={key}
                type="button"
                data-testid={`polite-refusal-${key}`}
                disabled={disabled}
                onClick={() => onInsertDraft(t(`refusals.${key}`))}
                className="block w-full rounded-lg border border-zinc-200 px-3 py-2 text-left text-xs text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                {t(`refusalLabels.${key}`)}
              </button>
            ))}
          </div>
        </details>
      </div>

      <p className="text-[11px] leading-5 text-zinc-500 dark:text-zinc-400">
        {t("draftNotice")}
      </p>
    </section>
  );
}
