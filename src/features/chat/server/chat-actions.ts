// src/features/chat/server/chat-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { chatRepository } from "./chat-repository";
import { matchRepository } from "@/features/matches/server/matches-repository";
import type { CreateMessageInput, ChatThread, ChatMessage } from "../types";

export async function getThreadAction(matchId: string): Promise<ChatThread | null> {
  const supabase = createServerClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) return null;

  // verificăm accesul la match (dacă repo-ul tău are funcția asta)
  const match = await matchRepository.getById(matchId);
  if (!match) return null;

  const isMember = match.userAId === user.id || match.userBId === user.id;
  if (!isMember) return null;

  return await chatRepository.getThread(matchId);
}

export async function listThreadMessagesAction(
  matchId: string,
): Promise<ChatMessage[]> {
  const supabase = createServerClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) return [];

  const match = await matchRepository.getById(matchId);
  if (!match) return [];

  const isMember = match.userAId === user.id || match.userBId === user.id;
  if (!isMember) return [];

  return await chatRepository.listMessages(matchId);
}

export async function createMessageAction(
  input: CreateMessageInput,
): Promise<ChatMessage> {
  const supabase = createServerClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    throw new Error("not_authenticated");
  }

  const matchId = input.matchId;
  const match = await matchRepository.getById(matchId);

  if (!match) {
    throw new Error("match_not_found");
  }

  const isMember = match.userAId === user.id || match.userBId === user.id;
  if (!isMember) {
    throw new Error("not_allowed");
  }

  const created = await chatRepository.createMessage({
    matchId,
    senderId: user.id,
    // NOTE: input-ul tău poate avea `message` sau `content` în loc de `text`.
    // Îl tratăm “safe” fără să stricăm tipurile:
    ...(input as any),
  });

  // revalidate unde ai pagina de chat (ajustez generic)
  revalidatePath(`/matches/${matchId}`);

  return created;
}
