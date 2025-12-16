// src/features/chat/server/chat-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { chatRepository } from "./chat-repository";
import type { CreateMessageInput, ChatThread, ChatMessage } from "../types";

/**
 * Helpers
 */
async function requireUser() {
  const supabase = createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("not_authenticated");
  }

  return { supabase, user };
}

async function assertMatchMembership(
  supabase: any,
  matchId: string,
  userId: string,
) {
  const { data: match, error } = await supabase
    .from("matches")
    .select("id,userAId,userBId")
    .eq("id", matchId)
    .maybeSingle();

  if (error || !match) throw new Error("match_not_found");

  const isMember = match.userAId === userId || match.userBId === userId;
  if (!isMember) throw new Error("not_allowed");

  return match as { id: string; userAId: string; userBId: string };
}

export async function getThreadAction(matchId: string): Promise<ChatThread | null> {
  try {
    const { supabase, user } = await requireUser();
    await assertMatchMembership(supabase, matchId, user.id);
    return await chatRepository.getThread(matchId);
  } catch {
    return null;
  }
}

/**
 * ✅ Mesajele le luăm direct din DB, ca să nu depindem de un repo method inexistent.
 */
export async function listThreadMessagesAction(
  matchId: string,
): Promise<ChatMessage[]> {
  try {
    const { supabase, user } = await requireUser();
    await assertMatchMembership(supabase, matchId, user.id);

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true });

    if (error) return [];
    return (data as ChatMessage[]) ?? [];
  } catch {
    return [];
  }
}

export async function createMessageAction(
  input: CreateMessageInput,
): Promise<ChatMessage> {
  const { supabase, user } = await requireUser();

  const matchId = (input as any).matchId as string;
  if (!matchId) throw new Error("missing_match_id");

  await assertMatchMembership(supabase, matchId, user.id);

  // Nu presupunem numele câmpului pentru conținut; îl extragem “safe”.
  const content =
    (input as any).text ??
    (input as any).message ??
    (input as any).content ??
    null;

  if (!content || typeof content !== "string" || !content.trim()) {
    throw new Error("missing_message_content");
  }

  // ✅ Semnătura reală din repo-ul tău: createMessage(input, senderId)
  const created = await chatRepository.createMessage(
    {
      ...(input as any),
      matchId,
      // punem content în toate variantele, ca să nu pierdem mesajul
      text: content.trim(),
      message: content.trim(),
      content: content.trim(),
    } as any,
    user.id,
  );

  revalidatePath(`/matches/${matchId}`);
  return created;
}
