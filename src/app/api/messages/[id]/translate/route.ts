import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import {
  getCachedTranslation,
  mergeTranslationMetadata,
  translateMessageFallback,
} from "@/lib/translation/chatTranslation";

type MessageRow = {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  metadata: Record<string, unknown> | null;
  conversation_id: string | null;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { targetLanguage?: string };
  const targetLanguage = body.targetLanguage || "en";

  const { data, error } = await supabase
    .from("messages")
    .select("id, sender_id, recipient_id, content, metadata, conversation_id")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  const message = data as MessageRow;
  if (message.sender_id !== user.id && message.recipient_id !== user.id) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const cached = getCachedTranslation(message.metadata, targetLanguage);
  if (cached) return NextResponse.json({ translation: cached, cached: true });

  const translation = await translateMessageFallback({
    text: message.content,
    targetLanguage,
    sourceLanguage:
      typeof message.metadata?.detected_language === "string"
        ? message.metadata.detected_language
        : undefined,
  });

  const nextMetadata = mergeTranslationMetadata(message.metadata, translation);

  await supabase
    .from("messages")
    .update({ metadata: nextMetadata })
    .eq("id", message.id);

  return NextResponse.json({ translation, cached: false });
}
