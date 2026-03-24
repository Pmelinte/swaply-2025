"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import {
  CheckSquare,
  FileText,
  Globe,
  Loader2,
  MessageSquare,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";

type AiAction =
  | "rephrase_polite"
  | "translate"
  | "summarize_offer"
  | "generate_response"
  | "generate_checklist";

interface ResponseVariant {
  type: string;
  emoji: string;
  label: string;
  text: string;
}

interface ChecklistItem {
  label: string;
  checked: boolean;
}

interface AIChatAssistProps {
  draft: string;
  conversationMessages: string[];
  swapContext?: {
    reqItem?: string;
    resItem?: string;
    status?: string;
    logistics?: string;
    meetupPoint?: string;
  };
  onInsertText: (text: string) => void;
}

export function AIChatAssist({
  draft,
  conversationMessages,
  swapContext,
  onInsertText,
}: AIChatAssistProps) {
  const t = useTranslations("aiAssist");
  const { user } = useAppState();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [variants, setVariants] = useState<ResponseVariant[] | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[] | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [moderationWarning, setModerationWarning] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const resetResults = useCallback(() => {
    setVariants(null);
    setChecklist(null);
    setSummary(null);
    setModerationWarning(null);
    setError(null);
  }, []);

  const callAssist = useCallback(async (action: AiAction) => {
    setLoading(true);
    resetResults();

    try {
      const res = await fetch("/api/ai/chat-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: draft || undefined,
          action,
          conversationContext: conversationMessages.slice(-10),
          swapContext,
          userId: user?.id,
          userTier: user?.badge ?? "free",
        }),
      });

      const data = await res.json();

      if (data.status === "moderation") {
        const warningKey = data.warning as string;
        setModerationWarning(warningKey);
        setLoading(false);
        return;
      }

      if (data.status === "error") {
        setError(data.code === "daily_limit_reached" ? t("dailyLimitReached") : data.message);
        setLoading(false);
        return;
      }

      switch (action) {
        case "rephrase_polite":
          onInsertText(data.result.rephrased);
          setOpen(false);
          break;
        case "translate":
          onInsertText(data.result.translated);
          setOpen(false);
          break;
        case "summarize_offer":
          setSummary(data.result.summary);
          break;
        case "generate_response":
          setVariants(data.result.variants);
          break;
        case "generate_checklist":
          setChecklist(data.result.checklist);
          break;
      }
    } catch {
      setError(t("genericError"));
    } finally {
      setLoading(false);
    }
  }, [draft, conversationMessages, swapContext, user?.id, user?.badge, onInsertText, resetResults, t]);

  const handleSelectVariant = useCallback((text: string) => {
    onInsertText(text);
    setVariants(null);
    setOpen(false);
  }, [onInsertText]);

  const actions: Array<{ key: AiAction; icon: React.ReactNode; label: string; needsDraft?: boolean }> = [
    { key: "rephrase_polite", icon: <Wand2 className="h-3.5 w-3.5" />, label: t("rephrase"), needsDraft: true },
    { key: "translate", icon: <Globe className="h-3.5 w-3.5" />, label: t("translate") , needsDraft: true },
    { key: "summarize_offer", icon: <FileText className="h-3.5 w-3.5" />, label: t("summarize") },
    { key: "generate_response", icon: <MessageSquare className="h-3.5 w-3.5" />, label: t("generateResponse") },
    { key: "generate_checklist", icon: <CheckSquare className="h-3.5 w-3.5" />, label: t("checklist") },
  ];

  return (
    <div className="relative" ref={menuRef}>
      {/* AI trigger button */}
      <button
        type="button"
        onClick={() => { setOpen(!open); resetResults(); }}
        title={t("title")}
        aria-label={t("title")}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors ${
          open
            ? "border-purple-400 bg-purple-50 text-purple-600 dark:border-purple-600 dark:bg-purple-950/40 dark:text-purple-400"
            : "border-zinc-200 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        }`}
      >
        <Sparkles className="h-4 w-4" />
      </button>

      {/* Contextual menu */}
      {open && (
        <div className="absolute bottom-12 left-0 z-50 w-72 rounded-xl border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-700 dark:bg-zinc-900 sm:w-80">
          {/* Header */}
          <div className="mb-2 flex items-center justify-between px-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-purple-500" />
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-100">
                {t("title")}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
              <span className="text-xs text-zinc-500">{t("processing")}</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Moderation Warning */}
          {moderationWarning && (
            <div className="mb-2 rounded-lg bg-amber-50 px-3 py-2 dark:bg-amber-950/30">
              <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                {moderationWarning === "personal_data_email" && t("warningEmail")}
                {moderationWarning === "personal_data_phone" && t("warningPhone")}
                {moderationWarning === "external_link" && t("warningLink")}
                {moderationWarning === "offensive_language" && t("warningOffensive")}
              </p>
              <button
                type="button"
                onClick={() => void callAssist("rephrase_polite")}
                className="mt-1 text-[10px] font-semibold text-amber-600 underline hover:text-amber-800 dark:text-amber-400"
              >
                {t("suggestRephrase")}
              </button>
            </div>
          )}

          {/* Action buttons */}
          {!loading && !variants && !checklist && !summary && (
            <div className="space-y-1">
              {actions.map(({ key, icon, label, needsDraft }) => (
                <button
                  key={key}
                  type="button"
                  disabled={needsDraft && !draft.trim()}
                  onClick={() => void callAssist(key)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-zinc-700 transition-colors hover:bg-purple-50 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-300 dark:hover:bg-purple-950/30 dark:hover:text-purple-300"
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Response Variants */}
          {variants && (
            <div className="space-y-1.5">
              <p className="px-2 text-[10px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {t("selectVariant")}
              </p>
              {variants.map((v) => (
                <button
                  key={v.type}
                  type="button"
                  onClick={() => handleSelectVariant(v.text)}
                  className="w-full rounded-lg border border-zinc-100 bg-zinc-50/80 p-2.5 text-left transition-colors hover:border-purple-200 hover:bg-purple-50/80 dark:border-zinc-800 dark:bg-zinc-800/50 dark:hover:border-purple-800 dark:hover:bg-purple-950/30"
                >
                  <div className="mb-1 flex items-center gap-1.5">
                    <span>{v.emoji}</span>
                    <span className="text-[10px] font-semibold text-zinc-800 dark:text-zinc-100">
                      {v.label}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {v.text}
                  </p>
                </button>
              ))}
              <button
                type="button"
                onClick={() => { setVariants(null); }}
                className="w-full rounded-lg px-3 py-1.5 text-[10px] text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                {t("back")}
              </button>
            </div>
          )}

          {/* Summary */}
          {summary && (
            <div className="space-y-2">
              <div className="rounded-lg border border-blue-100 bg-blue-50/80 p-2.5 dark:border-blue-900 dark:bg-blue-950/30">
                <p className="whitespace-pre-line text-xs leading-relaxed text-blue-800 dark:text-blue-200">
                  {summary}
                </p>
              </div>
              <button
                type="button"
                onClick={() => { onInsertText(summary); setOpen(false); }}
                className="w-full rounded-lg bg-purple-100 px-3 py-1.5 text-[10px] font-semibold text-purple-700 hover:bg-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:hover:bg-purple-900/60"
              >
                {t("insertInChat")}
              </button>
              <button
                type="button"
                onClick={() => { setSummary(null); }}
                className="w-full rounded-lg px-3 py-1.5 text-[10px] text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                {t("back")}
              </button>
            </div>
          )}

          {/* Checklist */}
          {checklist && (
            <div className="space-y-2">
              <p className="px-2 text-[10px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {t("swapChecklist")}
              </p>
              <div className="space-y-1">
                {checklist.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5"
                  >
                    <span className={`text-sm ${item.checked ? "text-emerald-500" : "text-zinc-300 dark:text-zinc-600"}`}>
                      {item.checked ? "✅" : "⬜"}
                    </span>
                    <span className={`text-xs ${item.checked ? "text-zinc-800 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400"}`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  const text = checklist.map((c) => `${c.checked ? "✅" : "⬜"} ${c.label}`).join("\n");
                  onInsertText(text);
                  setOpen(false);
                }}
                className="w-full rounded-lg bg-purple-100 px-3 py-1.5 text-[10px] font-semibold text-purple-700 hover:bg-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:hover:bg-purple-900/60"
              >
                {t("insertInChat")}
              </button>
              <button
                type="button"
                onClick={() => { setChecklist(null); }}
                className="w-full rounded-lg px-3 py-1.5 text-[10px] text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                {t("back")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
