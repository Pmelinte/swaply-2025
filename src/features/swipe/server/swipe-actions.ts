// src/features/swipe/server/swipe-actions.ts

"use server";

import { createServerClient } from "@/lib/supabase/server";
import { swipeRepository } from "./swipe-repository";
import type { CreateSwipeInput, SwipeResult } from "../types";
import { revalidatePath } from "next/cache";

/**
 * Returnează user-ul autentificat sau aruncă eroare.
 */
async function requireUserId(): Promise<string> {
  const supabase = createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Not authenticated");
  }

  return user.id;
}

/**
 * Acțiunea principală pentru swipe.
 * Foarte simplă: normalizează input-ul → repo → rezultat.
 */
export async function swipeAction(input: CreateSwipeInput): Promise<SwipeResult> {
  const userId = await requireUserId();

  const result = await swipeRepository.createSwipeForUser(input, userId);

  // Revalidăm pagini unde ar putea conta informația nouă
  revalidatePath("/swipe/supply");
  revalidatePath("/swipe/demand");
  revalidatePath("/matches");

  return result;
}

/**
 * Helper specific pentru supply flow
 */
export async function supplySwipeAction(
  itemId: string,
  direction: "like" | "dislike" | "superlike",
): Promise<SwipeResult> {
  return await swipeAction({
    targetItemId: itemId,
    direction,
    kind: "supply",
  });
}

/**
 * Helper specific pentru demand flow
 */
export async function demandSwipeAction(
  itemId: string,
  direction: "like" | "dislike" | "superlike",
): Promise<SwipeResult> {
  return await swipeAction({
    targetItemId: itemId,
    direction,
    kind: "demand",
  });
}
