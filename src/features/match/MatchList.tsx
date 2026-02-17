"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { formatScore } from "@/lib/utils";
import type { MatchCandidate, MatchTier } from "@/lib/types";
import { Pill } from "@/components/ui";

const SCORE_FACTORS = [
  { key: "category", max: 30 },
  { key: "intent", max: 15 },
  { key: "flexibility", max: 10 },
  { key: "value", max: 15 },
  { key: "location", max: 10 },
  { key: "bundle", max: 5 },
  { key: "subcategory", max: 5 },
  { key: "tags", max: 10 },
  { key: "sentimental", max: 5 },
] as const;

function ScoreBreakdown({ reasons, score, t }: { reasons: string[]; score: number; t: (key: string) => string }) {
  return (
    <div className="mt-3 space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
      <p className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">{t("scoreBreakdown")}</p>
      <div className="space-y-1.5">
        {SCORE_FACTORS.map((factor) => {
          const relevant = reasons.find((r) => {
            const lc = r.toLowerCase();
            switch (factor.key) {
              case "category": return lc.includes("categori") || lc.includes("wishlist");
              case "intent": return lc.includes("intent") || lc.includes("angajament") || lc.includes("asteptari");
              case "flexibility": return lc.includes("flexibil");
              case "value": return lc.includes("valoare");
              case "location": return lc.includes("locati") || lc.includes("logistic");
              case "bundle": return lc.includes("pachet") || lc.includes("bundle");
              case "subcategory": return lc.includes("subcategor") || lc.includes("inrudite");
              case "tags": return lc.includes("tag");
              case "sentimental": return lc.includes("sentiment") || lc.includes("destinatar");
              default: return false;
            }
          });
          const active = !!relevant;
          return (
            <div key={factor.key} className="flex items-center gap-2 text-xs">
              <span className={`w-24 shrink-0 font-medium ${active ? "text-zinc-800 dark:text-zinc-200" : "text-zinc-400 dark:text-zinc-500"}`}>
                {t(`factor_${factor.key}`)}
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                <div
                  className={`h-full rounded-full transition-all ${active ? "bg-blue-500" : "bg-zinc-300 dark:bg-zinc-600"}`}
                  style={{ width: active ? "100%" : "0%" }}
                />
              </div>
              <span className={`w-8 text-right ${active ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400 dark:text-zinc-500"}`}>
                {active ? `+${factor.max}` : "—"}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between border-t border-zinc-200 pt-2 dark:border-zinc-700">
        <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{t("totalScore")}</span>
        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{formatScore(score)}</span>
      </div>
    </div>
  );
}

function ItemThumb({ photo, title }: { photo?: string; title: string }) {
  if (!photo) {
    return (
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 text-xl font-bold text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800">
        {title.charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
      <Image src={photo} alt={title} fill className="object-cover" sizes="64px" unoptimized />
    </div>
  );
}

export type RejectReason = "too_far" | "wrong_category" | "value_mismatch" | "condition" | "not_interested";

const REJECT_REASONS: { key: RejectReason; translationKey: string }[] = [
  { key: "too_far", translationKey: "reasonTooFar" },
  { key: "wrong_category", translationKey: "reasonWrongCategory" },
  { key: "value_mismatch", translationKey: "reasonValueMismatch" },
  { key: "condition", translationKey: "reasonCondition" },
  { key: "not_interested", translationKey: "reasonNotInterested" },
];

export function MatchList({
  matches,
  onAccept,
  onNegotiate,
  onReject,
}: {
  matches: MatchCandidate[];
  onAccept?: (match: MatchCandidate) => void;
  onNegotiate?: (match: MatchCandidate) => void;
  onReject?: (match: MatchCandidate, reason?: RejectReason) => void;
}) {
  const t = useTranslations("matchList");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectedIds, setRejectedIds] = useState<Map<string, RejectReason | undefined>>(new Map());
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [negotiatingId, setNegotiatingId] = useState<string | null>(null);

  const TIER_STYLES: Record<MatchTier, { bg: string; text: string; label: string; ring: string; accent: string }> = {
    weak:     { bg: "bg-red-100 dark:bg-red-950/40",    text: "text-red-800 dark:text-red-200",       label: t("weak"),     ring: "ring-red-200 dark:ring-red-800",       accent: "border-l-red-400" },
    possible: { bg: "bg-amber-100 dark:bg-amber-950/40", text: "text-amber-800 dark:text-amber-200",   label: t("possible"), ring: "ring-amber-200 dark:ring-amber-800",   accent: "border-l-amber-400" },
    good:     { bg: "bg-blue-100 dark:bg-blue-950/40",   text: "text-blue-800 dark:text-blue-200",     label: t("good"),     ring: "ring-blue-200 dark:ring-blue-800",     accent: "border-l-blue-400" },
    strong:   { bg: "bg-green-100 dark:bg-green-950/40", text: "text-green-800 dark:text-green-200",   label: t("veryGood"), ring: "ring-green-200 dark:ring-green-800",   accent: "border-l-green-400" },
  };

  const visibleMatches = matches.filter((m) => !rejectedIds.has(m.id));

  const handleRejectWithReason = (match: MatchCandidate, reason?: RejectReason) => {
    setRejectedIds((prev) => new Map(prev).set(match.id, reason));
    setRejectingId(null);
    onReject?.(match, reason);
  };

  const handleUndoReject = (id: string) => {
    setRejectedIds((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  };

  if (!visibleMatches.length) {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl border border-zinc-200 bg-white/90 p-6 text-center text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300">
          <p className="text-3xl">🔍</p>
          <p className="mt-2 font-medium">{t("noMatches")}</p>
        </div>
        {rejectedIds.size > 0 ? (
          <div className="flex items-center gap-2 rounded-xl bg-zinc-50 p-3 text-xs dark:bg-zinc-800/50">
            <span className="text-zinc-500">{t("rejectedCount", { count: rejectedIds.size })}</span>
            <button
              type="button"
              onClick={() => setRejectedIds(new Map())}
              className="font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400"
            >
              {t("undoAll")}
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {visibleMatches.map((match) => {
        const tier = match.tier ?? "possible";
        const style = TIER_STYLES[tier];
        const isExpanded = expandedId === match.id;
        const offeredPhoto = match.itemOffered.photos?.[0];
        const requestedPhoto = match.itemRequested.photos?.[0];

        return (
          <div
            key={match.id}
            className={`rounded-2xl border-l-4 bg-white/90 shadow-sm transition-all dark:bg-zinc-900/80 ${style.accent} ${
              isExpanded ? `ring-2 ${style.ring}` : ""
            }`}
          >
            {/* Proposal header with score */}
            <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-2 dark:border-zinc-800">
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{t("swapProposal")}</span>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${style.bg} ${style.text}`}>
                  {style.label}
                </span>
                <Pill color="blue">{formatScore(match.compatibilityScore)}</Pill>
              </div>
            </div>

            {/* Two-column: Ce primesc / Ce ofer */}
            <div className="grid gap-0 sm:grid-cols-2">
              {/* Ce ofer (my item) */}
              <div className="flex items-center gap-3 border-b border-zinc-100 p-4 sm:border-b-0 sm:border-r dark:border-zinc-800">
                <ItemThumb photo={offeredPhoto} title={match.itemOffered.title} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase text-zinc-400">{t("iOffer")}</p>
                  <h3 className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-50">
                    {match.itemOffered.title}
                  </h3>
                  <p className="truncate text-xs text-zinc-500">
                    {match.itemOffered.category} · {match.itemOffered.condition}
                  </p>
                </div>
              </div>

              {/* Ce primesc (their item) */}
              <div className="flex items-center gap-3 p-4">
                <ItemThumb photo={requestedPhoto} title={match.itemRequested.title} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase text-emerald-600 dark:text-emerald-400">{t("iGet")}</p>
                  <h3 className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-50">
                    {match.itemRequested.title}
                  </h3>
                  <p className="truncate text-xs text-zinc-500">
                    {match.itemRequested.category} · {match.itemRequested.condition}
                    {match.itemRequested.location ? ` · ${match.itemRequested.location}` : ""}
                  </p>
                </div>
              </div>
            </div>

            {/* Inline top factors + reasons */}
            <div className="border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
              {/* Inline top factors (always visible) */}
              <div className="mb-2 flex flex-wrap gap-1.5">
                {SCORE_FACTORS.filter((factor) => {
                  const reasons = match.reasons ?? [];
                  return reasons.some((r) => {
                    const lc = r.toLowerCase();
                    switch (factor.key) {
                      case "category": return lc.includes("categori") || lc.includes("wishlist");
                      case "intent": return lc.includes("intent") || lc.includes("angajament") || lc.includes("asteptari");
                      case "flexibility": return lc.includes("flexibil");
                      case "value": return lc.includes("valoare");
                      case "location": return lc.includes("locati") || lc.includes("logistic");
                      default: return false;
                    }
                  });
                }).slice(0, 3).map((factor) => (
                  <span
                    key={factor.key}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${style.bg} ${style.text}`}
                  >
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                    {t(`factor_${factor.key}`)} +{factor.max}
                  </span>
                ))}
              </div>

              <p className="mb-1 text-xs font-semibold uppercase text-zinc-400">{t("whyMatch")}</p>
              <ul className="space-y-1">
                {(match.reasons ?? []).slice(0, 3).map((r, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                    <span className="mt-0.5 shrink-0 text-green-600 dark:text-green-400">&#10003;</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>

              {match.aiTrace ? (
                <p className="mt-1 text-xs text-blue-700 dark:text-blue-200">
                  {t("aiTrace")} {match.aiTrace}
                </p>
              ) : null}

              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : match.id)}
                className="mt-1 text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
              >
                {isExpanded ? t("hideDetails") : t("showDetails")}
              </button>

              {isExpanded ? (
                <ScoreBreakdown reasons={match.reasons ?? []} score={match.compatibilityScore} t={t} />
              ) : null}
            </div>

            {/* 3 Action buttons: ACCEPT / NEGOCIAZA / RESPINGE */}
            <div className="flex border-t border-zinc-100 dark:border-zinc-800">
              {onAccept ? (
                <button
                  type="button"
                  onClick={() => onAccept(match)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-bl-2xl py-3 text-xs font-bold uppercase tracking-wide text-emerald-700 transition hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                >
                  <span>&#10003;</span> {t("accept")}
                </button>
              ) : null}
              {onNegotiate ? (
                <button
                  type="button"
                  onClick={() => setNegotiatingId(negotiatingId === match.id ? null : match.id)}
                  className="flex flex-1 items-center justify-center gap-1.5 border-x border-zinc-100 py-3 text-xs font-bold uppercase tracking-wide text-blue-700 transition hover:bg-blue-50 dark:border-zinc-800 dark:text-blue-400 dark:hover:bg-blue-950/30"
                >
                  <span>&#9998;</span> {t("negotiate")}
                </button>
              ) : null}
              {onReject ? (
                <div className="relative flex flex-1">
                  <button
                    type="button"
                    onClick={() => setRejectingId(rejectingId === match.id ? null : match.id)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-br-2xl py-3 text-xs font-bold uppercase tracking-wide text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                  >
                    <span>&#10005;</span> {t("reject")}
                  </button>
                  {/* Reject reason popup */}
                  {rejectingId === match.id && (
                    <div className="absolute bottom-full right-0 z-10 mb-1 w-48 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                      <p className="mb-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">{t("rejectReason")}</p>
                      <div className="space-y-1">
                        {REJECT_REASONS.map((r) => (
                          <button
                            key={r.key}
                            type="button"
                            onClick={() => handleRejectWithReason(match, r.key)}
                            className="flex w-full items-center rounded-lg px-2.5 py-1.5 text-left text-xs text-zinc-700 transition hover:bg-red-50 dark:text-zinc-300 dark:hover:bg-red-950/30"
                          >
                            {t(r.translationKey as Parameters<typeof t>[0])}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleRejectWithReason(match)}
                          className="flex w-full items-center rounded-lg px-2.5 py-1.5 text-left text-xs text-zinc-400 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        >
                          {t("reasonSkip")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Counter-offers panel */}
            {negotiatingId === match.id && (
              <div className="border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{t("counterOffers")}</p>
                <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">{t("counterOffersDesc")}</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800/50">
                    <span className="text-xs text-zinc-700 dark:text-zinc-300">{t("counterAddItem")}</span>
                    <button
                      type="button"
                      onClick={() => onNegotiate?.(match)}
                      className="rounded-full bg-blue-600 px-3 py-1 text-[10px] font-semibold text-white transition hover:bg-blue-700"
                    >
                      {t("applyCounter")}
                    </button>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800/50">
                    <span className="text-xs text-zinc-700 dark:text-zinc-300">{t("counterChangeDelivery")}</span>
                    <button
                      type="button"
                      onClick={() => onNegotiate?.(match)}
                      className="rounded-full bg-blue-600 px-3 py-1 text-[10px] font-semibold text-white transition hover:bg-blue-700"
                    >
                      {t("applyCounter")}
                    </button>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800/50">
                    <span className="text-xs text-zinc-700 dark:text-zinc-300">{t("counterTimeWindow")}</span>
                    <button
                      type="button"
                      onClick={() => onNegotiate?.(match)}
                      className="rounded-full bg-blue-600 px-3 py-1 text-[10px] font-semibold text-white transition hover:bg-blue-700"
                    >
                      {t("applyCounter")}
                    </button>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800/50">
                    <span className="text-xs text-zinc-700 dark:text-zinc-300">{t("counterBundleOffer")}</span>
                    <button
                      type="button"
                      onClick={() => onNegotiate?.(match)}
                      className="rounded-full bg-blue-600 px-3 py-1 text-[10px] font-semibold text-white transition hover:bg-blue-700"
                    >
                      {t("applyCounter")}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {rejectedIds.size > 0 ? (
        <div className="flex items-center justify-between rounded-xl bg-zinc-50 p-3 text-xs dark:bg-zinc-800/50">
          <span className="text-zinc-500 dark:text-zinc-400">
            {t("rejectedCount", { count: rejectedIds.size })}
          </span>
          <div className="flex gap-2">
            {Array.from(rejectedIds.keys()).slice(-3).map((id) => {
              const m = matches.find((match) => match.id === id);
              return m ? (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleUndoReject(id)}
                  className="rounded-full bg-zinc-200 px-2.5 py-1 font-medium text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
                >
                  {t("undo")} {m.itemRequested.title.slice(0, 15)}
                </button>
              ) : null;
            })}
            <button
              type="button"
              onClick={() => setRejectedIds(new Map())}
              className="font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400"
            >
              {t("undoAll")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
