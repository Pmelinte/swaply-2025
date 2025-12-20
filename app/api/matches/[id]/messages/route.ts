// src/app/api/matches/[id]/messages/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { ChatMessage } from "@/features/chat/types";
import { createMessageNotification } from "@/lib/notifications/create-message-notification";

type ApiResponse =
  | { ok: true; messages: ChatMessage[] }
  | { ok: true; message: ChatMessage }
  | { ok: false; error: string };

function mapDbMessage(row: any): ChatMessage {
  return {
    id: row.id,
    matchId: row.match_id,
    senderId: row.sender_id,
    content: row.content,
    createdAt: row.created_at,
  };
}

/**
 * GET /api/matches/:id/messages
 * Returnează toate mesajele dintr-un match.
 */
export async function GET(
  req: NextRequest,
  context: { params: { id: string } },
): Promise<NextResponse<ApiResponse>> {
  try {
    const matchId = context.params.id;

    if (!matchId) {
      return NextResponse.json(
        { ok: false, error: "missing_match_id" },
        { status: 400 },
      );
    }

    const supabase = createServerClient();

    // 1) User autentificat
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json(
        { ok: false, error: "not_authenticated" },
        { status: 401 },
      );
    }

    const userId = user.id;

    // 2) Verificăm dacă userul participă în match
    const { data: match, error: matchErr } = await supabase
      .from("matches")
      .select("id, userAId, userBId")
      .eq("id", matchId)
      .maybeSingle();

    if (matchErr || !match) {
      return NextResponse.json(
        { ok: false, error: "match_not_found" },
        { status: 404 },
      );
    }

    if (match.userAId !== userId && match.userBId !== userId) {
      return NextResponse.json(
        { ok: false, error: "forbidden" },
        { status: 403 },
      );
    }

    // 3) Luăm mesajele
    const { data: rows, error: msgErr } = await supabase
      .from("messages")
      .select("*")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true });

    if (msgErr) {
      console.error("[MATCH_MESSAGES_ERROR]", msgErr);
      return NextResponse.json(
        { ok: false, error: "db_error_fetch_messages" },
        { status: 500 },
      );
    }

    const messages = (rows ?? []).map(mapDbMessage);

    return NextResponse.json({ ok: true, messages }, { status: 200 });
  } catch (err) {
    console.error("[MATCH_MESSAGES_UNEXPECTED_ERROR]", err);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/matches/:id/messages
 * Body: { content: string }
 * Creează un mesaj nou în match + notificare pentru celălalt user (best-effort).
 */
export async function POST(
  req: NextRequest,
  context: { params: { id: string } },
): Promise<NextResponse<ApiResponse>> {
  try {
    const matchId = context.params.id;

    if (!matchId) {
      return NextResponse.json(
        { ok: false, error: "missing_match_id" },
        { status: 400 },
      );
    }

    const body = (await req.json().catch(() => ({}))) as { content?: string };
    const content = (body.content ?? "").trim();

    if (!content) {
      return NextResponse.json(
        { ok: false, error: "missing_content" },
        { status: 400 },
      );
    }

    const supabase = createServerClient();

    // 1) User autentificat
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json(
        { ok: false, error: "not_authenticated" },
        { status: 401 },
      );
    }

    const userId = user.id;

    // 2) Verificăm dacă userul participă în match
    const { data: match, error: matchErr } = await supabase
      .from("matches")
      .select("id, userAId, userBId")
      .eq("id", matchId)
      .maybeSingle();

    if (matchErr || !match) {
      return NextResponse.json(
        { ok: false, error: "match_not_found" },
        { status: 404 },
      );
    }

    if (match.userAId !== userId && match.userBId !== userId) {
      return NextResponse.json(
        { ok: false, error: "forbidden" },
        { status: 403 },
      );
    }

    const otherUserId =
      match.userAId === userId ? match.userBId : match.userAId;

    // 3) Insert mesaj (snake_case)
    const payload = {
      match_id: matchId,
      sender_id: userId,
      content,
      is_read: false,
    };

    const { data: inserted, error: insErr } = await supabase
      .from("messages")
      .insert(payload)
      .select("*")
      .single();

    if (insErr || !inserted) {
      console.error("[MATCH_MESSAGE_INSERT_ERROR]", insErr);
      return NextResponse.json(
        { ok: false, error: "db_error_insert_message" },
        { status: 500 },
      );
    }

    const message = mapDbMessage(inserted);

    // 4) Notificare pentru interlocutor (best-effort, nu blocăm mesajul)
    if (otherUserId) {
      await createMessageNotification({
        matchId,
        senderId: userId,
        receiverId: otherUserId,
        messagePreview: content,
      });
    }

    return NextResponse.json({ ok: true, message }, { status: 201 });
  } catch (err) {
    console.error("[MATCH_MESSAGE_POST_UNEXPECTED_ERROR]", err);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 },
    );
  }
}