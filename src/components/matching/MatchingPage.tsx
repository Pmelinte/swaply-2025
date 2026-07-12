"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useMatchingSlots } from "@/hooks/useMatchingSlots";
import {
  fetchCandidateItems,
  fetchItemById,
  fetchProfilesByIds,
  fetchProfileById,
  type MatchingItemRow,
  type MatchingProfileRow,
} from "@/lib/matching/matchQueries";
import { calculateMatchScore } from "@/lib/matching/matchScore";
import { persistMatchCandidate } from "@/lib/matching/matchPersistence";
import {
  fetchExpressedInterests,
  withdrawExpressedInterest,
} from "@/lib/matching/interestPersistence";
import {
  DEFAULT_FILTERS,
  type MatchingFilters,
  type SelectedMatch,
  type SortOrder,
} from "@/lib/matching/matchingStore";
import MatchingSlots from "./MatchingSlots";
import MatchingBrowse from "./MatchingBrowse";
import MatchingMap from "./MatchingMap";
import MatchingAIButton from "./MatchingAIButton";
import MatchingSelected from "./MatchingSelected";
import MatchingFilterDrawer from "./MatchingFilterDrawer";
import MatchingItemDrawer from "./MatchingItemDrawer";

interface Props {
  userId: string;
  initialSlot1: string | null;
  initialSlot2: string | null;
}

export type ScoredCandidate = {
  item: MatchingItemRow;
  profile: MatchingProfileRow | null;
  score: number;
  breakdown: ReturnType<typeof calculateMatchScore>;
};

export default function MatchingPage({ userId, initialSlot1, initialSlot2 }: Props) {
  const { slot1Id, slot2Id, setSlot1, setSlot2, clearSlot1, clearSlot2 } = useMatchingSlots(
    initialSlot1,
    initialSlot2,
  );

  const [slot1Item, setSlot1Item] = useState<MatchingItemRow | null>(null);
  const [slot2Item, setSlot2Item] = useState<MatchingItemRow | null>(null);
  const [myProfile, setMyProfile] = useState<MatchingProfileRow | null>(null);

  const [candidates, setCandidates] = useState<MatchingItemRow[]>([]);
  const [candidateProfiles, setCandidateProfiles] = useState<Map<string, MatchingProfileRow>>(
    new Map(),
  );
  const [loading, setLoading] = useState(false);
  const [persistingIds, setPersistingIds] = useState<Set<string>>(new Set());
  const [withdrawingIds, setWithdrawingIds] = useState<Set<string>>(new Set());

  const [selected, setSelected] = useState<SelectedMatch[]>([]);
  const [sort, setSort] = useState<SortOrder>("relevant");
  const [filters, setFilters] = useState<MatchingFilters>(DEFAULT_FILTERS);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [drawerItem, setDrawerItem] = useState<ScoredCandidate | null>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    let cancelled = false;
    fetchProfileById(supabase, userId).then((profile) => {
      if (!cancelled) setMyProfile(profile);
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
        if (!cancelled) setSlot1Item(item);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [slot1Id]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    let cancelled = false;
    if (!slot2Id) {
      setSlot2Item(null);
    } else {
      fetchItemById(supabase, slot2Id).then((item) => {
        if (!cancelled) setSlot2Item(item);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [slot2Id]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    let cancelled = false;
    setLoading(true);
    fetchCandidateItems(supabase, userId, 100).then(async (items) => {
      if (cancelled) return;
      setCandidates(items);
      const ownerIds = Array.from(new Set(items.map((item) => item.owner_id)));
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
    const supabase = getSupabaseClient();
    if (!supabase) return;

    let cancelled = false;

    async function restoreInterests() {
      const rows = await fetchExpressedInterests(supabase, userId);
      const restored = await Promise.all(
        rows.map(async (row): Promise<SelectedMatch | null> => {
          const item = await fetchItemById(supabase, row.target_item_id);
          if (!item) return null;
          return {
            itemId: item.id,
            ownerId: row.target_user_id,
            item,
            score: row.ai_score ?? 0,
            matchId: row.id,
          };
        }),
      );

      if (!cancelled) {
        setSelected(restored.filter((entry): entry is SelectedMatch => entry !== null));
      }
    }

    void restoreInterests();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const activeSlotItems = useMemo(
    () => [slot1Item, slot2Item].filter(Boolean) as MatchingItemRow[],
    [slot1Item, slot2Item],
  );

  const scoredCandidates: ScoredCandidate[] = useMemo(() => {
    if (activeSlotItems.length === 0) {
      return candidates.map((item) => ({
        item,
        profile: candidateProfiles.get(item.owner_id) ?? null,
        score: 0,
        breakdown: {
          categoryMatch: 0,
          valueMatch: 0,
          typeMatch: 0,
          geoScore: 0,
          trustScore: 0,
          activityScore: 0,
          total: 0,
        },
      }));
    }

    return candidates.map((item) => {
      const profile = candidateProfiles.get(item.owner_id) ?? null;
      const breakdowns = activeSlotItems.map((slot) =>
        calculateMatchScore(slot, item, myProfile, profile),
      );
      const best = breakdowns.reduce((left, right) =>
        left.total >= right.total ? left : right,
      );
      return { item, profile, score: best.total, breakdown: best };
    });
  }, [candidates, candidateProfiles, activeSlotItems, myProfile]);

  const filtered = useMemo(() => {
    let list = scoredCandidates;
    if (filters.category) {
      list = list.filter((candidate) => candidate.item.category === filters.category);
    }
    if (filters.itemType) {
      list = list.filter((candidate) => candidate.item.item_type === filters.itemType);
    }
    return list;
  }, [scoredCandidates, filters]);

  const averageScore = useMemo(() => {
    if (activeSlotItems.length === 0 || filtered.length === 0) return null;
    const sum = filtered.reduce((total, candidate) => total + candidate.score, 0);
    return Math.round(sum / filtered.length);
  }, [filtered, activeSlotItems]);

  async function expressInterest(candidate: ScoredCandidate) {
    if (persistingIds.has(candidate.item.id)) return;

    const sourceItem = activeSlotItems[0] ?? null;
    const supabase = getSupabaseClient();
    setPersistingIds((previous) => new Set(previous).add(candidate.item.id));

    const persisted = supabase
      ? await persistMatchCandidate(supabase, {
          userId,
          sourceItem,
          candidate,
          slotPosition: selected.length + 1,
        })
      : null;

    if (persisted) {
      setSelected((previous) => {
        if (previous.some((entry) => entry.itemId === candidate.item.id)) return previous;
        return [
          ...previous,
          {
            itemId: candidate.item.id,
            ownerId: candidate.item.owner_id,
            item: candidate.item,
            score: candidate.score,
            matchId: persisted.id,
          },
        ];
      });
    }

    setPersistingIds((previous) => {
      const next = new Set(previous);
      next.delete(candidate.item.id);
      return next;
    });
    setDrawerItem(null);
  }

  async function withdrawInterest(itemId: string) {
    const interest = selected.find((entry) => entry.itemId === itemId);
    if (!interest || withdrawingIds.has(itemId)) return;

    if (!interest.matchId) {
      setSelected((previous) => previous.filter((entry) => entry.itemId !== itemId));
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) return;

    setWithdrawingIds((previous) => new Set(previous).add(itemId));
    const withdrawn = await withdrawExpressedInterest(supabase, interest.matchId, userId);

    if (withdrawn) {
      setSelected((previous) => previous.filter((entry) => entry.itemId !== itemId));
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
            slot1Item={slot1Item}
            slot2Item={slot2Item}
            slot1Id={slot1Id}
            slot2Id={slot2Id}
            averageScore={averageScore}
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
            onOpenItem={(candidate) => setDrawerItem(candidate)}
          />

          <MatchingMap candidates={filtered} />

          <MatchingAIButton
            userId={userId}
            slotItemId={slot1Id ?? slot2Id}
            excludeIds={selected.map((entry) => entry.itemId)}
            slotsFull={selected.length >= 2}
            onSuggestion={(item, score) => {
              const existing = filtered.find((candidate) => candidate.item.id === item.id);
              if (existing) {
                void expressInterest(existing);
                return;
              }
              void expressInterest({
                item,
                profile: null,
                score,
                breakdown: {
                  categoryMatch: 0,
                  valueMatch: 0,
                  typeMatch: 0,
                  geoScore: 0,
                  trustScore: 0,
                  activityScore: 0,
                  total: score,
                },
              });
            }}
          />

          <MatchingSelected
            selected={selected}
            withdrawingIds={withdrawingIds}
            onWithdraw={(itemId) => void withdrawInterest(itemId)}
          />
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
        onClose={() => setDrawerItem(null)}
        onExpressInterest={(candidate) => void expressInterest(candidate)}
        onFillSlot={(id) => {
          if (!slot1Id) {
            setSlot1(id);
          } else if (!slot2Id) {
            setSlot2(id);
          } else {
            setSlot1(id);
          }
          setDrawerItem(null);
        }}
      />
    </>
  );
}
