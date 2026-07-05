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

  const [selected, setSelected] = useState<SelectedMatch[]>([]);
  const [sort, setSort] = useState<SortOrder>("relevant");
  const [filters, setFilters] = useState<MatchingFilters>(DEFAULT_FILTERS);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [drawerItem, setDrawerItem] = useState<ScoredCandidate | null>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    let cancelled = false;
    fetchProfileById(supabase, userId).then((p) => {
      if (!cancelled) setMyProfile(p);
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
      fetchItemById(supabase, slot1Id).then((r) => {
        if (!cancelled) setSlot1Item(r);
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
      fetchItemById(supabase, slot2Id).then((r) => {
        if (!cancelled) setSlot2Item(r);
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
      const ownerIds = Array.from(new Set(items.map((i) => i.owner_id)));
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
      const best = breakdowns.reduce((a, b) => (a.total >= b.total ? a : b));
      return { item, profile, score: best.total, breakdown: best };
    });
  }, [candidates, candidateProfiles, activeSlotItems, myProfile]);

  const filtered = useMemo(() => {
    let list = scoredCandidates;
    if (filters.category) {
      list = list.filter((c) => c.item.category === filters.category);
    }
    if (filters.itemType) {
      list = list.filter((c) => c.item.item_type === filters.itemType);
    }
    return list;
  }, [scoredCandidates, filters]);

  const averageScore = useMemo(() => {
    if (activeSlotItems.length === 0 || filtered.length === 0) return null;
    const sum = filtered.reduce((acc, c) => acc + c.score, 0);
    return Math.round(sum / filtered.length);
  }, [filtered, activeSlotItems]);

  async function expressInterest(candidate: ScoredCandidate) {
    if (persistingIds.has(candidate.item.id)) return;

    const sourceItem = activeSlotItems[0] ?? null;
    const supabase = getSupabaseClient();
    setPersistingIds((prev) => new Set(prev).add(candidate.item.id));

    const persisted = supabase
      ? await persistMatchCandidate(supabase, {
          userId,
          sourceItem,
          candidate,
          slotPosition: selected.length + 1,
        })
      : null;

    setSelected((prev) => {
      if (prev.length >= 2) return prev;
      if (prev.some((p) => p.itemId === candidate.item.id)) return prev;
      return [
        ...prev,
        {
          itemId: candidate.item.id,
          ownerId: candidate.item.owner_id,
          item: candidate.item,
          score: candidate.score,
          matchId: persisted?.id,
        },
      ];
    });
    setPersistingIds((prev) => {
      const next = new Set(prev);
      next.delete(candidate.item.id);
      return next;
    });
    setDrawerItem(null);
  }

  function declineSelected(itemId: string) {
    setSelected((prev) => prev.filter((p) => p.itemId !== itemId));
  }

  function markConverted(itemId: string, result: { swapId: string; conversationId: string }) {
    setSelected((prev) =>
      prev.map((entry) =>
        entry.itemId === itemId
          ? {
              ...entry,
              swapId: result.swapId,
              conversationId: result.conversationId,
            }
          : entry,
      ),
    );
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
            onOpenItem={(c) => setDrawerItem(c)}
          />

          <MatchingMap candidates={filtered} />

          <MatchingAIButton
            userId={userId}
            slotItemId={slot1Id ?? slot2Id}
            excludeIds={selected.map((s) => s.itemId)}
            slotsFull={selected.length >= 2}
            onSuggestion={(item, score) => {
              const existing = filtered.find((f) => f.item.id === item.id);
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
            onDecline={declineSelected}
            onConverted={markConverted}
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
