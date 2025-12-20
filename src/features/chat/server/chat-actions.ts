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

async function assertSwapMembership(
  supabase: any,
  swapId: string,
  userId: string,
) {
  const { data: swap, error } = await supabase
    .from("swaps")
    .select("id,from_user,to_user")
    .eq("id", swapId)
    .maybeSingle();

  if (error || !swap) throw new Error("swap_not_found");

  const isMember = swap.from_user === userId || swap.to_user === userId;
  if (!isMember) throw new Error("not_allowed");

  return swap as { id: string; from_user: string; to_user: string };
}

export async function getThreadAction(swapId: string): Promise<ChatThread | null> {
  try {
    const { supabase, user } = await requireUser();
    await assertSwapMembership(supabase, swapId, user.id);
    return await chatRepository.getThread(swapId);
  } catch {
    return null;
  }
}

/**
 * ✅ Mesajele le luăm direct din DB, ca să nu depindem de un repo method inexistent.
 */
export async function listThreadMessagesAction(
  swapId: string,
): Promise<ChatMessage[]> {
  try {
    const { supabase, user } = await requireUser();
    await assertSwapMembership(supabase, swapId, user.id);

    const { data, error } = await supabase
      .from("swap_messages")
      .select("*")
      .eq("swap_id", swapId)
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

  const swapId = (input as any).swapId as string;
  if (!swapId) throw new Error("missing_swap_id");

  await assertSwapMembership(supabase, swapId, user.id);

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
      swapId,
      // punem content în toate variantele, ca să nu pierdem mesajul
      text: content.trim(),
      message: content.trim(),
      content: content.trim(),
    } as any,
    user.id,
  );

  revalidatePath(`/swaps/${swapId}`);
  return created;
}
