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
import { ChatDrawer } from "./drawer/ChatDrawer";
import { useDrawerStore } from "@/lib/state/drawerStore";
import { subscribeToConversation, broadcastTyping, markConversationRead } from "@/lib/chat/chatRealtime";
import {
  buildInitialAgenda,
  setAgendaItemStatus,
  allRequiredAgreed,
  AGENDA_ITEMS,
  isItemAgreed,
} from "@/lib/chat/chatAgenda";
import { buildSummary, approveSummary } from "@/lib/chat/chatSummary";
import type { RealtimeMessage } from "@/lib/chat/chatRealtime";
import type { AgendaState, AgendaStatus } from "@/lib/chat/chatAgenda";
import type { SwapSummary } from "@/lib/chat/chatSummary";
import type { PendingMedia } from "./ChatMediaUpload";
import type { HaikuSummaryPayload } from "./ChatSummary";

interface ConversationMeta {
  id: string;
  participantIds: [string, string];
  partnerId: string;
  partnerName: string;
  partnerAvatarUrl?: string | null;
  partnerVerified?: boolean;
  swapId?: string | null;
  itemATitle?: string;
  itemBTitle?: string;
  agendaState?: AgendaState;
  summary?: SwapSummary | null;
  haikuPayload?: HaikuSummaryPayload | null;
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
  const [haikuPayload, setHaikuPayload] = useState<HaikuSummaryPayload | null>(null);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
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
        const { data: conv } = await sb
          .from("conversations")
          .select("*")
          .eq("id", conversationId)
          .maybeSingle();

        if (conv) {
          const partnerId = (conv.participant_ids as string[]).find(
            (id: string) => id !== user!.id,
          ) ?? "";

          const { data: profile } = await sb
            .from("profiles")
            .select("display_name, avatar_url, phone_verified, id_verified")
            .eq("user_id", partnerId)
            .maybeSingle();

          const rawSummary = conv.summary as (SwapSummary & { haiku?: HaikuSummaryPayload }) | null;

          setMeta({
            id: conv.id,
            participantIds: conv.participant_ids as [string, string],
            partnerId,
            partnerName: (profile?.display_name as string) ?? partnerId.slice(0, 8),
            partnerAvatarUrl: profile?.avatar_url as string | null,
            partnerVerified: !!(profile?.phone_verified || profile?.id_verified),
            swapId: (conv.swap_id as string | null) ?? null,
            agendaState: (conv.agenda_state as AgendaState) ?? buildInitialAgenda(),
            summary: rawSummary,
            haikuPayload: rawSummary?.haiku ?? null,
          });

          if (conv.agenda_state) setAgendaState(conv.agenda_state as AgendaState);
          if (rawSummary) setSummary(rawSummary);
          if (rawSummary?.haiku) setHaikuPayload(rawSummary.haiku);
        } else {
          const parts = conversationId.replace("dm:", "").split(":");
          const partnerId = parts.find((p) => p !== user!.id) ?? "";
          setMeta({
            id: conversationId,
            participantIds: [user!.id, partnerId] as [string, string],
            partnerId,
            partnerName: partnerId.slice(0, 8),
          });
        }

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

  // ── Agenda toggle (checkbox-style) ──

  const handleToggleAgenda = useCallback(async (key: string, nextStatus: AgendaStatus) => {
    if (!user || !conversationId) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const newState = setAgendaItemStatus(agendaState, key, myRole, nextStatus);
    setAgendaState(newState);

    await supabase
      .from("conversations")
      .update({ agenda_state: newState })
      .eq("id", conversationId);

    if (nextStatus === "agreed") {
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        struct_conv_id: conversationId,
        sender_id: user.id,
        content: `✅ ${key}`,
        message_type: "agenda_update",
      });
    }
  }, [agendaState, myRole, user, conversationId]);

  // ── Summary generation via Claude Haiku (with kill switch) ──

  const handleGenerateSummary = useCallback(async () => {
    if (!meta || !user) throw new Error("missing_context");

    const agreedPoints = AGENDA_ITEMS
      .filter((def) => isItemAgreed(agendaState, def.key, myRole))
      .map((def) => ({ key: def.key, label: def.labelKey }));

    const userALabel = myRole === "userA" ? (user.displayName ?? "You") : meta.partnerName;
    const userBLabel = myRole === "userB" ? (user.displayName ?? "You") : meta.partnerName;

    const res = await fetch("/api/chat/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemATitle: meta.itemATitle ?? "Item A",
        itemBTitle: meta.itemBTitle ?? "Item B",
        userALabel,
        userBLabel,
        agreedPoints,
      }),
    });

    if (!res.ok) {
      throw new Error("upstream_error");
    }

    const json = (await res.json()) as { disabled?: boolean; summary?: HaikuSummaryPayload };
    if (json.disabled) {
      throw new Error("disabled");
    }
    if (!json.summary) {
      throw new Error("invalid_response");
    }

    const haiku = json.summary;
    const base = buildSummary(
      agendaState,
      { id: "a", title: meta.itemATitle ?? "Item A", ownerId: user.id } as Parameters<typeof buildSummary>[1],
      { id: "b", title: meta.itemBTitle ?? "Item B", ownerId: meta.partnerId } as Parameters<typeof buildSummary>[2],
      userALabel,
      userBLabel,
      myRole,
    );

    setSummary(base);
    setHaikuPayload(haiku);

    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase
        .from("conversations")
        .update({ summary: { ...base, haiku } })
        .eq("id", conversationId);
    }
  }, [meta, user, agendaState, myRole, conversationId]);

  // ── Approve summary (bilateral → redirect to exchange) ──

  const handleApproveSummary = useCallback(async () => {
    if (!summary || !user || !meta) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const updated = approveSummary(summary, user.id);
    setSummary(updated);

    const bothApproved = meta.participantIds.every((id) => updated.approvedBy.includes(id));

    await supabase
      .from("conversations")
      .update({
        summary: { ...updated, haiku: haikuPayload },
        summary_approved_by: updated.approvedBy,
        ...(bothApproved ? { status: "agreed" } : {}),
      })
      .eq("id", conversationId);
  }, [summary, haikuPayload, user, meta, conversationId]);

  // Unauthenticated: render a demo skeleton with disabled input
  if (!user) {
    const demoMessages: (RealtimeMessage & { content: string })[] = [
      {
        id: "demo-m1",
        struct_conv_id: conversationId,
        sender_id: "demo-partner",
        content: t("guestMockMsg1"),
        message_type: "text",
        created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        read_by: [],
      },
      {
        id: "demo-m2",
        struct_conv_id: conversationId,
        sender_id: "demo-me",
        content: t("guestMockMsg2"),
        message_type: "text",
        created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        read_by: [],
      },
      {
        id: "demo-m3",
        struct_conv_id: conversationId,
        sender_id: "demo-partner",
        content: t("guestMockMsg3"),
        message_type: "text",
        created_at: new Date(Date.now() - 1000 * 60).toISOString(),
        read_by: [],
      },
    ];

    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col">
        <ChatHeader
          partnerName={t("guestMockUser1")}
          partnerAvatarUrl={null}
          isPartnerVerified={false}
          onOpenDrawer={() => undefined}
        />
        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-1 flex-col overflow-hidden">
            <ChatMessages
              messages={demoMessages}
              currentUserId="demo-me"
              partnerTyping={false}
              partnerName={t("guestMockUser1")}
              loading={false}
            />
            <ChatInput
              onSend={() => undefined}
              onTyping={() => undefined}
              loginRequired
            />
          </div>
        </div>
      </div>
    );
  }

  const partnerName = meta?.partnerName ?? "...";
  const canGenerate = allRequiredAgreed(agendaState);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <ChatHeader
        partnerName={partnerName}
        partnerAvatarUrl={meta?.partnerAvatarUrl}
        isPartnerVerified={meta?.partnerVerified}
        onOpenDrawer={() => {
          setDrawerOpen(true);
          useDrawerStore.getState().openWith({ type: "chat", conversationId });
        }}
      />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat zone */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <ChatMessages
            messages={messages}
            currentUserId={user.id}
            partnerTyping={partnerTyping}
            partnerName={partnerName}
            loading={loading}
          />

          {meta && (
            <div className="border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
              <ChatSummary
                summary={summary}
                haikuPayload={haikuPayload}
                currentUserId={user.id}
                partnerName={partnerName}
                participantIds={meta.participantIds}
                canGenerate={canGenerate}
                swapId={meta.swapId ?? null}
                onGenerate={handleGenerateSummary}
                onApprove={handleApproveSummary}
              />
            </div>
          )}

          <ChatInput onSend={handleSend} onTyping={handleTyping} />
        </div>

        {/* Agenda sidebar (desktop only) */}
        <div className="hidden w-72 shrink-0 overflow-y-auto border-l border-zinc-100 p-3 dark:border-zinc-800 lg:block">
          <ChatAgenda
            agendaState={agendaState}
            myRole={myRole}
            partnerName={partnerName}
            onToggle={handleToggleAgenda}
            onGenerateSummary={() => {
              void handleGenerateSummary().catch(() => {
                /* ChatSummary surfaces errors to the user */
              });
            }}
            defaultOpen
          />
        </div>

        {/* Drawer (inline right panel when opened) */}
        {drawerOpen && meta && (
          <div className="hidden w-80 shrink-0 overflow-y-auto border-l border-zinc-100 dark:border-zinc-800 xl:block">
            <ChatDrawer
              conversationId={conversationId}
              partnerId={meta.partnerId}
              partnerName={partnerName}
              messages={messages}
              agendaState={agendaState}
              myRole={myRole}
              onClose={() => setDrawerOpen(false)}
            />
          </div>
        )}
      </div>

      {/* Agenda accordion (mobile) */}
      <div className="border-t border-zinc-100 p-2 dark:border-zinc-800 lg:hidden">
        <ChatAgenda
          agendaState={agendaState}
          myRole={myRole}
          partnerName={partnerName}
          onToggle={handleToggleAgenda}
          onGenerateSummary={() => {
            void handleGenerateSummary().catch(() => {
              /* ChatSummary surfaces errors to the user */
            });
          }}
          defaultOpen={false}
        />
      </div>
    </div>
  );
}
