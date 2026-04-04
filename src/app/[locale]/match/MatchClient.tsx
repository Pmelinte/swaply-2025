"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { MatchList } from "@/features/match/MatchList";
import type { RejectReason } from "@/features/match/MatchList";
import { CTAButton, NextStepRecommendation, SectionCard, StateShowcase } from "@/components/ui-custom";
import { MapEmbed } from "@/components/maps/MapEmbed";
import type { MatchCandidate, MatchTier } from "@/lib/types";
import { SlidersHorizontal, Sparkles, Hand, X } from "lucide-react";
import { NearMatchSuggestions } from "@/features/match/NearMatchSuggestions";
import type { NearMatchSuggestion } from "@/lib/types";
import { ChainVisualization } from "@/features/chains/ChainVisualization";
import { ChainOpportunities } from "@/features/chains/ChainOpportunities";
import type { DetectedChainOpportunity } from "@/lib/state/useSwapChains";

type SortOption = "score" | "category" | "location";

const CATEGORIES = [
  "Electronics", "Books", "Clothing", "Sports", "Home", "Garden",
  "Toys", "Art", "Music", "Vehicles", "Tools", "Other",
];

export function MatchClient({ serverAuthenticated = true }: { serverAuthenticated?: boolean }) {
  const router = useRouter();
  const {
    user, loading, matches: rawMatches, featureToggles, proposeSwap, trackEvent,
    myChains, detectedChainOpportunities, detectingChains,
    createChain, confirmChainLink, startChain, completeChain, cancelChain, detectChains,
  } = useAppState();
  const [localMatches, setLocalMatches] = useState<MatchCandidate[]>([]);
  const [matchesInitialized, setMatchesInitialized] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [tierFilter, setTierFilter] = useState<MatchTier | "all">("all");
  const [sortBy, setSortBy] = useState<SortOption>("score");
  const [showDealbreakers, setShowDealbreakers] = useState(false);
  const [minCondition, setMinCondition] = useState<"any" | "new" | "good" | "used">("any");
  const [excludedCategories, setExcludedCategories] = useState<Set<string>>(new Set());
  const [minScore, setMinScore] = useState(0);
  const [, setRejectionLog] = useState<Array<{ matchId: string; reason?: RejectReason; timestamp: number }>>([]);
  const [strictnessThreshold, setStrictnessThreshold] = useState(0);
  const [maxDistanceKm, setMaxDistanceKm] = useState(0);
  const [swapTypeFilter, setSwapTypeFilter] = useState<"all" | "local" | "courier" | "vacation" | "service">("all");
  const t = useTranslations("match");
  const tc = useTranslations("common");

  // Initialize localMatches from rawMatches on first load
  useEffect(() => {
    if (!matchesInitialized && rawMatches.length > 0) {
      // Syncing external data into local state on mount is a valid pattern
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMatchesInitialized(true);
       
      setLocalMatches(rawMatches);
    }
  }, [matchesInitialized, rawMatches]);

  // Keep localMatches in sync with rawMatches (preserving AI enrichments)
  const matches = useMemo(() => {
    if (!matchesInitialized) return rawMatches;
    // Merge: new raw matches get added, existing ones keep AI data
    const aiMap = new Map(localMatches.filter((m) => m.aiAnalyzed).map((m) => [m.id, m]));
    return rawMatches.map((rm) => aiMap.get(rm.id) ?? rm);
  }, [rawMatches, localMatches, matchesInitialized]);

  const handleAiAnalyze = useCallback(async (matchId: string) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;
    trackEvent("ai_match_analyze", { matchId, baseScore: match.compatibilityScore });
    try {
      const res = await fetch("/api/ai/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offeredItem: {
            title: match.itemOffered.title,
            category: match.itemOffered.category,
            condition: match.itemOffered.condition,
            description: match.itemOffered.description,
            wishlist: match.itemOffered.wishlist,
            tags: match.itemOffered.userFinalTags ?? match.itemOffered.aiSuggestedTags,
            location: match.itemOffered.location,
            perceivedValue: match.itemOffered.perceivedValue,
          },
          requestedItem: {
            title: match.itemRequested.title,
            category: match.itemRequested.category,
            condition: match.itemRequested.condition,
            description: match.itemRequested.description,
            wishlist: match.itemRequested.wishlist,
            tags: match.itemRequested.userFinalTags ?? match.itemRequested.aiSuggestedTags,
            location: match.itemRequested.location,
            perceivedValue: match.itemRequested.perceivedValue,
          },
          baseScore: match.compatibilityScore,
          reasons: match.reasons,
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setLocalMatches((prev) => {
        const idx = prev.findIndex((m) => m.id === matchId);
        if (idx === -1) {
          // Not yet in local — add the enriched version
          return [...prev, { ...match, aiAnalyzed: true, aiScoreBoost: data.aiScoreBoost, aiSummary: data.aiSummary, aiConfidence: data.aiConfidence, aiProvider: data.provider }];
        }
        const updated = [...prev];
        updated[idx] = { ...updated[idx], aiAnalyzed: true, aiScoreBoost: data.aiScoreBoost, aiSummary: data.aiSummary, aiConfidence: data.aiConfidence, aiProvider: data.provider };
        return updated;
      });
      trackEvent("ai_match_result", { matchId, boost: data.aiScoreBoost, confidence: data.aiConfidence, provider: data.provider });
    } catch {
      // Silently fail — user sees no AI badge
    }
  }, [matches, trackEvent]);

  // Apply dealbreakers to matches
  const dealbrokenMatches = useMemo(() => {
    const conditionRank = { new: 3, good: 2, used_good: 2, used: 1 } as const;
    return matches.filter((m) => {
      // Condition filter
      if (minCondition !== "any") {
        const itemCond = m.itemRequested.condition;
        if (conditionRank[itemCond] < conditionRank[minCondition as keyof typeof conditionRank]) return false;
      }
      // Category exclusion
      if (excludedCategories.size > 0 && excludedCategories.has(m.itemRequested.category)) return false;
      // Min score
      if (minScore > 0 && m.compatibilityScore < minScore) return false;
      // Strictness threshold
      if (strictnessThreshold > 0 && m.compatibilityScore < strictnessThreshold) return false;
      return true;
    });
  }, [matches, minCondition, excludedCategories, minScore, strictnessThreshold]);

  const dealbrokenCount = matches.length - dealbrokenMatches.length;

  // Top 3 AI-recommended matches (best compatibility, after dealbreakers)
  const topPicks = useMemo(() => dealbrokenMatches.slice(0, 3), [dealbrokenMatches]);

  // Map center: user city, or first match location, or fallback
  const mapCenter = useMemo(() => {
    if (user?.location?.city) {
      return `${user.location.city}${user.location.country ? `, ${user.location.country}` : ""}`;
    }
    // Fallback: use the first match's item location
    for (const m of matches) {
      if (m.itemRequested.location) return m.itemRequested.location;
      if (m.itemOffered.location) return m.itemOffered.location;
    }
    return null;
  }, [user, matches]);

  const tierCounts = useMemo(() => {
    const counts = { all: dealbrokenMatches.length, weak: 0, possible: 0, good: 0, strong: 0 };
    for (const m of dealbrokenMatches) counts[m.tier] = (counts[m.tier] ?? 0) + 1;
    return counts;
  }, [dealbrokenMatches]);

  const filteredAndSorted = useMemo(() => {
    let result = tierFilter === "all" ? dealbrokenMatches : dealbrokenMatches.filter((m) => m.tier === tierFilter);
    if (manualMode) result = result.slice(0, 1);

    if (sortBy === "category") {
      result = [...result].sort((a, b) => a.itemRequested.category.localeCompare(b.itemRequested.category));
    } else if (sortBy === "location") {
      result = [...result].sort((a, b) => (a.itemRequested.location ?? "").localeCompare(b.itemRequested.location ?? ""));
    }
    return result;
  }, [dealbrokenMatches, tierFilter, sortBy, manualMode]);

  // Skip auth spinner when server already resolved auth status
  if (loading.auth && serverAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-zinc-400 dark:text-zinc-500">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-500 dark:border-zinc-600 dark:border-t-blue-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <SectionCard title={t("guestTitle")} description={t("guestAlgorithm")}>
          <div className="space-y-4 text-sm text-zinc-600 dark:text-zinc-300">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
                <Sparkles className="mb-2 h-5 w-5 text-blue-500" />
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">{t("guestFeatureScore")}</h4>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t("guestFeatureScoreDesc")}</p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
                <SlidersHorizontal className="mb-2 h-5 w-5 text-green-500" />
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">{t("guestFeatureLocation")}</h4>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t("guestFeatureLocationDesc")}</p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
                <Hand className="mb-2 h-5 w-5 text-amber-500" />
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">{t("guestFeatureCategory")}</h4>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t("guestFeatureCategoryDesc")}</p>
              </div>
            </div>

            {/* Demo match card */}
            <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4 dark:border-blue-800 dark:from-blue-950/30 dark:to-zinc-900">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-2xl dark:bg-blue-900/40">
                  🎧
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">{t("guestDemoTitle")}</h4>
                    <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700 dark:bg-green-900/40 dark:text-green-300">
                      {t("guestDemoScore")}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <span>{t("guestDemoCategory")}</span>
                    <span>·</span>
                    <span>{t("guestDemoCondition")}</span>
                    <span>·</span>
                    <span>{t("guestDemoLocation")}</span>
                  </div>
                  <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-300">{t("guestDemoWants")}</p>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        <div className="text-center">
          <CTAButton href="/register">{t("guestCta")}</CTAButton>
        </div>
      </div>
    );
  }

  const handleProposeSwap = async (matchId: string) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;
    trackEvent("match_accepted", { matchId, score: match.compatibilityScore });
    const swap = await proposeSwap({
      requesterItemId: match.itemOffered.id,
      responderItemId: match.itemRequested.id,
      responderId: match.itemRequested.ownerId,
    });
    if (swap) trackEvent("exchange_started", { swapId: swap.id });
    router.push(swap ? `/change?swap=${swap.id}` : "/change");
  };

  const handleNegotiate = (matchId: string) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;
    router.push(`/chat?to=${encodeURIComponent(match.itemRequested.ownerId)}`);
  };

  const handleReject = (match: MatchCandidate, reason?: RejectReason) => {
    setRejectionLog((prev) => [...prev, { matchId: match.id, reason, timestamp: Date.now() }]);
    trackEvent("match_rejected", { matchId: match.id, reason: reason ?? "none", score: match.compatibilityScore });
  };

  const handleApplySuggestion = (suggestion: NearMatchSuggestion) => {
    trackEvent("near_match_suggestion_applied", { type: suggestion.type, scoreBoost: suggestion.scoreBoost });
    if (suggestion.type === "extend_radius" && suggestion.newRadiusKm) {
      router.push("/profile");
    } else if (suggestion.type === "accept_courier") {
      router.push("/profile");
    } else if (suggestion.type === "add_bundle_item") {
      router.push("/objects");
    } else if (suggestion.type === "add_photos" || suggestion.type === "complete_description") {
      router.push("/objects");
    } else if (suggestion.type === "accept_flexible") {
      router.push("/profile");
    }
  };

  const handleMatchSuggestion = (_matchId: string, suggestion: NearMatchSuggestion) => {
    handleApplySuggestion(suggestion);
  };

  const handleCreateChainFromOpportunity = async (opp: DetectedChainOpportunity) => {
    const links = opp.participants.map((p, idx) => ({
      position: idx,
      giverId: p.userId,
      receiverId: opp.participants[(idx + 1) % opp.participants.length].userId,
      itemId: p.givesItemId,
      itemTitle: p.givesItemTitle,
      giverName: p.userName,
      receiverName: opp.participants[(idx + 1) % opp.participants.length].userName,
    }));
    await createChain(t("chainDetected"), links);
  };

  // Dealbreaker counts
  const dealbreakersCount = (minCondition !== "any" ? 1 : 0) + (excludedCategories.size > 0 ? 1 : 0) + (minScore > 0 ? 1 : 0);
  const clearDealbreakers = () => {
    setMinCondition("any");
    setExcludedCategories(new Set());
    setMinScore(0);
  };

  const TIER_BUTTONS: { key: MatchTier | "all"; color: string }[] = [
    { key: "all", color: "bg-zinc-900 text-white" },
    { key: "strong", color: "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-200" },
    { key: "good", color: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200" },
    { key: "possible", color: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200" },
    { key: "weak", color: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200" },
  ];

  return (
    <div className="space-y-4">
      {/* ── Section 1: Top 3 AI Picks ── */}
      <SectionCard
        title={t("topPicks")}
        description={t("topPicksDescription")}
      >
        {topPicks.length > 0 ? (
          <MatchList
            matches={topPicks}
            onAccept={(match) => void handleProposeSwap(match.id)}
            onNegotiate={(match) => handleNegotiate(match.id)}
            onReject={(match, reason) => handleReject(match, reason)}
            onAiAnalyze={handleAiAnalyze}
            onApplySuggestion={handleMatchSuggestion}
          />
        ) : (
          <div className="rounded-xl bg-zinc-50 p-4 text-center text-sm text-zinc-500 dark:bg-zinc-800/50">
            {t("noMatchesNow")}
          </div>
        )}
      </SectionCard>

      {/* ── Section 2: Map with Visual Proposals ── */}
      <SectionCard
        title={t("mapProposals")}
        description={t("mapProposalsDescription")}
      >
        <MapEmbed
          center={mapCenter ?? undefined}
          lat={user.location?.coordinates?.lat}
          lng={user.location?.coordinates?.lng}
          height={300}
          zoom={user.location?.travelRadiusKm && user.location.travelRadiusKm < 30 ? 12 : 8}
        />
        {mapCenter && (
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            {t("yourLocation")}: {mapCenter}
          </p>
        )}
      </SectionCard>

      {/* ── Mode Toggle: Auto/Manual ── */}
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setManualMode(false)}
          className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
            !manualMode
              ? "border-blue-300 bg-blue-50 ring-1 ring-blue-300 dark:border-blue-700 dark:bg-blue-950/40 dark:ring-blue-700"
              : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600"
          }`}
        >
          <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${!manualMode ? "bg-blue-600 text-white" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-700"}`}>
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className={`text-sm font-semibold ${!manualMode ? "text-blue-700 dark:text-blue-300" : "text-zinc-900 dark:text-zinc-50"}`}>
              {t("autoModeTitle")}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{t("autoModeDesc")}</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setManualMode(true)}
          className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
            manualMode
              ? "border-blue-300 bg-blue-50 ring-1 ring-blue-300 dark:border-blue-700 dark:bg-blue-950/40 dark:ring-blue-700"
              : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600"
          }`}
        >
          <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${manualMode ? "bg-blue-600 text-white" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-700"}`}>
            <Hand className="h-4 w-4" />
          </div>
          <div>
            <p className={`text-sm font-semibold ${manualMode ? "text-blue-700 dark:text-blue-300" : "text-zinc-900 dark:text-zinc-50"}`}>
              {t("manualModeTitle")}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{t("manualModeDesc")}</p>
          </div>
        </button>
      </div>

      {/* ── Dealbreakers ── */}
      <SectionCard
        title={t("dealbreakers")}
        description={t("dealbreakersDescription")}
        action={
          <button
            type="button"
            onClick={() => setShowDealbreakers(!showDealbreakers)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              dealbreakersCount > 0
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {dealbreakersCount > 0 && t("dealbreakersActive", { count: dealbreakersCount })}
          </button>
        }
      >
        {showDealbreakers && (
          <div className="space-y-4">
            {/* Min condition */}
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase text-zinc-500">{t("minCondition")}</p>
              <div className="flex flex-wrap gap-1.5">
                {(["any", "new", "good", "used"] as const).map((cond) => (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => setMinCondition(cond)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                      minCondition === cond
                        ? "bg-blue-600 text-white"
                        : "bg-white text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    {cond === "any" ? t("anyCondition") : t(`condition${cond.charAt(0).toUpperCase() + cond.slice(1)}` as Parameters<typeof t>[0])}
                  </button>
                ))}
              </div>
            </div>

            {/* Excluded categories */}
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase text-zinc-500">{t("excludeCategories")}</p>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => {
                  const excluded = excludedCategories.has(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setExcludedCategories((prev) => {
                          const next = new Set(prev);
                          if (excluded) next.delete(cat);
                          else next.add(cat);
                          return next;
                        });
                      }}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                        excluded
                          ? "bg-red-100 text-red-700 line-through dark:bg-red-900/30 dark:text-red-300"
                          : "bg-white text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      {excluded && <X className="mr-0.5 inline h-3 w-3" />}
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Min score */}
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase text-zinc-500">{t("minScore")}</p>
              <div className="flex flex-wrap gap-1.5">
                {[0, 40, 60, 70, 85].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setMinScore(score)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                      minScore === score
                        ? "bg-blue-600 text-white"
                        : "bg-white text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    {score === 0 ? t("noMinimum") : `${score}+`}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="flex items-center gap-3">
              {dealbrokenCount > 0 && (
                <span className="text-xs text-red-600 dark:text-red-400">
                  {t("dealbreakersFiltered", { count: dealbrokenCount })}
                </span>
              )}
              {dealbreakersCount > 0 && (
                <button
                  type="button"
                  onClick={clearDealbreakers}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400"
                >
                  {t("clearDealbreakers")}
                </button>
              )}
            </div>
          </div>
        )}
      </SectionCard>

      {/* ── Advanced Filters Row ── */}
      <div className="flex flex-wrap gap-4">
        {/* Strictness Slider */}
        <div className="min-w-[200px] flex-1 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800">
          <p className="mb-1.5 text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">{t("strictness")}</p>
          <input
            type="range"
            min={0}
            max={100}
            value={strictnessThreshold}
            onChange={(e) => setStrictnessThreshold(Number(e.target.value))}
            className="w-full accent-blue-600"
          />
          <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-400">
            <span>{t("relaxedLabel")}</span>
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">{strictnessThreshold}</span>
            <span>{t("strictLabel")}</span>
          </div>
        </div>

        {/* Max Distance Filter */}
        <div className="min-w-[160px] flex-1 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800">
          <p className="mb-1.5 text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">{t("maxDistance")}</p>
          <select
            value={maxDistanceKm}
            onChange={(e) => setMaxDistanceKm(Number(e.target.value))}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-200"
          >
            <option value={0}>{t("anyDistance")}</option>
            <option value={10}>10 km</option>
            <option value={25}>25 km</option>
            <option value={50}>50 km</option>
            <option value={100}>100 km</option>
          </select>
        </div>

        {/* Swap Type Filter */}
        <div className="min-w-[240px] flex-1 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800">
          <p className="mb-1.5 text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">{t("swapTypeFilter")}</p>
          <div className="flex flex-wrap gap-1.5">
            {(["all", "local", "courier", "vacation", "service"] as const).map((type) => {
              const labelKey = type === "all" ? "swapAll" : type === "local" ? "swapLocal" : type === "courier" ? "swapCourier" : type === "vacation" ? "swapVacation" : "swapService";
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSwapTypeFilter(type)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                    swapTypeFilter === type
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {t(labelKey)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Section 3: All Matches with Filters ── */}
      <SectionCard
        title={t("title")}
        description={t("description")}
      >
        {!featureToggles.aiEnabled ? (
          <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
            {t("aiUnavailable")}
          </div>
        ) : null}

        {/* Filter & Sort controls */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">{t("filterByTier")}:</span>
            {TIER_BUTTONS.map(({ key, color }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTierFilter(key)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  tierFilter === key ? color : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                {key === "all" ? t("allTiers") : t(key === "strong" ? "veryGood" : key)} ({tierCounts[key]})
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">{t("sortBy")}:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800"
            >
              <option value="score">{t("sortScore")}</option>
              <option value="category">{t("sortCategory")}</option>
              <option value="location">{t("sortLocation")}</option>
            </select>
            <span className="text-xs text-zinc-500">
              {filteredAndSorted.length} {t("resultsShown")}
            </span>
          </div>
        </div>

        <MatchList
          matches={filteredAndSorted}
          onAccept={(match) => void handleProposeSwap(match.id)}
          onNegotiate={(match) => handleNegotiate(match.id)}
          onReject={() => {}}
          onAiAnalyze={handleAiAnalyze}
          onApplySuggestion={handleMatchSuggestion}
        />
      </SectionCard>

      {/* ── Near-Match Suggestions ── */}
      <SectionCard title={t("nearMatchTitle")} description={t("nearMatchDescription")}>
        <NearMatchSuggestions
          matches={dealbrokenMatches}
          onApply={handleApplySuggestion}
        />
      </SectionCard>

      {/* ── Chain Swap Opportunities ── */}
      <SectionCard title={t("chainTitle")} description={t("chainDescription")}>
        <ChainOpportunities
          opportunities={detectedChainOpportunities}
          detecting={detectingChains}
          onDetect={() => void detectChains()}
          onCreateFromOpportunity={(opp) => void handleCreateChainFromOpportunity(opp)}
        />
      </SectionCard>

      {/* ── My Active Chains ── */}
      {myChains.length > 0 && (
        <SectionCard title={t("myChainsTitle")} description={t("myChainsDescription")}>
          <div className="space-y-3">
            {myChains.map((chain) => (
              <ChainVisualization
                key={chain.id}
                chain={chain}
                currentUserId={user.id}
                onConfirmLink={(cId, lId) => void confirmChainLink(cId, lId)}
                onStartChain={(cId) => void startChain(cId)}
                onCompleteChain={(cId) => void completeChain(cId)}
                onCancelChain={(cId) => void cancelChain(cId)}
              />
            ))}
          </div>
        </SectionCard>
      )}

      <SectionCard title={t("howItWorks")} description={t("cumulativeScore")}>
        <div className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
          <p>{t("cumulativeScoreDescription")}</p>
          <p>{t("noSingleFactor")}</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-lg bg-red-50 p-2 text-center text-xs dark:bg-red-950/30">
              <p className="font-bold text-red-800 dark:text-red-200">0-39</p>
              <p className="text-red-600 dark:text-red-400">{t("weak")}</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-2 text-center text-xs dark:bg-amber-950/30">
              <p className="font-bold text-amber-800 dark:text-amber-200">40-69</p>
              <p className="text-amber-600 dark:text-amber-400">{t("possible")}</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-2 text-center text-xs dark:bg-blue-950/30">
              <p className="font-bold text-blue-800 dark:text-blue-200">70-84</p>
              <p className="text-blue-600 dark:text-blue-400">{t("good")}</p>
            </div>
            <div className="rounded-lg bg-green-50 p-2 text-center text-xs dark:bg-green-950/30">
              <p className="font-bold text-green-800 dark:text-green-200">85-100</p>
              <p className="text-green-600 dark:text-green-400">{t("veryGood")}</p>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title={t("geographicChoices")} description={t("geographicDescription")}>
        <div className="space-y-3">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            {t("matchesPrioritized")}
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-white/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/70">
              <p className="text-xs font-semibold uppercase text-zinc-500">{t("yourArea")}</p>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {user.location?.city ?? t("notSet")}, {user.location?.country ?? "—"}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/70">
              <p className="text-xs font-semibold uppercase text-zinc-500">{t("maxRadius")}</p>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {user.location?.travelRadiusKm ? `${user.location.travelRadiusKm} km` : t("notSet")}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/70">
              <p className="text-xs font-semibold uppercase text-zinc-500">{t("logistics")}</p>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {user.swapPreferences.logistics === "in_person"
                  ? t("inPerson")
                  : user.swapPreferences.logistics === "courier"
                    ? t("courier")
                    : t("flexible")}
              </p>
            </div>
          </div>
          {!user.location?.city ? (
            <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
              {t("completeLocationNote")}
              <CTAButton href="/profile" variant="ghost">{t("openProfile")}</CTAButton>
            </div>
          ) : null}
        </div>
      </SectionCard>

      <NextStepRecommendation
        title={tc("nextStepRecommended")}
        steps={[
          { label: t("sendMessage"), href: "/chat", description: t("sendMessageDescription") },
          { label: t("proposeExchange"), href: "/change", description: t("proposeExchangeDescription") },
          { label: t("addObject"), href: "/objects/new", description: t("addObjectDescription") },
        ]}
      />

      <StateShowcase
        title={t("title")}
        states={[
          {
            key: "loading",
            title: t("analyzingCompatibility"),
            description: t("cumulativeScoreDescription"),
          },
          {
            key: "empty",
            title: t("noMatchesNow"),
            description: t("addObjectDescription"),
          },
          {
            key: "error",
            title: t("aiUnavailableNote"),
            description: t("analysisContinues"),
          },
        ]}
      />
    </div>
  );
}
