/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useMatchingSlots } from "@/hooks/useMatchingSlots";
import {
  fetchCandidateItems,
  fetchItemById,
  fetchOwnActiveItems,
  fetchProfilesByIds,
  fetchProfileById,
  type MatchingItemRow,
  type MatchingProfileRow,
} from "@/lib/matching/matchQueries";
import { isMatchingPairCompatible } from "@/lib/matching/domainCompatibility";
import { calculateMatchScore } from "@/lib/matching/matchScore";
import {
  fetchExpressedInterests,
  fetchReceivedInterests,
  persistExpressedInterest,
  withdrawExpressedInterest,
} from "@/lib/matching/interestPersistence";
import {
  DEFAULT_FILTERS,
  type MatchingFilters,
  type SelectedInterest,
  type SortOrder,
} from "@/lib/matching/matchingStore";
import MatchingSlots from "./MatchingSlots";
import MatchingBrowse from "./MatchingBrowse";
import MatchingMap from "./MatchingMap";
import MatchingAIButton from "./MatchingAIButton";
import MatchingSelected from "./MatchingSelected";
import MatchingReceived, {
  type ReceivedInterestView,
} from "./MatchingReceived";
import MatchingFilterDrawer from "./MatchingFilterDrawer";
import MatchingItemDrawer from "./MatchingItemDrawer";

interface Props {
  userId: string;
  initialSlot1: string | null;
  initialSlot2: string | null;
  initialTarget: string | null;
}

export type ScoredCandidate = {
  item: MatchingItemRow;
  profile: MatchingProfileRow | null;
  sourceItemId: string | null;
  score: number;
  breakdown: ReturnType<typeof calculateMatchScore>;
};

function emptyBreakdown(): ReturnType<typeof calculateMatchScore> {
  return {
    categoryMatch: 0,
    valueMatch: 0,
    typeMatch: 0,
    geoScore: 0,
    trustScore: 0,
    activityScore: 0,
    availabilityScore: 0,
    total: 0,
  };
}

export default function MatchingPage({
  userId,
  initialSlot1,
  initialSlot2,
  initialTarget,
}: Props) {
  const {
    slot1Id,
    slot2Id,
    setSlot1,
    setSlot2,
    clearSlot1,
    clearSlot2,
  } = useMatchingSlots(initialSlot1, initialSlot2);

  const [ownItems, setOwnItems] = useState<MatchingItemRow[]>([]);
  const [slot1Item, setSlot1Item] = useState<MatchingItemRow | null>(null);
  const [slot2Item, setSlot2Item] = useState<MatchingItemRow | null>(null);
  const [myProfile, setMyProfile] = useState<MatchingProfileRow | null>(null);

  const [candidates, setCandidates] = useState<MatchingItemRow[]>([]);
  const [candidateProfiles, setCandidateProfiles] = useState<
    Map<string, MatchingProfileRow>
  >(new Map());
  const [loading, setLoading] = useState(false);
  const [persistingIds, setPersistingIds] = useState<Set<string>>(new Set());
  const [withdrawingIds, setWithdrawingIds] = useState<Set<string>>(new Set());

  const [selected, setSelected] = useState<SelectedInterest[]>([]);
  const [received, setReceived] = useState<ReceivedInterestView[]>([]);
  const [loadingReceived, setLoadingReceived] = useState(true);
  const [sort, setSort] = useState<SortOrder>("relevant");
  const [filters, setFilters] = useState<MatchingFilters>(DEFAULT_FILTERS);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [drawerItemId, setDrawerItemId] = useState<string | null>(null);
  const targetOpenedRef = useRef(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    let cancelled = false;

    Promise.all([
      fetchProfileById(supabase, userId),
      fetchOwnActiveItems(supabase, userId, 100),
    ]).then(([profile, items]) => {
      if (cancelled) return;
      setMyProfile(profile);
      setOwnItems(items);
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    let cancelled = false;

    if (!slot1Id) {
      setSlot1Item(null);
    } else {
      fetchItemById(supabase, slot1Id).then((item) => {
        if (cancelled) return;
        if (!item || item.owner_id !== userId) {
          setSlot1Item(null);
          clearSlot1();
          return;
        }
        setSlot1Item(item);
      });
    }

    return () => {
      cancelled = true;
    };
  }, [slot1Id, userId, clearSlot1]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    let cancelled = false;

    if (!slot2Id) {
      setSlot2Item(null);
    } else {
      fetchItemById(supabase, slot2Id).then((item) => {
        if (cancelled) return;
        if (!item || item.owner_id !== userId) {
          setSlot2Item(null);
          clearSlot2();
          return;
        }
        setSlot2Item(item);
      });
    }

    return () => {
      cancelled = true;
    };
  }, [slot2Id, userId, clearSlot2]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    let cancelled = false;
    setLoading(true);

    fetchCandidateItems(supabase, userId, 100).then(async (items) => {
      if (cancelled) return;
      setCandidates(items);
      const ownerIds = Array.from(
        new Set(items.map((item) => item.owner_id)),
      );
      const profiles = await fetchProfilesByIds(supabase, ownerIds);
      if (!cancelled) {
        setCandidateProfiles(profiles);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (
      targetOpenedRef.current ||
      !initialTarget ||
      !candidates.some((item) => item.id === initialTarget)
    ) {
      return;
    }

    targetOpenedRef.current = true;
    setDrawerItemId(initialTarget);
  }, [candidates, initialTarget]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const client = supabase;
    let cancelled = false;

    async function restoreInterests() {
      const rows = await fetchExpressedInterests(client, userId);
      const restored = await Promise.all(
        rows.map(async (row): Promise<SelectedInterest | null> => {
          const item = await fetchItemById(client, row.to_item_id);
          if (!item) return null;
          return {
            itemId: item.id,
            ownerId: row.to_user_id,
            item,
            score: Number(row.match_score ?? 0),
            interestId: row.id,
          };
        }),
      );

      if (!cancelled) {
        setSelected(
          restored.filter(
            (entry): entry is SelectedInterest => entry !== null,
          ),
        );
      }
    }

    void restoreInterests();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setLoadingReceived(false);
      return;
    }
    const client = supabase;
    let cancelled = false;

    async function restoreReceivedInterests() {
      setLoadingReceived(true);
      const rows = await fetchReceivedInterests(client, userId);
      const restored = await Promise.all(
        rows.map(async (row): Promise<ReceivedInterestView | null> => {
          const [fromItem, toItem, profile] = await Promise.all([
            fetchItemById(client, row.from_item_id),
            fetchItemById(client, row.to_item_id),
            fetchProfileById(client, row.from_user_id),
          ]);

          if (!fromItem || !toItem || toItem.owner_id !== userId) return null;

          return {
            id: row.id,
            fromUserId: row.from_user_id,
            fromItem,
            toItem,
            profile,
            score: Number(row.match_score ?? 0),
            createdAt: row.created_at,
          };
        }),
      );

      if (!cancelled) {
        setReceived(
          restored.filter(
            (entry): entry is ReceivedInterestView => entry !== null,
          ),
        );
        setLoadingReceived(false);
      }
    }

    void restoreReceivedInterests();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const activeSlotItems = useMemo(
    () => [slot1Item, slot2Item].filter(Boolean) as MatchingItemRow[],
    [slot1Item, slot2Item],
  );

  const scoredCandidates = useMemo<ScoredCandidate[]>(() => {
    if (activeSlotItems.length === 0) {
      return candidates.map((item) => ({
        item,
        profile: candidateProfiles.get(item.owner_id) ?? null,
        sourceItemId: null,
        score: 0,
        breakdown: emptyBreakdown(),
      }));
    }

    return candidates.flatMap((item) => {
      const profile = candidateProfiles.get(item.owner_id) ?? null;
      const compatibleSources = activeSlotItems.filter((source) =>
        isMatchingPairCompatible(source, item),
      );
      if (compatibleSources.length === 0) return [];

      const scoredSources = compatibleSources.map((source) => ({
        source,
        breakdown: calculateMatchScore(source, item, myProfile, profile),
      }));
      const best = scoredSources.reduce((left, right) =>
        left.breakdown.total >= right.breakdown.total ? left : right,
      );

      return [
        {
          item,
          profile,
          sourceItemId: best.source.id,
          score: best.breakdown.total,
          breakdown: best.breakdown,
        },
      ];
    });
  }, [candidates, candidateProfiles, activeSlotItems, myProfile]);

  const filtered = useMemo(() => {
    let list = scoredCandidates;
    if (filters.category) {
      list = list.filter(
        (candidate) => candidate.item.category === filters.category,
      );
    }
    if (filters.itemType) {
      list = list.filter(
        (candidate) => candidate.item.item_type === filters.itemType,
      );
    }
    return list;
  }, [scoredCandidates, filters]);

  const drawerItem = useMemo(
    () =>
      drawerItemId
        ? scoredCandidates.find(
            (candidate) => candidate.item.id === drawerItemId,
          ) ?? null
        : null,
    [drawerItemId, scoredCandidates],
  );

  useEffect(() => {
    if (drawerItemId && activeSlotItems.length > 0 && !drawerItem) {
      setDrawerItemId(null);
    }
  }, [drawerItem, drawerItemId, activeSlotItems.length]);

  const averageScore = useMemo(() => {
    if (activeSlotItems.length === 0 || filtered.length === 0) return null;
    const sum = filtered.reduce(
      (total, candidate) => total + candidate.score,
      0,
    );
    return Math.round(sum / filtered.length);
  }, [filtered, activeSlotItems]);

  async function expressInterest(candidate: ScoredCandidate) {
    if (persistingIds.has(candidate.item.id)) return;
    if (selected.some((entry) => entry.itemId === candidate.item.id)) {
      setDrawerItemId(null);
      return;
    }

    const sourceItem = activeSlotItems.find(
      (item) => item.id === candidate.sourceItemId,
    );
    if (!sourceItem || !isMatchingPairCompatible(sourceItem, candidate.item)) {
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) return;

    setPersistingIds((previous) =>
      new Set(previous).add(candidate.item.id),
    );

    const persisted = await persistExpressedInterest(supabase, {
      userId,
      sourceItem,
      candidate,
      source: "browsing",
    });

    if (persisted) {
      setSelected((previous) => {
        if (previous.some((entry) => entry.itemId === candidate.item.id)) {
          return previous;
        }
        return [
          ...previous,
          {
            itemId: candidate.item.id,
            ownerId: candidate.item.owner_id,
            item: candidate.item,
            score: candidate.score,
            interestId: persisted.id,
          },
        ];
      });
    }

    setPersistingIds((previous) => {
      const next = new Set(previous);
      next.delete(candidate.item.id);
      return next;
    });
    setDrawerItemId(null);
  }

  async function withdrawInterest(itemId: string) {
    const interest = selected.find((entry) => entry.itemId === itemId);
    if (!interest || withdrawingIds.has(itemId) || !interest.interestId) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    setWithdrawingIds((previous) => new Set(previous).add(itemId));
    const withdrawn = await withdrawExpressedInterest(
      supabase,
      interest.interestId,
      userId,
    );

    if (withdrawn) {
      setSelected((previous) =>
        previous.filter((entry) => entry.itemId !== itemId),
      );
    }

    setWithdrawingIds((previous) => {
      const next = new Set(previous);
      next.delete(itemId);
      return next;
    });
  }

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-4">
        <div className="space-y-6">
          <MatchingSlots
            ownItems={ownItems}
            slot1Item={slot1Item}
            slot2Item={slot2Item}
            slot1Id={slot1Id}
            slot2Id={slot2Id}
            averageScore={averageScore}
            onSelectSlot1={setSlot1}
            onSelectSlot2={setSlot2}
            onRemoveSlot1={clearSlot1}
            onRemoveSlot2={clearSlot2}
            onOpenFilters={() => setIsFilterOpen(true)}
          />

          <MatchingBrowse
            hasSlots={activeSlotItems.length > 0}
            candidates={filtered}
            loading={loading}
            sort={sort}
            onSortChange={setSort}
            onOpenItem={(candidate) => setDrawerItemId(candidate.item.id)}
          />

          <MatchingMap candidates={filtered} />

          <MatchingAIButton
            userId={userId}
            slotItemId={slot1Id ?? slot2Id}
            excludeIds={selected.map((entry) => entry.itemId)}
            slotsFull={selected.length >= 2}
            onSuggestion={(item, score) => {
              const existing = scoredCandidates.find(
                (candidate) => candidate.item.id === item.id,
              );
              if (existing) {
                void expressInterest(existing);
                return;
              }

              const source = activeSlotItems.find((entry) =>
                isMatchingPairCompatible(entry, item),
              );
              if (!source) return;
              const profile = candidateProfiles.get(item.owner_id) ?? null;
              const breakdown = calculateMatchScore(
                source,
                item,
                myProfile,
                profile,
              );
              void expressInterest({
                item,
                profile,
                sourceItemId: source.id,
                score: Math.min(score, breakdown.total),
                breakdown,
              });
            }}
          />

          <MatchingSelected
            selected={selected}
            withdrawingIds={withdrawingIds}
            onWithdraw={(itemId) => void withdrawInterest(itemId)}
          />

          <MatchingReceived interests={received} loading={loadingReceived} />
        </div>
      </div>

      <MatchingFilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
        slotItems={activeSlotItems}
      />

      <MatchingItemDrawer
        candidate={drawerItem}
        canExpressInterest={Boolean(drawerItem?.sourceItemId)}
        onClose={() => setDrawerItemId(null)}
        onExpressInterest={(candidate) => void expressInterest(candidate)}
      />
    </>
  );
}
