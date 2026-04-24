"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
  subscribeToConversation,
  broadcastTyping,
  markConversationRead,
} from "@/lib/chat/chatRealtime";
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

interface DemoFixture {
  partnerUsername: string;
  partnerAvatar: string | null;
  itemA: string;
  itemB: string;
  messages: (RealtimeMessage & { content: string })[];
}

const DEMO_CONVERSATIONS: Record<string, DemoFixture> = {
  "demo-1": {
    partnerUsername: "demo_user",
    partnerAvatar: null,
    itemA: "Laptop",
    itemB: "Bicycle",
    messages: [],
  },
  "demo-2": {
    partnerUsername: "alex_demo",
    partnerAvatar: null,
    itemA: "Bicicletă Trek",
    itemB: "Laptop Dell",
    messages: [],
  },
  "demo-3": {
    partnerUsername: "maria_demo",
    partnerAvatar: null,
    itemA: "Cameră foto Canon",
    itemB: "Telefon Samsung",
    messages: [],
  },
};

function isDemoConversation(id: string): boolean {
  return id.startsWith("demo-");
}

function getDemoFixture(id: string): DemoFixture {
  return (
    DEMO_CONVERSATIONS[id] ?? {
      partnerUsername: id.replace(/^demo-/, "") || "demo_user",
      partnerAvatar: null,
      itemA: "Item A",
      itemB: "Item B",
      messages: [],
    }
  );
}

interface Props {
  conversationId: string;
}

export function ChatPage({ conversationId }: Props) {
  const t = useTranslations("chat");
  const { user } = useAppState();

  const demoMode = isDemoConversation(conversationId);
  const demo = useMemo(
    () => (demoMode ? getDemoFixture(conversationId) : null),
    [demoMode, conversationId],
  );

  const [meta, setMeta] = useState<ConversationMeta | null>(null);
  const [messages, setMessages] = useState<(RealtimeMessage & { content: string })[]>([]);
  const [agendaState, setAgendaState] = useState<AgendaState>(buildInitialAgenda());
  const [summary, setSummary] = useState<SwapSummary | null>(null);
  const [haikuPayload, setHaikuPayload] = useState<HaikuSummaryPayload | null>(null);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [loading, setLoading] = useState(!demoMode);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const myRole: "userA" | "userB" =
    meta && user ? (meta.participantIds[0] === user.id ? "userA" : "userB") : "userA";

  // ── Demo fixtures: skip Supabase fetch, seed local state ──

  useEffect(() => {
    if (!demoMode || !demo) return;
    const meId = user?.id ?? "demo-me";
    const partnerId = `demo-partner-${conversationId}`;
    setMeta({
      id: conversationId,
      participantIds: [meId, partnerId] as [string, string],
      partnerId,
      partnerName: demo.partnerUsername,
      partnerAvatarUrl: demo.partnerAvatar,
      partnerVerified: false,
      swapId: null,
      itemATitle: demo.itemA,
      itemBTitle: demo.itemB,
    });
    setMessages(demo.messages);
    setLoading(false);
  }, [demoMode, demo, conversationId, user]);

  // ── Load conversation + messages (real, authenticated) ──

  useEffect(() => {
    if (demoMode) return;
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
          const partnerId =
            (conv.participant_ids as string[]).find((id: string) => id !== user!.id) ?? "";

          const { data: profile } = await sb
            .from("profiles")
            .select("display_name, avatar_url, phone_verified, id_verified")
            .eq("user_id", partnerId)
            .maybeSingle();

          const rawSummary = conv.summary as
            | (SwapSummary & { haiku?: HaikuSummaryPayload })
            | null;

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
          setMessages(
            msgs.map((m: Record<string, unknown>) => ({
              id: m.id as string,
              struct_conv_id: (m.struct_conv_id ?? m.conversation_id) as string,
              sender_id: (m.sender_id ?? m.senderId) as string,
              content: (m.content as string) ?? "",
              message_type: (m.message_type as string) ?? "text",
              media_url: m.media_url as string | null,
              media_type: m.media_type as string | null,
              created_at: (m.created_at as string) ?? "",
              read_by: (m.read_by as string[]) ?? [],
            })),
          );
        }

        await markConversationRead(sb, conversationId, user!.id);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [conversationId, user, demoMode]);

  // ── Realtime subscription (skip for demos) ──

  useEffect(() => {
    if (demoMode) return;
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
  }, [conversationId, user, demoMode]);

  // ── Send message ──

  const handleSend = useCallback(
    async (text: string, media: PendingMedia | null) => {
      if (!conversationId) return;

      if (demoMode) {
        const local: RealtimeMessage & { content: string } = {
          id: `demo-${Date.now()}`,
          struct_conv_id: conversationId,
          sender_id: user?.id ?? "demo-me",
          content: text,
          message_type: media?.type ?? "text",
          media_url: media?.previewUrl ?? null,
          media_type: media?.type ?? null,
          created_at: new Date().toISOString(),
          read_by: [],
        };
        setMessages((prev) => [...prev, local]);
        return;
      }

      if (!user) return;
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

      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          struct_conv_id: conversationId,
          sender_id: user.id,
          content: text,
          message_type: messageType,
          media_url: media?.previewUrl ?? null,
        })
        .select("*")
        .maybeSingle();

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
    },
    [user, conversationId, demoMode],
  );

  // ── Typing broadcast ──

  const handleTyping = useCallback(
    (isTyping: boolean) => {
      if (demoMode) return;
      if (!user || !conversationId) return;
      const supabase = getSupabaseClient();
      if (!supabase) return;
      broadcastTyping(supabase, conversationId, user.id, isTyping);
    },
    [user, conversationId, demoMode],
  );

  // ── Agenda toggle ──

  const handleToggleAgenda = useCallback(
    async (key: string, nextStatus: AgendaStatus) => {
      const newState = setAgendaItemStatus(agendaState, key, myRole, nextStatus);
      setAgendaState(newState);

      if (demoMode || !user) return;

      const supabase = getSupabaseClient();
      if (!supabase) return;

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
    },
    [agendaState, myRole, user, conversationId, demoMode],
  );

  // ── Summary generation ──

  const handleGenerateSummary = useCallback(async () => {
    if (!meta) throw new Error("missing_context");

    const agreedPoints = AGENDA_ITEMS.filter((def) =>
      isItemAgreed(agendaState, def.key, myRole),
    ).map((def) => ({ key: def.key, label: def.labelKey }));

    const meLabel = user?.displayName ?? "You";
    const userALabel = myRole === "userA" ? meLabel : meta.partnerName;
    const userBLabel = myRole === "userB" ? meLabel : meta.partnerName;

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

    if (!res.ok) throw new Error("upstream_error");

    const json = (await res.json()) as {
      disabled?: boolean;
      summary?: HaikuSummaryPayload;
    };
    if (json.disabled) throw new Error("disabled");
    if (!json.summary) throw new Error("invalid_response");

    const haiku = json.summary;
    const meId = user?.id ?? meta.participantIds[0];
    const base = buildSummary(
      agendaState,
      { id: "a", title: meta.itemATitle ?? "Item A", ownerId: meId } as Parameters<
        typeof buildSummary
      >[1],
      { id: "b", title: meta.itemBTitle ?? "Item B", ownerId: meta.partnerId } as Parameters<
        typeof buildSummary
      >[2],
      userALabel,
      userBLabel,
      myRole,
    );

    setSummary(base);
    setHaikuPayload(haiku);

    if (demoMode) return;
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase
        .from("conversations")
        .update({ summary: { ...base, haiku } })
        .eq("id", conversationId);
    }
  }, [meta, user, agendaState, myRole, conversationId, demoMode]);

  // ── Approve summary ──

  const handleApproveSummary = useCallback(async () => {
    if (!summary || !meta) return;
    const approverId = user?.id ?? meta.participantIds[0];

    const updated = approveSummary(summary, approverId);
    setSummary(updated);

    if (demoMode || !user) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    const bothApproved = meta.participantIds.every((id) => updated.approvedBy.includes(id));

    await supabase
      .from("conversations")
      .update({
        summary: { ...updated, haiku: haikuPayload },
        summary_approved_by: updated.approvedBy,
        ...(bothApproved ? { status: "agreed" } : {}),
      })
      .eq("id", conversationId);
  }, [summary, haikuPayload, user, meta, conversationId, demoMode]);

  // ── Header props ──

  const headerPartnerName = meta?.partnerName ?? demo?.partnerUsername ?? "...";
  const headerAvatar = meta?.partnerAvatarUrl ?? demo?.partnerAvatar ?? null;
  const headerVerified = meta?.partnerVerified ?? false;

  function handleOpenDrawer() {
    setDrawerOpen(true);
    if (!demoMode) {
      useDrawerStore.getState().openWith({ type: "chat", conversationId });
    }
  }

  // ── Render ──

  const canGenerate = allRequiredAgreed(agendaState);

  const summaryElement =
    meta && (user || demoMode) ? (
      <ChatSummary
        summary={summary}
        haikuPayload={haikuPayload}
        currentUserId={user?.id ?? "demo-me"}
        partnerName={headerPartnerName}
        participantIds={meta.participantIds}
        canGenerate={canGenerate}
        swapId={meta.swapId ?? null}
        onGenerate={handleGenerateSummary}
        onApprove={handleApproveSummary}
      />
    ) : null;

  // Guest (no user, no demo fixture) — show login prompt inline, but keep layout
  const isGuest = !user && !demoMode;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Main row: chat column + agenda sidebar (+ optional drawer) */}
      <div className="flex min-h-0 flex-1">
        {/* Chat column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <ChatHeader
            partnerName={headerPartnerName}
            partnerAvatarUrl={headerAvatar}
            isPartnerVerified={headerVerified}
            onOpenDrawer={handleOpenDrawer}
          />

          {isGuest ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {t("signInRequired")}
              </p>
            </div>
          ) : (
            <ChatMessages
              messages={messages}
              currentUserId={user?.id ?? "demo-me"}
              partnerTyping={partnerTyping}
              partnerName={headerPartnerName}
              loading={loading}
            />
          )}

          <ChatInput
            onSend={handleSend}
            onTyping={handleTyping}
            loginRequired={isGuest}
          />
        </div>

        {/* Agenda sidebar (desktop only) */}
        <aside className="hidden w-80 shrink-0 border-l border-zinc-100 dark:border-zinc-800 lg:block">
          <ChatAgenda
            variant="sidebar"
            agendaState={agendaState}
            myRole={myRole}
            partnerName={headerPartnerName}
            onToggle={handleToggleAgenda}
            onGenerateSummary={() => {
              void handleGenerateSummary().catch(() => {
                /* ChatSummary surfaces errors */
              });
            }}
            summarySlot={summaryElement}
          />
        </aside>

        {/* Right-side drawer (inline panel on xl+) */}
        {drawerOpen && meta && !demoMode && (
          <div className="hidden w-80 shrink-0 overflow-y-auto border-l border-zinc-100 dark:border-zinc-800 xl:block">
            <ChatDrawer
              conversationId={conversationId}
              partnerId={meta.partnerId}
              partnerName={headerPartnerName}
              messages={messages}
              agendaState={agendaState}
              myRole={myRole}
              onClose={() => setDrawerOpen(false)}
            />
          </div>
        )}
      </div>

      {/* Agenda accordion (mobile only) — lives below the main row */}
      <div className="shrink-0 border-t border-zinc-100 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900 lg:hidden">
        <ChatAgenda
          variant="accordion"
          agendaState={agendaState}
          myRole={myRole}
          partnerName={headerPartnerName}
          onToggle={handleToggleAgenda}
          onGenerateSummary={() => {
            void handleGenerateSummary().catch(() => {
              /* ChatSummary surfaces errors */
            });
          }}
          summarySlot={summaryElement}
          defaultOpen={false}
        />
      </div>
    </div>
  );
}
