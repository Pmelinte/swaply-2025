// src/features/swipe/server/swipe-repository.ts

import { createServerClient } from "@/lib/supabase/server";
import type {
  SwipeEvent,
  Match,
  CreateSwipeInput,
  SwipeResult,
  SwipeDirection,
  SwipeKind,
} from "../types";

/**
 * Map DB row -> SwipeEvent
 */
const mapDbSwipe = (row: any): SwipeEvent => {
  return {
    id: row.id,
    swiperUserId: row.swiper_user_id,
    targetItemId: row.target_item_id,
    targetOwnerId: row.target_owner_id,
    kind: row.kind,
    direction: row.direction,
    createdAt: row.created_at,
  };
};

/**
 * Map DB row -> Match
 */
const mapDbMatch = (row: any): Match => {
  return {
    id: row.id,
    userAId: row.user_a_id,
    userBId: row.user_b_id,
    userAItemId: row.user_a_item_id,
    userBItemId: row.user_b_item_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

/**
 * Determină dacă o direcție poate genera match
 */
const isPositiveDirection = (direction: SwipeDirection): boolean => {
  return direction === "like" || direction === "superlike";
};

/**
 * Pentru un swipe de tip "supply" căutăm un swipe "demand" invers și invers.
 */
const oppositeKind = (kind: SwipeKind): SwipeKind =>
  kind === "supply" ? "demand" : "supply";

export const swipeRepository = {
  /**
   * Creează un swipe nou și, dacă găsește un swipe complementar,
   * creează și un match.
   *
   * Schema DB (de așteptat, vom face migrațiile ulterior):
   *
   * Table: swipes
   * - id uuid pk
   * - swiper_user_id uuid
   * - target_item_id uuid
   * - target_owner_id uuid
   * - kind text ("supply" | "demand")
   * - direction text ("like" | "dislike" | "superlike")
   * - created_at timestamptz
   *
   * Table: matches
   * - id uuid pk
   * - user_a_id uuid
   * - user_b_id uuid
   * - user_a_item_id uuid nullable
   * - user_b_item_id uuid nullable
   * - status text ("pending" | "active" | "closed")
   * - created_at timestamptz
   * - updated_at timestamptz
   */
  async createSwipeForUser(
    input: CreateSwipeInput,
    currentUserId: string,
  ): Promise<SwipeResult> {
    const supabase = createServerClient();

    // 1) Aflăm owner-ul item-ului target
    const { data: itemRow, error: itemError } = await supabase
      .from("items")
      .select("id, owner_id")
      .eq("id", input.targetItemId)
      .single();

    if (itemError || !itemRow) {
      console.error("createSwipeForUser: item not found", itemError);
      throw new Error("Obiectul nu există sau nu mai este disponibil.");
    }

    const targetOwnerId = itemRow.owner_id as string;

    if (targetOwnerId === currentUserId) {
      throw new Error("Nu poți face swipe pe propriul obiect.");
    }

    // 2) Inserăm swipe-ul curent în DB
    const swipePayload = {
      swiper_user_id: currentUserId,
      target_item_id: input.targetItemId,
      target_owner_id: targetOwnerId,
      kind: input.kind,
      direction: input.direction,
    };

    const { data: swipeData, error: swipeError } = await supabase
      .from("swipes")
      .insert(swipePayload)
      .select("*")
      .single();

    if (swipeError || !swipeData) {
      console.error("createSwipeForUser: insert swipe error", swipeError);
      throw new Error("Nu s-a putut înregistra swipe-ul.");
    }

    const swipeEvent = mapDbSwipe(swipeData);

    // 3) Dacă nu e un swipe pozitiv, nu are sens să căutăm match
    if (!isPositiveDirection(input.direction)) {
      return { swipe: swipeEvent, createdMatch: null };
    }

    // 4) Căutăm un swipe complementar din partea celuilalt user
    // care a fost deja înregistrat anterior.
    //
    // Complementar = celălalt user a dat like/superlike pe un item
    // al userului curent, în fluxul opus (supply <-> demand).
    const { data: oppositeSwipes, error: oppositeError } = await supabase
      .from("swipes")
      .select("*")
      .eq("swiper_user_id", targetOwnerId)
      .eq("target_owner_id", currentUserId)
      .eq("kind", oppositeKind(input.kind))
      .in("direction", ["like", "superlike"])
      .order("created_at", { ascending: false })
      .limit(1);

    if (oppositeError) {
      console.error("createSwipeForUser: find opposite swipe error", oppositeError);
      // Nu aruncăm eroare aici, swipe-ul e deja logat.
      return { swipe: swipeEvent, createdMatch: null };
    }

    if (!oppositeSwipes || oppositeSwipes.length === 0) {
      // Nimeni nu a dat încă like înapoi -> nu avem match
      return { swipe: swipeEvent, createdMatch: null };
    }

    const oppositeSwipe = oppositeSwipes[0];

    // 5) Înainte să creăm match, verificăm dacă nu există deja un match
    // activ/pending între aceiași useri
    const { data: existingMatches, error: matchCheckError } = await supabase
      .from("matches")
      .select("*")
      .or(
        `and(user_a_id.eq.${currentUserId},user_b_id.eq.${targetOwnerId}),and(user_a_id.eq.${targetOwnerId},user_b_id.eq.${currentUserId})`,
      )
      .in("status", ["pending", "active"])
      .limit(1);

    if (matchCheckError) {
      console.error(
        "createSwipeForUser: error checking existing matches",
        matchCheckError,
      );
      // Nu blocăm flow-ul de swipe, dar nu creăm match.
      return { swipe: swipeEvent, createdMatch: null };
    }

    if (existingMatches && existingMatches.length > 0) {
      // Avem deja un match între cei doi -> nu mai facem altul
      return { swipe: swipeEvent, createdMatch: mapDbMatch(existingMatches[0]) };
    }

    // 6) Creăm match nou
    const matchPayload = {
      user_a_id: currentUserId,
      user_b_id: targetOwnerId,
      user_a_item_id:
        input.kind === "supply" ? input.targetItemId : oppositeSwipe.target_item_id,
      user_b_item_id:
        input.kind === "supply" ? oppositeSwipe.target_item_id : input.targetItemId,
      status: "pending" as const,
    };

    const { data: matchData, error: matchError } = await supabase
      .from("matches")
      .insert(matchPayload)
      .select("*")
      .single();

    if (matchError || !matchData) {
      console.error("createSwipeForUser: create match error", matchError);
      // Swipe-ul rămâne valid chiar dacă nu putem crea match
      return { swipe: swipeEvent, createdMatch: null };
    }

    const match = mapDbMatch(matchData);

    return {
      swipe: swipeEvent,
      createdMatch: match,
    };
  },
};
