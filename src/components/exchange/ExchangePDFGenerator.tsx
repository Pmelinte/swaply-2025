"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDown } from "lucide-react";

interface Props {
  swapId: string;
  initialPdfUrl?: string | null;
}

/**
 * Triggers server-side PDF generation via POST /api/exchange/[swapId]/pdf,
 * then auto-downloads the returned pdf_url. Rendering itself is server-only
 * (@react-pdf/renderer is not bundled into this client component).
 */
export function ExchangePDFGenerator({ swapId, initialPdfUrl }: Props) {
  const t = useTranslations("exchange.pdf");
  const [generating, setGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(initialPdfUrl ?? null);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/exchange/${swapId}/pdf`, { method: "POST" });
      if (!res.ok) {
        setError(`HTTP ${res.status}`);
        setGenerating(false);
        return;
      }
      const json = (await res.json()) as { pdf_url?: string };
      if (!json.pdf_url) {
        setError("no_url");
        setGenerating(false);
        return;
      }
      setPdfUrl(json.pdf_url);

      // Auto-trigger download in a new tab — browser will download if it
      // recognizes the PDF content-disposition (or open it inline).
      if (typeof window !== "undefined") {
        window.open(json.pdf_url, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      console.error("[exchange/pdf] generator failed:", err);
      setError("network_error");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 dark:border-amber-900/40 dark:bg-amber-950/10">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xl">📄</span>
        <div>
          <p className="font-semibold text-zinc-900 dark:text-zinc-50">{t("title")}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("description")}</p>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
        ⚠️ {t("disclaimer")}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={handleDownload}
          disabled={generating}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          <FileDown className="h-4 w-4" />
          {generating ? t("generating") : t("download")}
        </button>
        {pdfUrl && !generating && (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 dark:border-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-950/30"
          >
            {t("download")}
          </a>
        )}
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
