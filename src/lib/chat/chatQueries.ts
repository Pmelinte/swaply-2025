import type { SupabaseClient } from "@supabase/supabase-js";

export type ConversationRow = {
  id: string;
  swap_id: string | null;
  participant_ids: string[];
  item_ids: string[];
  status: string | null;
  agenda_state: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
};

export type MessageRow = {
  id: string;
  swap_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  attachments: unknown[] | null;
  read_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  is_read: boolean;
  conversation_id: string | null;
  message_type: string | null;
};

export async function fetchUserConversations(
  supabase: SupabaseClient,
  userId: string,
): Promise<ConversationRow[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select("id, swap_id, participant_ids, item_ids, status, agenda_state, created_at, updated_at")
    .contains("participant_ids", [userId])
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("fetchUserConversations failed", error);
    return [];
  }

  return (data ?? []) as ConversationRow[];
}

export async function fetchConversationMessages(
  supabase: SupabaseClient,
  conversationId: string,
): Promise<MessageRow[]> {
  const { data, error } = await supabase
    .from("messages")
    .select(
      "id, swap_id, sender_id, recipient_id, content, attachments, read_at, metadata, created_at, is_read, conversation_id, message_type",
    )
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) {
    console.error("fetchConversationMessages failed", error);
    return [];
  }

  return (data ?? []) as MessageRow[];
}

export async function sendConversationMessage(
  supabase: SupabaseClient,
  input: {
    conversation: ConversationRow;
    senderId: string;
    content: string;
  },
): Promise<MessageRow | null> {
  const recipientId = input.conversation.participant_ids.find((id) => id !== input.senderId);
  if (!recipientId || !input.conversation.swap_id || input.content.trim().length === 0) return null;

  const { data, error } = await supabase
    .from("messages")
    .insert({
      swap_id: input.conversation.swap_id,
      sender_id: input.senderId,
      recipient_id: recipientId,
      content: input.content.trim(),
      conversation_id: input.conversation.id,
      message_type: "text",
      metadata: {
        source: "chat_page",
      },
      is_read: false,
    })
    .select(
      "id, swap_id, sender_id, recipient_id, content, attachments, read_at, metadata, created_at, is_read, conversation_id, message_type",
    )
    .single();

  if (error) {
    console.error("sendConversationMessage failed", error);
    return null;
  }

  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", input.conversation.id);

  await supabase.from("notifications").insert({
    user_id: recipientId,
    type: "message",
    title: "New Swaply message",
    body: input.content.trim().slice(0, 140),
    data: {
      conversation_id: input.conversation.id,
      swap_id: input.conversation.swap_id,
      message_id: data.id,
    },
    read: false,
    is_read: false,
    priority: "normal",
  });

  return data as MessageRow;
}
