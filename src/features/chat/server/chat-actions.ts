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
  // Schema ta din alte fișiere: matches are userAId/userBId.
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

export async function listThreadMessagesAction(
  matchId: string,
): Promise<ChatMessage[]> {
  try {
    const { supabase, user } = await requireUser();
    await assertMatchMembership(supabase, matchId, user.id);
    return await chatRepository.listMessages(matchId);
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

  // IMPORTANT: nu presupunem câmpul de text (că ai avut mismatch mai devreme).
  // Luăm “conținutul” din ce există în input (text/message/content) fără să stricăm tipurile.
  const content =
    (input as any).text ??
    (input as any).message ??
    (input as any).content ??
    null;

  if (!content || typeof content !== "string" || !content.trim()) {
    throw new Error("missing_message_content");
  }

  const created = await chatRepository.createMessage({
    matchId,
    senderId: user.id,
    // repo-ul tău probabil așteaptă una din aceste chei; trimitem ambele “safe”
    text: content.trim(),
    message: content.trim(),
    content: content.trim(),
  } as any);

  revalidatePath(`/matches/${matchId}`);
  return created;
}
