// src/lib/notifications/create-message-notification.ts

import { createServerClient } from "@/lib/supabase/server";

/**
 * Creează o notificare de tip "new_message" pentru interlocutor.
 *
 * Se apelează DUPĂ ce un mesaj a fost inserat cu succes în DB.
 */
export async function createMessageNotification(params: {
  matchId: string;
  senderId: string;
  receiverId: string;
  messagePreview: string;
}) {
  const { matchId, senderId, receiverId, messagePreview } = params;

  const supabase = createServerClient();

  // Evităm notificări către sine
  if (senderId === receiverId) return;

  const title = "Mesaj nou";
  const body =
    messagePreview.length > 120
      ? messagePreview.slice(0, 117) + "…"
      : messagePreview;

  const { error } = await supabase.from("notifications").insert({
    user_id: receiverId,
    type: "new_message",
    entity_id: matchId,
    title,
    body,
    is_read: false,
  });

  if (error) {
    console.error("[CREATE_MESSAGE_NOTIFICATION_ERROR]", error);
  }
}