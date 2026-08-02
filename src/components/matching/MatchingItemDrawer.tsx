"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { SafeImage } from "@/components/SafeImage";
import { NO_IMAGE_URL } from "@/lib/storage";
import type { ScoredCandidate } from "./MatchingPage";

interface Props {
  candidate: ScoredCandidate | null;
  canExpressInterest: boolean;
  onClose: () => void;
  onExpressInterest: (candidate: ScoredCandidate) => void;
}

export default function MatchingItemDrawer({
  candidate,
  canExpressInterest,
  onClose,
  onExpressInterest,
}: Props) {
  const t = useTranslations("matching");
  const isOpen = candidate !== null;

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  return (
    <div
      className={`fixed inset-0 z-40 transition-opacity duration-200 ${
        isOpen
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!isOpen}
    >
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <aside
        role="dialog"
        aria-modal={isOpen ? "true" : undefined}
        data-testid={
          candidate ? `matching-item-drawer-${candidate.item.id}` : undefined
        }
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-200 dark:bg-zinc-900 ${
          isOpen
            ? "pointer-events-auto translate-x-0"
            : "pointer-events-none translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {candidate?.item.title ?? ""}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label={t("ignore")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {candidate && (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="relative mb-4 aspect-[4/3] w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
              <SafeImage
                src={candidate.item.photos?.[0] || NO_IMAGE_URL}
                alt={candidate.item.title}
                fill
                className="object-cover"
                sizes="(min-width: 768px) 400px, 100vw"
                unoptimized={!candidate.item.photos?.[0]}
              />
            </div>

            <div className="mb-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/60">
              <p className="mb-2 text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                {t("score_detail")}
              </p>
              <ScoreRow
                label={t("score_category")}
                value={candidate.breakdown.categoryMatch}
              />
              <ScoreRow
                label={t("score_value")}
                value={candidate.breakdown.valueMatch}
              />
              <ScoreRow
                label={t("score_geo")}
                value={candidate.breakdown.geoScore}
              />
              <ScoreRow
                label={t("score_trust")}
                value={candidate.breakdown.trustScore}
              />
              <ScoreRow
                label={t("score_activity")}
                value={candidate.breakdown.activityScore}
              />
              <ScoreRow
                label={t("score_total")}
                value={candidate.breakdown.total}
                emphasize
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                {t("ignore")}
              </button>
              <button
                type="button"
                data-testid={`express-interest-submit-${candidate.item.id}`}
                onClick={() => onExpressInterest(candidate)}
                disabled={!canExpressInterest}
                className="flex-1 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:disabled:bg-zinc-700"
              >
                {canExpressInterest
                  ? t("express_interest")
                  : t("slot_add")}
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

function ScoreRow({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: number;
  emphasize?: boolean;
}) {
  const rounded = Math.round(value);
  return (
    <div
      className={`flex items-center justify-between py-0.5 text-xs ${
        emphasize
          ? "mt-1 border-t border-zinc-200 pt-2 font-semibold text-zinc-900 dark:border-zinc-700 dark:text-zinc-50"
          : "text-zinc-600 dark:text-zinc-300"
      }`}
    >
      <span>{label}</span>
      <span className="tabular-nums">{rounded}%</span>
    </div>
  );
}
