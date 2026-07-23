import type { SupabaseClient } from "@supabase/supabase-js";

export type ChatDeliveryPreferences = {
  inApp: boolean;
  email: boolean;
  push: boolean;
};

export function normalizeChatDeliveryPreferences(
  row: Record<string, unknown> | null | undefined,
): ChatDeliveryPreferences {
  return {
    inApp: row?.message_inapp !== false,
    email: row?.message_email === true,
    push: row?.message_push !== false,
  };
}

export function isExactLocationPayload(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.lat === "number" ||
    typeof record.lng === "number" ||
    typeof record.latitude === "number" ||
    typeof record.longitude === "number" ||
    typeof record.address === "string" ||
    typeof record.street === "string"
  );
}

export async function canParticipantsChat(
  supabase: SupabaseClient,
  participantA: string,
  participantB: string,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("can_users_chat_v1", {
    p_participant_a: participantA,
    p_participant_b: participantB,
  });

  if (error) {
    console.error("canParticipantsChat failed", error);
    return false;
  }

  return data === true;
}

export async function createChatMessageNotification(
  supabase: SupabaseClient,
  input: {
    recipientId: string;
    senderId: string;
    conversationId: string;
    swapId?: string | null;
    matchId?: string | null;
    messageId: string;
    preview: string;
    flagged?: boolean;
  },
): Promise<void> {
  const { data: preferences } = await supabase
    .from("notification_preferences")
    .select("message_inapp, message_email, message_push")
    .eq("user_id", input.recipientId)
    .maybeSingle();
  const delivery = normalizeChatDeliveryPreferences(
    preferences as Record<string, unknown> | null,
  );

  if (!delivery.inApp && !delivery.email && !delivery.push) return;

  await supabase.from("notifications").insert({
    user_id: input.recipientId,
    type: input.flagged ? "message_flagged" : "message",
    title: input.flagged ? "Potentially risky message" : "New Swaply message",
    body: input.preview.slice(0, 140),
    data: {
      conversation_id: input.conversationId,
      swap_id: input.swapId ?? null,
      match_id: input.matchId ?? null,
      message_id: input.messageId,
      sender_id: input.senderId,
      delivery,
      email_queued: delivery.email,
    },
    read: false,
    is_read: false,
    priority: input.flagged ? "high" : "normal",
    source_type: "chat_message",
    source_id: input.messageId,
    dedupe_key: `chat:${input.messageId}:${input.recipientId}`,
  });
}
