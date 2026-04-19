"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { getSupabaseClient } from "@/lib/supabase/client";
import { ChatHeader } from "./ChatHeader";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { ChatAgenda } from "./ChatAgenda";
import { ChatSummary } from "./ChatSummary";
import { useDrawerStore } from "@/lib/state/drawerStore";
import { subscribeToConversation, broadcastTyping, markConversationRead } from "@/lib/chat/chatRealtime";
import { buildInitialAgenda, advanceAgendaItem } from "@/lib/chat/chatAgenda";
import { buildSummary, approveSummary } from "@/lib/chat/chatSummary";
import type { RealtimeMessage } from "@/lib/chat/chatRealtime";
import type { AgendaState } from "@/lib/chat/chatAgenda";
import type { SwapSummary } from "@/lib/chat/chatSummary";
import type { PendingMedia } from "./ChatMediaUpload";

interface ConversationMeta {
  id: string;
  participantIds: [string, string];
  partnerName: string;
  partnerAvatarUrl?: string | null;
  partnerVerified?: boolean;
  agendaState?: AgendaState;
  summary?: SwapSummary | null;
}

interface Props {
  conversationId: string;
}

export function ChatPage({ conversationId }: Props) {
  const t = useTranslations("chat");
  const { user } = useAppState();

  const [meta, setMeta] = useState<ConversationMeta | null>(null);
  const [messages, setMessages] = useState<(RealtimeMessage & { content: string })[]>([]);
  const [agendaState, setAgendaState] = useState<AgendaState>(buildInitialAgenda());
  const [summary, setSummary] = useState<SwapSummary | null>(null);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const myRole: "userA" | "userB" =
    meta && user ? (meta.participantIds[0] === user.id ? "userA" : "userB") : "userA";

  // ── Load conversation + messages ──

  useEffect(() => {
    if (!user || !conversationId) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;
    const sb = supabase;

    async function load() {
      setLoading(true);
      try {
        // Load conversation metadata
        const { data: conv } = await sb
          .from("conversations")
          .select("*")
          .eq("id", conversationId)
          .maybeSingle();

        if (conv) {
          const partnerId = (conv.participant_ids as string[]).find((id: string) => id !== user!.id) ?? "";
          // Load partner profile
          const { data: profile } = await sb
            .from("profiles")
            .select("display_name, avatar_url, phone_verified, id_verified")
            .eq("user_id", partnerId)
            .maybeSingle();

          setMeta({
            id: conv.id,
            participantIds: conv.participant_ids as [string, string],
            partnerName: (profile?.display_name as string) ?? partnerId.slice(0, 8),
            partnerAvatarUrl: profile?.avatar_url as string | null,
            partnerVerified: !!(profile?.phone_verified || profile?.id_verified),
            agendaState: conv.agenda_state as AgendaState ?? buildInitialAgenda(),
            summary: conv.summary as SwapSummary | null,
          });

          if (conv.agenda_state) setAgendaState(conv.agenda_state as AgendaState);
          if (conv.summary) setSummary(conv.summary as SwapSummary);
        } else {
          // Fallback: derive from DM conversation_id format
          const parts = conversationId.replace("dm:", "").split(":");
          const partnerId = parts.find((p) => p !== user!.id) ?? "";
          setMeta({
            id: conversationId,
            participantIds: [user!.id, partnerId] as [string, string],
            partnerName: partnerId.slice(0, 8),
          });
        }

        // Load recent messages (structured conv)
        const { data: msgs } = await sb
          .from("messages")
          .select("*")
          .or(`struct_conv_id.eq.${conversationId},conversation_id.eq.${conversationId}`)
          .order("created_at", { ascending: true })
          .limit(200);

        if (msgs) {
          setMessages(msgs.map((m: Record<string, unknown>) => ({
            id: m.id as string,
            struct_conv_id: (m.struct_conv_id ?? m.conversation_id) as string,
            sender_id: (m.sender_id ?? m.senderId) as string,
            content: (m.content as string) ?? "",
            message_type: (m.message_type as string) ?? "text",
            media_url: m.media_url as string | null,
            media_type: m.media_type as string | null,
            created_at: (m.created_at as string) ?? "",
            read_by: (m.read_by as string[]) ?? [],
          })));
        }

        // Mark messages as read
        await markConversationRead(sb, conversationId, user!.id);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [conversationId, user]);

  // ── Realtime subscription ──

  useEffect(() => {
    if (!user || !conversationId) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const unsubscribe = subscribeToConversation(
      supabase,
      conversationId,
      (msg) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, { ...msg, content: msg.content ?? "" }];
        });
      },
      (userId, isTyping) => {
        if (userId === user.id) return;
        setPartnerTyping(isTyping);
        if (isTyping) {
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setPartnerTyping(false), 3000);
        }
      },
    );

    return unsubscribe;
  }, [conversationId, user]);

  // ── Send message ──

  const handleSend = useCallback(async (text: string, media: PendingMedia | null) => {
    if (!user || !conversationId) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const messageType = media?.type ?? "text";

    // Optimistic insert
    const optimistic: RealtimeMessage & { content: string } = {
      id: `opt-${Date.now()}`,
      struct_conv_id: conversationId,
      sender_id: user.id,
      content: text,
      message_type: messageType,
      media_url: media?.previewUrl ?? null,
      media_type: media?.type ?? null,
      created_at: new Date().toISOString(),
      read_by: [],
    };
    setMessages((prev) => [...prev, optimistic]);

    const { data, error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      struct_conv_id: conversationId,
      sender_id: user.id,
      content: text,
      message_type: messageType,
      media_url: media?.previewUrl ?? null,
    }).select("*").maybeSingle();

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      return;
    }

    if (data) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimistic.id ? { ...data, content: data.content ?? "" } : m,
        ),
      );
    }
  }, [user, conversationId]);

  // ── Typing broadcast ──

  const handleTyping = useCallback((isTyping: boolean) => {
    if (!user || !conversationId) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    broadcastTyping(supabase, conversationId, user.id, isTyping);
  }, [user, conversationId]);

  // ── Agenda ──

  const handleAdvanceAgenda = useCallback(async (key: string) => {
    if (!user || !conversationId) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const newState = advanceAgendaItem(agendaState, key, myRole);
    setAgendaState(newState);

    // Persist to conversations table
    await supabase
      .from("conversations")
      .update({ agenda_state: newState })
      .eq("id", conversationId);

    // Send system message
    const item = meta?.partnerName ? `${user.displayName ?? "You"} updated agenda: ${key}` : key;
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      struct_conv_id: conversationId,
      sender_id: user.id,
      content: `✅ ${item}`,
      message_type: "agenda_update",
    });
  }, [agendaState, myRole, user, conversationId, meta]);

  // ── Summary ──

  const handleGenerateSummary = useCallback(async () => {
    if (!meta || !user) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const myName = user.displayName ?? "You";
    const newSummary = buildSummary(
      agendaState,
      { id: "a", title: "Item A", ownerId: user.id } as Parameters<typeof buildSummary>[1],
      { id: "b", title: "Item B", ownerId: meta.participantIds.find(id => id !== user.id) ?? "" } as Parameters<typeof buildSummary>[2],
      myName,
      meta.partnerName,
      myRole,
    );
    setSummary(newSummary);
    await supabase.from("conversations").update({ summary: newSummary }).eq("id", conversationId);
  }, [meta, user, agendaState, myRole, conversationId]);

  const handleApproveSummary = useCallback(async () => {
    if (!summary || !user) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const updated = approveSummary(summary, user.id);
    setSummary(updated);
    await supabase.from("conversations").update({ summary: updated, summary_approved_by: updated.approvedBy }).eq("id", conversationId);
  }, [summary, user, conversationId]);

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-zinc-400">{t("signInRequired")}</p>
      </div>
    );
  }

  const partnerName = meta?.partnerName ?? "...";

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <ChatHeader
        partnerName={partnerName}
        partnerAvatarUrl={meta?.partnerAvatarUrl}
        isPartnerVerified={meta?.partnerVerified}
        onOpenDrawer={() => useDrawerStore.getState().openWith({ type: "chat", conversationId })}
      />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat zone */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Messages */}
          <ChatMessages
            messages={messages}
            currentUserId={user.id}
            partnerTyping={partnerTyping}
            partnerName={partnerName}
            loading={loading}
          />

          {/* Summary (if generated) */}
          {summary && meta && (
            <div className="border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
              <ChatSummary
                summary={summary}
                currentUserId={user.id}
                partnerName={partnerName}
                participantIds={meta.participantIds}
                onApprove={handleApproveSummary}
                conversationId={conversationId}
              />
            </div>
          )}

          {/* Input */}
          <ChatInput onSend={handleSend} onTyping={handleTyping} />
        </div>

        {/* Agenda sidebar (desktop only) */}
        <div className="hidden w-72 shrink-0 overflow-y-auto border-l border-zinc-100 p-3 dark:border-zinc-800 lg:block">
          <ChatAgenda
            agendaState={agendaState}
            myRole={myRole}
            partnerName={partnerName}
            onAdvance={handleAdvanceAgenda}
            onGenerateSummary={handleGenerateSummary}
            defaultOpen
          />
        </div>
      </div>

      {/* Agenda accordion (mobile) */}
      <div className="border-t border-zinc-100 p-2 dark:border-zinc-800 lg:hidden">
        <ChatAgenda
          agendaState={agendaState}
          myRole={myRole}
          partnerName={partnerName}
          onAdvance={handleAdvanceAgenda}
          onGenerateSummary={handleGenerateSummary}
          defaultOpen={false}
        />
      </div>

    </div>
  );
}
