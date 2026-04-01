"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { SafeImage } from "@/components/SafeImage";
import { formatScore } from "@/lib/utils";
import type { MatchCandidate, MatchTier } from "@/lib/types";
import { Pill } from "@/components/ui-custom";
import { TrustBadge } from "@/components/trust/TrustBadge";
import { calculateTrustScore } from "@/lib/utils/trustScore";
import type { UserProfile } from "@/lib/types";
import { Columns2, Sparkles, Loader2, ChevronDown } from "lucide-react";
import { MatchExplanationPanel } from "./MatchExplanationPanel";
import type { NearMatchSuggestion } from "@/lib/types";
import { useInlineTranslation } from "@/components/TranslateButton";

const PAGE_SIZE = 5;

/** Build a minimal UserProfile stub for trust scoring from item data alone */
function stubUser(ownerId: string): UserProfile {
  return {
    id: ownerId,
    email: "verified@example.com", // assume email exists
    displayName: "",
    languages: ["en"],
    badge: "free",
    location: undefined,
    visibility: { publicProfile: true, itemsVisibility: "public", showExactLocation: false, showLastSeen: false },
    notifications: { email: true, push: true, chat: true, matches: true, swapUpdates: true },
    swapPreferences: { logistics: "flexible" },
    security: { twoFactorEnabled: false, method: null, passkeysEnabled: false },
    stats: { tokens: 0, reputation: "starter", completedSwaps: 0, activeListings: 1 },
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // default 60 days
  };
}

/** Factor labels for the legacy breakdown (kept for backward compatibility) */
const LEGACY_SCORE_FACTORS = [
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

/** 9-factor weighted labels */
const WEIGHTED_FACTOR_LABELS: Record<string, { icon: string; translationKey: string }> = {
  semantic:    { icon: "🧠", translationKey: "factor_semantic" },
  category:    { icon: "🏷️", translationKey: "factor_category" },
  location:    { icon: "📍", translationKey: "factor_location" },
  value:       { icon: "⚖️", translationKey: "factor_value" },
  userRating:  { icon: "⭐", translationKey: "factor_userRating" },
  response:    { icon: "💬", translationKey: "factor_response" },
  photos:      { icon: "📷", translationKey: "factor_photos" },
  description: { icon: "📝", translationKey: "factor_description" },
  activity:    { icon: "🟢", translationKey: "factor_activity" },
};

/** Visual score badge with progress ring */
function MatchScoreBadge({ score, tooltipLines }: { score: number; tooltipLines?: string[] }) {
  const color = score >= 85 ? "text-green-600 dark:text-green-400"
    : score >= 70 ? "text-blue-600 dark:text-blue-400"
    : score >= 40 ? "text-amber-600 dark:text-amber-400"
    : "text-red-600 dark:text-red-400";

  const barColor = score >= 85 ? "bg-green-500"
    : score >= 70 ? "bg-blue-500"
    : score >= 40 ? "bg-amber-500"
    : "bg-red-500";

  return (
    <div className="group relative flex items-center gap-2">
      <span className={`text-lg font-black tabular-nums ${color}`}>{score}%</span>
      <div className="h-2.5 w-20 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
        <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${Math.min(100, score)}%` }} />
      </div>
      {tooltipLines && tooltipLines.length > 0 && (
        <div className="pointer-events-none absolute bottom-full left-0 z-20 mb-2 hidden w-56 rounded-lg border border-zinc-200 bg-white p-2.5 text-xs shadow-lg group-hover:block dark:border-zinc-700 dark:bg-zinc-900">
          {tooltipLines.map((line, i) => (
            <p key={i} className="text-zinc-700 dark:text-zinc-300">{line}</p>
          ))}
        </div>
      )}
    </div>
  );
}

/** Weighted 9-factor score breakdown (pgvector-enhanced) */
function WeightedScoreBreakdown({ factors, total, t }: {
  factors: Array<{ key: string; raw: number; weighted: number; label: string }>;
  total: number;
  t: (key: string) => string;
}) {
  return (
    <div className="mt-3 space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
      <p className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">{t("scoreBreakdown")}</p>
      <div className="space-y-1.5">
        {factors.map((f) => {
          const meta = WEIGHTED_FACTOR_LABELS[f.key];
          const pct = Math.round(f.raw * 100);
          const barColor = f.raw >= 0.7 ? "bg-green-500" : f.raw >= 0.4 ? "bg-blue-500" : "bg-zinc-400";
          return (
            <div key={f.key} className="flex items-center gap-2 text-xs">
              <span className="w-5 shrink-0 text-center">{meta?.icon ?? "·"}</span>
              <span className="w-24 shrink-0 font-medium text-zinc-700 dark:text-zinc-300">
                {t(meta?.translationKey ?? `factor_${f.key}`)}
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
              </div>
              <span className="w-10 text-right text-zinc-500 dark:text-zinc-400">{pct}%</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between border-t border-zinc-200 pt-2 dark:border-zinc-700">
        <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{t("totalScore")}</span>
        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{formatScore(total)}</span>
      </div>
    </div>
  );
}

/** Legacy score breakdown (used when weighted data is not available) */
function ScoreBreakdown({ reasons, score, t }: { reasons: string[]; score: number; t: (key: string) => string }) {
  return (
    <div className="mt-3 space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
      <p className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">{t("scoreBreakdown")}</p>
      <div className="space-y-1.5">
        {LEGACY_SCORE_FACTORS.map((factor) => {
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
                <div className={`h-full rounded-full transition-all ${active ? "bg-blue-500" : "bg-zinc-300 dark:bg-zinc-600"}`} style={{ width: active ? "100%" : "0%" }} />
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
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 text-lg font-bold text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800">
        {title.charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
      <SafeImage src={photo} alt={title} fill className="object-cover" sizes="56px" unoptimized />
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
  onAiAnalyze,
  onApplySuggestion,
}: {
  matches: MatchCandidate[];
  onAccept?: (match: MatchCandidate) => void;
  onNegotiate?: (match: MatchCandidate) => void;
  onReject?: (match: MatchCandidate, reason?: RejectReason) => void;
  onAiAnalyze?: (matchId: string) => Promise<void>;
  onApplySuggestion?: (matchId: string, suggestion: NearMatchSuggestion) => void;
}) {
  const t = useTranslations("matchList");
  const { getText } = useInlineTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [compareId, setCompareId] = useState<string | null>(null);
  const [rejectedIds, setRejectedIds] = useState<Map<string, RejectReason | undefined>>(new Map());
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [negotiatingId, setNegotiatingId] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const TIER_STYLES: Record<MatchTier, { bg: string; text: string; label: string; ring: string; accent: string }> = {
    weak:     { bg: "bg-red-100 dark:bg-red-950/40",    text: "text-red-800 dark:text-red-200",       label: t("weak"),     ring: "ring-red-200 dark:ring-red-800",       accent: "border-l-red-400" },
    possible: { bg: "bg-amber-100 dark:bg-amber-950/40", text: "text-amber-800 dark:text-amber-200",   label: t("possible"), ring: "ring-amber-200 dark:ring-amber-800",   accent: "border-l-amber-400" },
    good:     { bg: "bg-blue-100 dark:bg-blue-950/40",   text: "text-blue-800 dark:text-blue-200",     label: t("good"),     ring: "ring-blue-200 dark:ring-blue-800",     accent: "border-l-blue-400" },
    strong:   { bg: "bg-green-100 dark:bg-green-950/40", text: "text-green-800 dark:text-green-200",   label: t("veryGood"), ring: "ring-green-200 dark:ring-green-800",   accent: "border-l-green-400" },
  };

  const visibleMatches = matches.filter((m) => !rejectedIds.has(m.id));
  const paginatedMatches = visibleMatches.slice(0, visibleCount);
  const hasMore = visibleCount < visibleMatches.length;

  const handleRejectWithReason = (match: MatchCandidate, reason?: RejectReason) => {
    setRejectedIds((prev) => new Map(prev).set(match.id, reason));
    setRejectingId(null);
    onReject?.(match, reason);
  };

  const handleAiAnalyze = useCallback(async (matchId: string) => {
    if (!onAiAnalyze || analyzingId) return;
    setAnalyzingId(matchId);
    try { await onAiAnalyze(matchId); } finally { setAnalyzingId(null); }
  }, [onAiAnalyze, analyzingId]);

  if (!visibleMatches.length) {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl border border-zinc-200 bg-white/90 p-6 text-center text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300">
          <p className="text-3xl">🔍</p>
          <p className="mt-2 font-medium">{t("noMatches")}</p>
        </div>
        {rejectedIds.size > 0 && (
          <div className="flex items-center gap-2 rounded-xl bg-zinc-50 p-3 text-xs dark:bg-zinc-800/50">
            <span className="text-zinc-500">{t("rejectedCount", { count: rejectedIds.size })}</span>
            <button type="button" onClick={() => setRejectedIds(new Map())} className="font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400">{t("undoAll")}</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {paginatedMatches.map((match) => {
        const tier = match.tier ?? "possible";
        const style = TIER_STYLES[tier];
        const isExpanded = expandedId === match.id;
        const offeredPhoto = match.itemOffered.photos?.[0];
        const requestedPhoto = match.itemRequested.photos?.[0];
        const isAnalyzing = analyzingId === match.id;
        const hybridScore = match.aiAnalyzed ? Math.min(100, Math.max(0, match.compatibilityScore + (match.aiScoreBoost ?? 0))) : match.compatibilityScore;
        const trustResult = calculateTrustScore(stubUser(match.itemRequested.ownerId), match.itemRequested, []);

        return (
          <div key={match.id} className={`rounded-2xl border-l-4 bg-white/90 shadow-sm transition-all dark:bg-zinc-900/80 ${style.accent} ${isExpanded ? `ring-2 ${style.ring}` : ""}`}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-2 dark:border-zinc-800">
              <MatchScoreBadge score={hybridScore} tooltipLines={match.weightedScore?.tooltipLines} />
              <div className="flex items-center gap-2">
                {match.semanticScore !== undefined && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                    🧠 pgvector
                  </span>
                )}
                {match.aiAnalyzed && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                    <Sparkles className="h-3 w-3" />AI
                  </span>
                )}
                <TrustBadge result={trustResult} />
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${style.bg} ${style.text}`}>{style.label}</span>
                <Pill color="blue">{formatScore(hybridScore)}</Pill>
              </div>
            </div>

            {/* Items */}
            <div className="grid gap-0 sm:grid-cols-2">
              <div className="flex items-center gap-3 border-b border-zinc-100 p-3 sm:border-b-0 sm:border-r dark:border-zinc-800">
                <ItemThumb photo={offeredPhoto} title={match.itemOffered.title} />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase text-zinc-400">{t("iOffer")}</p>
                  <h3 className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-50">{getText(`offer-${match.id}`, match.itemOffered.title)}</h3>
                  <p className="truncate text-xs text-zinc-500">{match.itemOffered.category} · {match.itemOffered.condition}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3">
                <ItemThumb photo={requestedPhoto} title={match.itemRequested.title} />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase text-emerald-600 dark:text-emerald-400">{t("iGet")}</p>
                  <h3 className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-50">{getText(`req-${match.id}`, match.itemRequested.title)}</h3>
                  <p className="truncate text-xs text-zinc-500">{match.itemRequested.category} · {match.itemRequested.condition}{match.itemRequested.location ? ` · ${match.itemRequested.location}` : ""}</p>
                </div>
              </div>
            </div>

            {/* Tradeometer */}
            <div className="border-t border-zinc-100 px-4 py-2 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase text-zinc-400">{t("fairness")}</span>
                <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-gradient-to-r from-red-300 via-amber-300 to-green-400 dark:from-red-800 dark:via-amber-700 dark:to-green-600">
                  <div className="absolute top-0 h-full w-1 rounded-full bg-zinc-900 shadow dark:bg-white" style={{ left: `${Math.min(100, Math.max(0, hybridScore))}%` }} />
                </div>
                <span className={`text-[10px] font-bold ${hybridScore >= 70 ? "text-green-600 dark:text-green-400" : hybridScore >= 40 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
                  {hybridScore >= 70 ? t("fairnessGood") : hybridScore >= 40 ? t("fairnessOk") : t("fairnessLow")}
                </span>
              </div>
            </div>

            {/* AI Summary */}
            {match.aiAnalyzed && match.aiSummary && (
              <div className="border-t border-violet-200 bg-violet-50/50 px-4 py-2 dark:border-violet-800 dark:bg-violet-950/20">
                <div className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-600 dark:text-violet-400" />
                  <p className="text-xs text-violet-800 dark:text-violet-200">{match.aiSummary}</p>
                </div>
                {match.aiProvider && <p className="mt-0.5 text-[9px] text-violet-400">{t("aiPoweredBy")} {match.aiProvider}</p>}
              </div>
            )}

            {/* Reasons + links */}
            <div className="border-t border-zinc-100 px-4 py-2 dark:border-zinc-800">
              <ul className="space-y-0.5">
                {(match.reasons ?? []).slice(0, 3).map((r, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                    <span className="mt-0.5 shrink-0 text-green-600 dark:text-green-400">&#10003;</span><span>{r}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" onClick={() => setExpandedId(isExpanded ? null : match.id)} className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400">
                  {isExpanded ? t("hideDetails") : t("showDetails")}
                </button>
                <button type="button" onClick={() => setCompareId(compareId === match.id ? null : match.id)} className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-800 dark:text-violet-400">
                  <Columns2 className="h-3 w-3" />{t("compare")}
                </button>
                {onAiAnalyze && !match.aiAnalyzed && (
                  <button type="button" onClick={() => void handleAiAnalyze(match.id)} disabled={isAnalyzing} className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-bold text-violet-700 transition hover:bg-violet-200 disabled:opacity-50 dark:bg-violet-900/40 dark:text-violet-300">
                    {isAnalyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    {t("aiAnalyze")}
                  </button>
                )}
              </div>
              {isExpanded && (
                match.weightedScore ? (
                  <WeightedScoreBreakdown factors={match.weightedScore.factors} total={match.weightedScore.total} t={t} />
                ) : match.matchExplanation ? (
                  <MatchExplanationPanel
                    explanation={{ ...match.matchExplanation, score: hybridScore }}
                    distanceKm={match.distanceKm}
                    onApplySuggestion={onApplySuggestion ? (s) => onApplySuggestion(match.id, s) : undefined}
                  />
                ) : (
                  <ScoreBreakdown reasons={match.reasons ?? []} score={hybridScore} t={t} />
                )
              )}
              {compareId === match.id && (
                <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl border border-violet-200 bg-violet-50/50 p-3 dark:border-violet-800 dark:bg-violet-950/20">
                  {[
                    { label: t("iOffer"), item: match.itemOffered, photo: offeredPhoto },
                    { label: t("iGet"), item: match.itemRequested, photo: requestedPhoto },
                  ].map((side) => (
                    <div key={side.label} className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-violet-600 dark:text-violet-300">{side.label}</p>
                      {side.photo && (
                        <div className="relative aspect-square overflow-hidden rounded-lg">
                          <SafeImage src={side.photo} alt={side.item.title} fill className="object-cover" sizes="150px" unoptimized />
                        </div>
                      )}
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">{side.item.title}</p>
                      <p className="text-[10px] text-zinc-500">{side.item.category} · {side.item.condition}</p>
                      {side.item.location && <p className="text-[10px] text-zinc-400">{side.item.location}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex border-t border-zinc-100 dark:border-zinc-800">
              {onAccept && (
                <button type="button" onClick={() => onAccept(match)} className="flex flex-1 items-center justify-center gap-1.5 rounded-bl-2xl py-2.5 text-xs font-bold uppercase tracking-wide text-emerald-700 transition hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30">
                  <span>&#10003;</span> {t("accept")}
                </button>
              )}
              {onNegotiate && (
                <button type="button" onClick={() => setNegotiatingId(negotiatingId === match.id ? null : match.id)} className="flex flex-1 items-center justify-center gap-1.5 border-x border-zinc-100 py-2.5 text-xs font-bold uppercase tracking-wide text-blue-700 transition hover:bg-blue-50 dark:border-zinc-800 dark:text-blue-400 dark:hover:bg-blue-950/30">
                  <span>&#9998;</span> {t("negotiate")}
                </button>
              )}
              {onReject && (
                <div className="relative flex flex-1">
                  <button type="button" onClick={() => setRejectingId(rejectingId === match.id ? null : match.id)} className="flex flex-1 items-center justify-center gap-1.5 rounded-br-2xl py-2.5 text-xs font-bold uppercase tracking-wide text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30">
                    <span>&#10005;</span> {t("reject")}
                  </button>
                  {rejectingId === match.id && (
                    <div className="absolute bottom-full right-0 z-10 mb-1 w-48 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                      <p className="mb-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">{t("rejectReason")}</p>
                      <div className="space-y-1">
                        {REJECT_REASONS.map((r) => (
                          <button key={r.key} type="button" onClick={() => handleRejectWithReason(match, r.key)} className="flex w-full items-center rounded-lg px-2.5 py-1.5 text-left text-xs text-zinc-700 transition hover:bg-red-50 dark:text-zinc-300 dark:hover:bg-red-950/30">
                            {t(r.translationKey as Parameters<typeof t>[0])}
                          </button>
                        ))}
                        <button type="button" onClick={() => handleRejectWithReason(match)} className="flex w-full items-center rounded-lg px-2.5 py-1.5 text-left text-xs text-zinc-400 transition hover:bg-zinc-100 dark:hover:bg-zinc-800">{t("reasonSkip")}</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {negotiatingId === match.id && (
              <div className="border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{t("counterOffers")}</p>
                <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">{t("counterOffersDesc")}</p>
                <div className="space-y-2">
                  {(["counterAddItem", "counterChangeDelivery", "counterTimeWindow", "counterBundleOffer"] as const).map((key) => (
                    <div key={key} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800/50">
                      <span className="text-xs text-zinc-700 dark:text-zinc-300">{t(key)}</span>
                      <button type="button" onClick={() => onNegotiate?.(match)} className="rounded-full bg-blue-600 px-3 py-1 text-[10px] font-semibold text-white transition hover:bg-blue-700">{t("applyCounter")}</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Load more */}
      {hasMore && (
        <button type="button" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white py-3 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-blue-400 dark:hover:bg-zinc-700">
          <ChevronDown className="h-4 w-4" />
          {t("loadMore")} ({visibleMatches.length - visibleCount} {t("remaining")})
        </button>
      )}

      {rejectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-xl bg-zinc-50 p-3 text-xs dark:bg-zinc-800/50">
          <span className="text-zinc-500 dark:text-zinc-400">{t("rejectedCount", { count: rejectedIds.size })}</span>
          <button type="button" onClick={() => setRejectedIds(new Map())} className="font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400">{t("undoAll")}</button>
        </div>
      )}
    </div>
  );
}
