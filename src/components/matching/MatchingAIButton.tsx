"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import type { MatchingItemRow } from "@/lib/matching/matchQueries";

interface Props {
  userId: string;
  slotItemId: string | null;
  excludeIds: string[];
  slotsFull: boolean;
  onSuggestion: (item: MatchingItemRow, score: number) => void;
}

type Suggestion = {
  item: MatchingItemRow;
  score: number;
  reasoning: string;
};

export default function MatchingAIButton({
  userId,
  slotItemId,
  excludeIds,
  slotsFull,
  onSuggestion,
}: Props) {
  const t = useTranslations("matching");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!slotItemId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/matching/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ myItemId: slotItemId, userId, excludeIds }),
      });
      const data = (await res.json()) as { suggestions?: Suggestion[]; error?: string };
      if (!res.ok || !data.suggestions) {
        setError(data.error ?? "AI error");
        setSuggestions([]);
      } else {
        setSuggestions(data.suggestions);
      }
    } catch {
      setError("AI error");
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-purple-600" />
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          {t("ai_title")}
        </h2>
      </div>

      {!slotItemId && (
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">{t("ai_no_slot")}</p>
      )}
      {slotsFull && (
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">{t("ai_slots_full")}</p>
      )}

      <button
        type="button"
        onClick={run}
        disabled={!slotItemId || loading || slotsFull}
        className="rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:disabled:bg-zinc-700"
      >
        {loading ? t("ai_loading") : t("ai_button")}
      </button>

      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}

      {suggestions.length > 0 && (
        <div className="mt-4 space-y-3">
          {suggestions.map((s) => (
            <div
              key={s.item.id}
              className="rounded-xl border border-purple-200 bg-purple-50 p-3 dark:border-purple-800 dark:bg-purple-950/30"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase text-purple-700 dark:text-purple-200">
                  {t("ai_badge")}
                </span>
                <span className="text-xs font-bold text-purple-800 dark:text-purple-100">
                  {s.score}%
                </span>
              </div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {s.item.title}
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">{s.reasoning}</p>
              <button
                type="button"
                onClick={() => onSuggestion(s.item, s.score)}
                className="mt-2 rounded-full bg-purple-600 px-3 py-1 text-xs font-semibold text-white hover:bg-purple-700"
              >
                {t("express_interest")}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
