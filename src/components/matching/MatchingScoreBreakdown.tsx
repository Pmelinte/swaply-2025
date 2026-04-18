"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ScoredItem } from "@/hooks/useMatchingResults";

interface Props {
  scored: ScoredItem;
  defaultOpen?: boolean;
}

export function MatchingScoreBreakdown({ scored, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const t = useTranslations("matching");

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        <span>{t("scoreDetails")}</span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open && (
        <div className="space-y-1 px-3 pb-3">
          {scored.breakdown.map((f) => (
            <div key={f.key} className="flex items-center gap-2">
              <div className="h-1.5 flex-1 rounded-full bg-zinc-100 dark:bg-zinc-700">
                <div
                  className="h-1.5 rounded-full bg-blue-500"
                  style={{ width: `${Math.round(f.raw * 100)}%` }}
                />
              </div>
              <span className="w-8 text-right text-xs tabular-nums text-zinc-500">
                {Math.round(f.raw * 100)}%
              </span>
              <span className="w-28 truncate text-xs text-zinc-500">{f.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
