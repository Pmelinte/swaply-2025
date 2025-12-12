// src/app/api/matches/[id]/messages/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { ChatMessage } from "@/features/chat/types";

/**
 * GET /api/matches/:id/messages
 * POST /api/matches/:id/messages
 */

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
): Promise<
  NextResponse<
    | { ok: true; messages: ChatMessage[] }
    | { ok: false; error: string }
  >
> {
  try {
    const matchId = context.params.id;
    if (!matchId) {
      return NextResponse.json(
        { ok: false, error: "missing_match_id" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

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

    const { data: match } = await supabase
      .from("matches")
      .select("id, userAId, userBId")
      .eq("id", matchId)
      .maybeSingle();

    if (!match) {
      return NextResponse.json(
        { ok: false, error: "match_not_found" },
        { status: 404 }
      );
    }

    if (match.userAId !== user.id && match.userBId !== user.id) {
      return NextResponse.json(
        { ok: false, error: "forbidden" },
        { status: 403 }
      );
    }

    const { data: rows, error } = await supabase
      .from("messages")
      .select("*")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[MATCH_MESSAGES_GET_ERROR]", error);
      return NextResponse.json(
        { ok: false, error: "db_error_fetch_messages" },
        { status: 500 }
      );
    }

    const messages: ChatMessage[] =
      rows?.map((r: any) => ({
        id: r.id,
        matchId: r.match_id,
        senderId: r.sender_id,
        content: r.content,
        createdAt: r.created_at,
      })) ?? [];

    return NextResponse.json({ ok: true, messages });
  } catch (err) {
    console.error("[MATCH_MESSAGES_GET_UNEXPECTED]", err);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
): Promise<
  NextResponse<
    | { ok: true; message: ChatMessage }
    | { ok: false; error: string }
  >
> {
  try {
    const matchId = context.params.id;
    if (!matchId) {
      return NextResponse.json(
        { ok: false, error: "missing_match_id" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => null);
    const content = body?.content;

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { ok: false, error: "invalid_content" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

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

    const { data: match } = await supabase
      .from("matches")
      .select("id, userAId, userBId")
      .eq("id", matchId)
      .maybeSingle();

    if (!match) {
      return NextResponse.json(
        { ok: false, error: "match_not_found" },
        { status: 404 }
      );
    }

    if (match.userAId !== user.id && match.userBId !== user.id) {
      return NextResponse.json(
        { ok: false, error: "forbidden" },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("messages")
      .insert({
        match_id: matchId,
        sender_id: user.id,
        content,
      })
      .select("*")
      .single();

    if (error || !data) {
      console.error("[MATCH_MESSAGES_POST_ERROR]", error);
      return NextResponse.json(
        { ok: false, error: "db_error_insert_message" },
        { status: 500 }
      );
    }

    const message: ChatMessage = {
      id: data.id,
      matchId: data.match_id,
      senderId: data.sender_id,
      content: data.content,
      createdAt: data.created_at,
    };

    return NextResponse.json({ ok: true, message }, { status: 200 });
  } catch (err) {
    console.error("[MATCH_MESSAGES_POST_UNEXPECTED]", err);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 }
    );
  }
}