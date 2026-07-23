import { NextResponse } from "next/server";
import {
  canParticipantsChat,
  createChatMessageNotification,
} from "@/lib/chat/chatDelivery";
import { moderateText } from "@/lib/moderation/moderationEngine";
import { getServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MAX_TEXT_LENGTH = 4000;
const ALLOWED_MESSAGE_TYPES = new Set(["text", "image", "audio", "video"]);
const ALLOWED_MEDIA_URL_PROTOCOLS = new Set(["https:", "blob:"]);
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_MESSAGES = 20;

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

type RequestBody = {
  conversationId?: unknown;
  content?: unknown;
  messageType?: unknown;
  mediaUrl?: unknown;
};

function cleanContent(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function cleanMessageType(value: unknown): string {
  return typeof value === "string" && ALLOWED_MESSAGE_TYPES.has(value) ? value : "text";
}

function cleanMediaUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    const url = new URL(value);
    return ALLOWED_MEDIA_URL_PROTOCOLS.has(url.protocol) ? url.toString() : null;
  } catch {
    return value.startsWith("blob:") ? value : null;
  }
}

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(userId);

  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (bucket.count >= RATE_LIMIT_MAX_MESSAGES) return false;
  bucket.count += 1;
  return true;
}

export async function POST(req: Request) {
  const supabase = await getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!checkRateLimit(user.id)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const conversationId = typeof body.conversationId === "string" ? body.conversationId : "";
  const content = cleanContent(body.content);
  const messageType = cleanMessageType(body.messageType);
  const mediaUrl = cleanMediaUrl(body.mediaUrl);

  if (!conversationId) {
    return NextResponse.json({ error: "conversation_required" }, { status: 400 });
  }

  if (!content && !mediaUrl) {
    return NextResponse.json({ error: "content_required" }, { status: 400 });
  }

  if (content.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ error: "content_too_long" }, { status: 400 });
  }

  if (messageType !== "text" && !mediaUrl) {
    return NextResponse.json({ error: "media_required" }, { status: 400 });
  }

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("id, swap_id, match_id, participant_ids")
    .eq("id", conversationId)
    .maybeSingle();

  if (conversationError) {
    return NextResponse.json({ error: conversationError.message }, { status: 500 });
  }

  const participantIds = Array.isArray(conversation?.participant_ids)
    ? (conversation.participant_ids as string[])
    : [];

  if (!conversation || participantIds.length !== 2 || !participantIds.includes(user.id)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const recipientId = participantIds.find((id) => id !== user.id);
  if (!recipientId) {
    return NextResponse.json({ error: "recipient_not_found" }, { status: 400 });
  }

  const canChat = await canParticipantsChat(supabase, user.id, recipientId);
  if (!canChat) {
    return NextResponse.json({ error: "blocked_conversation" }, { status: 403 });
  }

  const moderation = content ? moderateText(content) : null;
  if (moderation?.recommended_action === "block") {
    return NextResponse.json(
      { error: "blocked_by_moderation", moderation },
      { status: 422 },
    );
  }

  const { data: message, error: messageError } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversation.id,
      struct_conv_id: conversation.id,
      swap_id: conversation.swap_id ?? null,
      match_id: conversation.match_id ?? null,
      sender_id: user.id,
      recipient_id: recipientId,
      content,
      message_type: messageType,
      media_url: mediaUrl,
      media_type: messageType === "text" ? null : messageType,
      attachments: mediaUrl
        ? [{ url: mediaUrl, type: messageType, moderation_status: "pending" }]
        : [],
      metadata: {
        source: "chat_messages_api",
        moderation,
      },
      is_read: false,
    })
    .select("*")
    .single();

  if (messageError) {
    return NextResponse.json({ error: messageError.message }, { status: 500 });
  }

  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversation.id);

  await createChatMessageNotification(supabase, {
    recipientId,
    senderId: user.id,
    conversationId: conversation.id,
    swapId: conversation.swap_id ?? null,
    matchId: conversation.match_id ?? null,
    messageId: message.id,
    preview: content || "New media message",
    flagged: (moderation?.risk_score ?? 0) >= 30,
  });

  return NextResponse.json({ message });
}
