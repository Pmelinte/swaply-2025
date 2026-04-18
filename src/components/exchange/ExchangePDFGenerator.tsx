"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDown, Mail } from "lucide-react";

interface Props {
  swapId: string;
}

export function ExchangePDFGenerator({ swapId }: Props) {
  const t = useTranslations("exchangePage");
  const [generating, setGenerating] = useState(false);

  function handleDownload() {
    setGenerating(true);
    const win = window.open(`/api/exchange/${swapId}/pdf`, "_blank");
    if (win) {
      win.onload = () => setGenerating(false);
      // Fallback timeout
      setTimeout(() => setGenerating(false), 3000);
    } else {
      setGenerating(false);
    }
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 dark:border-amber-900/40 dark:bg-amber-950/10">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xl">📄</span>
        <div>
          <p className="font-semibold text-zinc-900 dark:text-zinc-50">{t("documentTitle")}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("documentDesc")}</p>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
        ⚠️ {t("disclaimer")}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleDownload}
          disabled={generating}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          <FileDown className="h-4 w-4" />
          {generating ? t("generatingPdf") : t("downloadPdf")}
        </button>
      </div>
    </div>
  );
}
