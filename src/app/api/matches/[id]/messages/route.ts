// src/app/api/matches/[id]/messages/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { ChatMessage, CreateMessageInput } from "@/features/chat/types";

/**
 * GET /api/matches/:id/messages
 * Returnează toate mesajele dintr-un match.
 */
export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const matchId = context.params.id;

    if (!matchId) {
      return NextResponse.json(
        { ok: false, error: "missing_match_id" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // --------------------------
    // 1. Verificăm user-ul
    // --------------------------
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json(
        { ok: false, error: "not_authenticated" },
        { status: 401 }
      );
    }

    const userId = user.id;

    // --------------------------
    // 2. Verificăm dacă user-ul
    //    face parte din match
    // --------------------------
    const { data: match, error: matchErr } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .maybeSingle();

    if (matchErr || !match) {
      return NextResponse.json(
        { ok: false, error: "match_not_found" },
        { status: 404 }
      );
    }

    if (match.userAId !== userId && match.userBId !== userId) {
      return NextResponse.json(
        { ok: false, error: "forbidden" },
        { status: 403 }
      );
    }

    // --------------------------
    // 3. Luăm mesajele ordonate
    // --------------------------
    const { data: messages, error: msgErr } = await supabase
      .from("messages")
      .select("*")
      .eq("matchId", matchId)
      .order("createdAt", { ascending: true });

    if (msgErr) {
      console.error("[MATCH_MESSAGES_ERROR]", msgErr);
      return NextResponse.json(
        { ok: false, error: "db_error_fetch_messages" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, messages: (messages ?? []) as ChatMessage[] });
  } catch (err) {
    console.error("[MATCH_MESSAGES_UNEXPECTED_ERROR]", err);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/matches/:id/messages
 * Creează un mesaj nou.
 */
export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const matchId = context.params.id;

    if (!matchId) {
      return NextResponse.json(
        { ok: false, error: "missing_match_id" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const body = (await req.json().catch(() => ({}))) as Partial<CreateMessageInput>;
    const content = body.content?.trim();

    // ------------------------------------------------------
    // 1. Validare input
    // ------------------------------------------------------
    if (!content || content.length === 0) {
      return NextResponse.json(
        { ok: false, error: "empty_message" },
        { status: 400 }
      );
    }

    // ------------------------------------------------------
    // 2. Autentificare
    // ------------------------------------------------------
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json(
        { ok: false, error: "not_authenticated" },
        { status: 401 }
      );
    }

    const userId = user.id;

    // ------------------------------------------------------
    // 3. Confirmăm că userul este parte din match
    // ------------------------------------------------------
    const { data: match, error: matchErr } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .maybeSingle();

    if (matchErr || !match) {
      return NextResponse.json(
        { ok: false, error: "match_not_found" },
        { status: 404 }
      );
    }

    if (match.userAId !== userId && match.userBId !== userId) {
      return NextResponse.json(
        { ok: false, error: "forbidden" },
        { status: 403 }
      );
    }

    // ------------------------------------------------------
    // 4. Inserăm mesajul
    // ------------------------------------------------------
    const now = new Date().toISOString();

    const { data: inserted, error: insertErr } = await supabase
      .from("messages")
      .insert({
        matchId,
        senderId: userId,
        content,
        createdAt: now,
      })
      .select("*")
      .single();

    if (insertErr) {
      console.error("[MESSAGE_INSERT_ERROR]", insertErr);
      return NextResponse.json(
        { ok: false, error: "db_error_insert_message" },
        { status: 500 }
      );
    }

    // ------------------------------------------------------
    // 5. Actualizăm updatedAt pe match (pentru listă)
    // ------------------------------------------------------
    await supabase
      .from("matches")
      .update({ updatedAt: now })
      .eq("id", matchId);

    return NextResponse.json(
      { ok: true, message: inserted as ChatMessage },
      { status: 201 }
    );
  } catch (err) {
    console.error("[MESSAGE_POST_UNEXPECTED_ERROR]", err);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 }
    );
  }
}
