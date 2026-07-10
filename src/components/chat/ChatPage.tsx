"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useAppState } from "@/lib/state";
import { getSupabaseClient } from "@/lib/supabase/client";
import { ChatHeader } from "./ChatHeader";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { SwapChecklist } from "./SwapChecklist";
import { ChatSummary } from "./ChatSummary";
import { ChatConversationHistory } from "./ChatConversationHistory";
import { CAT, getListingCat } from "@/lib/categoryColors";

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
  const router = useRouter();
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
  const [historyOpen, setHistoryOpen] = useState(false);
  const [releaseModalOpen, setReleaseModalOpen] = useState(false);
  const [myListingType, setMyListingType] = useState<string | null>(null);
  const [partnerListingType, setPartnerListingType] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const myRole: "userA" | "userB" =
    meta && user ? (meta.participantIds[0] === user.id ? "userA" : "userB") : "userA";

  // ── Demo fixtures ──

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

  // ── Load conversation + messages ──

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
            .from("public_profiles")
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
          setSessionStatus((conv.session_status as string) ?? "active");

          // Detect listing types for category border
          const itemIds = conv.item_ids as string[] | null;
          if (itemIds && itemIds.length > 0) {
            const { data: itemsData } = await sb
              .from("items")
              .select("id, listing_type, owner_id")
              .in("id", itemIds)
              .limit(2);
            if (itemsData) {
              const myItem = itemsData.find(
                (it: Record<string, unknown>) => it.owner_id === user!.id,
              );
              const theirItem = itemsData.find(
                (it: Record<string, unknown>) => it.owner_id !== user!.id,
              );
              if (myItem?.listing_type) setMyListingType(myItem.listing_type as string);
              if (theirItem?.listing_type) setPartnerListingType(theirItem.listing_type as string);
            }
          }
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

  // ── Realtime subscription ──

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

  // ── Agenda item status ──

  const handleAgendaItemStatus = useCallback(
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

  // ── Continue later (pause session) ──

  const handleContinueLater = useCallback(async () => {
    setSessionStatus("paused");
    if (demoMode || !user) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    await supabase
      .from("conversations")
      .update({ session_status: "paused" })
      .eq("id", conversationId);
  }, [conversationId, demoMode, user]);

  // ── New session ──

  const handleNewSession = useCallback(async () => {
    if (demoMode || !user || !meta) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const { data: convData } = await supabase
      .from("conversations")
      .select("session_number")
      .eq("id", conversationId)
      .maybeSingle();
    const nextSession = ((convData?.session_number as number) ?? 1) + 1;

    const { data: newConv } = await supabase
      .from("conversations")
      .insert({
        participant_ids: meta.participantIds,
        swap_id: meta.swapId,
        session_number: nextSession,
        session_status: "active",
        agenda_state: buildInitialAgenda(),
      })
      .select("id")
      .maybeSingle();

    if (newConv?.id) {
      router.push(`/chat/${newConv.id as string}`);
    }
  }, [demoMode, user, meta, conversationId, router]);

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

  // ── Release item (Back to Matching) ──

  const handleConfirmRelease = useCallback(async () => {
    setReleaseModalOpen(false);

    if (!demoMode && user && meta?.swapId) {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase
          .from("swaps")
          .update({ status: "cancelled" })
          .eq("id", meta.swapId);
      }
    }

    router.push("/matching");
  }, [demoMode, user, meta, router]);

  // ── Derived values ──

  const headerPartnerName = meta?.partnerName ?? demo?.partnerUsername ?? "...";
  const headerAvatar = meta?.partnerAvatarUrl ?? demo?.partnerAvatar ?? null;
  const headerVerified = meta?.partnerVerified ?? false;
  const isGuest = !user && !demoMode;
  const canGenerate = allRequiredAgreed(agendaState);

  // ── Category border style (gradient for cross-category) ──

  const myCat = getListingCat(myListingType);
  const partnerCat = getListingCat(partnerListingType);
  const isCrossCategory = myListingType && partnerListingType && myCat !== partnerCat;
  const borderStyle: React.CSSProperties = isCrossCategory
    ? {
        borderLeft: "4px solid transparent",
        backgroundImage: `linear-gradient(white, white), linear-gradient(to bottom, ${CAT[myCat].hex}, ${CAT[partnerCat].hex})`,
        backgroundOrigin: "border-box",
        backgroundClip: "padding-box, border-box",
      }
    : {
        borderLeft: `4px solid ${CAT[myCat].hex}`,
      };

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

  // ── Render ──

  return (
    // Escape parent wrapper padding; fill viewport between TopBar (44px) and FooterNav (73px)
    <div className="relative flex -mx-4 -mt-4 overflow-hidden bg-white h-[calc(100dvh-44px-73px)]">

      {/* ── Drawer: Conversation History (left overlay, 280px) ── */}
      <ChatConversationHistory
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        userId={user?.id}
        currentConversationId={conversationId}
      />

      {/* ── Left column: main chat area ── */}
      <div
        className="flex flex-col flex-1 min-w-0 overflow-hidden"
        style={borderStyle}
      >
        {/* Zone 0: Subheader / ChatHeader (53px) */}
        <ChatHeader
          partnerName={headerPartnerName}
          partnerAvatarUrl={headerAvatar}
          isPartnerVerified={headerVerified}
          historyOpen={historyOpen}
          sessionStatus={sessionStatus}
          onToggleHistory={() => setHistoryOpen((prev) => !prev)}
          onNewSession={handleNewSession}
        />

        {/* Zone 1: Chat messages (flex-1, internal scroll) */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {isGuest ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
              <p className="text-sm text-zinc-500">{t("signInRequired")}</p>
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
        </div>

        {/* Zone 2: Toolbar (~80px) */}
        <ChatInput
          onSend={handleSend}
          onTyping={handleTyping}
          loginRequired={isGuest}
        />

        {/* Zone 3: CTA (~72px) */}
        <div className="flex shrink-0 items-center gap-2 border-t border-zinc-100 bg-white px-3 py-3">
          <button
            type="button"
            onClick={() => router.push("/exchange")}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <span>→</span>
            Swaply
          </button>
          <button
            type="button"
            onClick={() => setReleaseModalOpen(true)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-300 px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            <span>←</span>
            Back to Matching
          </button>
        </div>
      </div>

      {/* ── Right column: Swap Checklist (fixed, hidden on mobile) ── */}
      <div className="hidden lg:flex w-72 shrink-0 flex-col border-l border-zinc-100 overflow-hidden">
        <SwapChecklist
          agendaState={agendaState}
          myRole={myRole}
          partnerName={headerPartnerName}
          onToggle={handleAgendaItemStatus}
          onContinueLater={handleContinueLater}
          onGoToExchange={() => router.push("/exchange")}
        />
        {/* Summary pinned below checklist if generated */}
        {summaryElement && (
          <div className="shrink-0 border-t border-zinc-100 p-3">
            {summaryElement}
          </div>
        )}
      </div>

      {/* ── Release confirmation modal ── */}
      {releaseModalOpen && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <p className="mb-1 text-base font-semibold text-zinc-900">Release this item?</p>
            <p className="mb-5 text-sm text-zinc-500">
              Releasing this item will remove it from this swap and make it available again.
              Are you sure?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setReleaseModalOpen(false)}
                className="flex-1 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => { void handleConfirmRelease(); }}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                Confirm &amp; Release
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
