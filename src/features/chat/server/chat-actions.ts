// src/features/chat/server/chat-actions.ts

"use server";

import { createServerClient } from "@/lib/supabase/server";
import { chatRepository } from "./chat-repository";
import { matchesRepository } from "@/features/matches/server/matches-repository";
import type { CreateMessageInput, ChatThread, ChatMessage } from "../types";
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
 * Verifică dacă userul aparține match-ului.
 * Dacă nu, aruncă eroare.
 */
async function ensureMatchAccess(matchId: string, userId: string) {
  const match = await matchesRepository.getMatchById(matchId, userId);
  if (!match) {
    throw new Error("Acces interzis la acest match.");
  }
  return match;
}

/**
 * Obține toate mesajele unui match.
 */
export async function getThreadAction(matchId: string): Promise<ChatThread> {
  const userId = await requireUserId();
  await ensureMatchAccess(matchId, userId);

  return await chatRepository.getThread(matchId);
}

/**
 * Creează un mesaj nou într-un match.
 */
export async function createMessageAction(
  input: CreateMessageInput,
): Promise<ChatMessage> {
  const userId = await requireUserId();
  await ensureMatchAccess(input.matchId, userId);

  const message = await chatRepository.createMessage(input, userId);

  // Revalidăm pagina de chat și lista de match-uri
  revalidatePath(`/matches/${input.matchId}`);
  revalidatePath(`/matches`);

  return message;
}
