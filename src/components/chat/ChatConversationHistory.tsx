"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { X, MessageCircle, Search } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";

interface ConversationItem {
  id: string;
  partnerId: string;
  partnerName: string;
  lastMessage: string;
  updatedAt: string;
  status: string;
  sessionNumber: number;
  sessionStatus: string;
  itemATitle?: string;
  itemBTitle?: string;
  itemACategory?: string;
  itemBCategory?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string | undefined;
  currentConversationId: string;
}

const SESSION_ICON: Record<string, string> = {
  active: "🟢",
  paused: "⏸️",
  completed: "✅",
};

const CATEGORY_EMOJI: Record<string, string> = {
  objects: "📦",
  object: "📦",
  properties: "🏠",
  property: "🏠",
  services: "🔧",
  service: "🔧",
  events: "🎫",
  event: "🎫",
};

function categoryEmoji(cat?: string): string {
  return (cat && CATEGORY_EMOJI[cat.toLowerCase()]) ?? "📦";
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays === 0) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function ChatConversationHistory({ open, onClose, userId, currentConversationId }: Props) {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open || !userId) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const sb = supabase;

    async function load() {
      setLoading(true);
      try {
        const { data: convs } = await sb
          .from("conversations")
          .select("id, participant_ids, status, updated_at, session_number, session_status, item_ids")
          .contains("participant_ids", [userId])
          .order("updated_at", { ascending: false })
          .limit(40);

        if (!convs) return;

        const items: ConversationItem[] = await Promise.all(
          convs.map(async (conv: Record<string, unknown>) => {
            const participantIds = conv.participant_ids as string[];
            const partnerId = participantIds.find((id) => id !== userId) ?? "";

            const { data: profile } = await sb
              .from("public_profiles")
              .select("display_name")
              .eq("user_id", partnerId)
              .maybeSingle();

            const { data: lastMsg } = await sb
              .from("messages")
              .select("content")
              .or(`struct_conv_id.eq.${conv.id as string},conversation_id.eq.${conv.id as string}`)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            // Fetch item titles/categories if item_ids available
            let itemATitle: string | undefined;
            let itemBTitle: string | undefined;
            let itemACategory: string | undefined;
            let itemBCategory: string | undefined;
            const itemIds = conv.item_ids as string[] | null;
            if (itemIds && itemIds.length >= 2) {
              const { data: itemsData } = await sb
                .from("items")
                .select("id, title, listing_type, owner_id")
                .in("id", itemIds)
                .limit(2);
              if (itemsData) {
                const myItem = itemsData.find((it: Record<string, unknown>) => it.owner_id === userId);
                const theirItem = itemsData.find((it: Record<string, unknown>) => it.owner_id !== userId);
                itemATitle = myItem?.title as string | undefined;
                itemBTitle = theirItem?.title as string | undefined;
                itemACategory = myItem?.listing_type as string | undefined;
                itemBCategory = theirItem?.listing_type as string | undefined;
              }
            }

            return {
              id: conv.id as string,
              partnerId,
              partnerName: (profile?.display_name as string) ?? partnerId.slice(0, 8),
              lastMessage: (lastMsg?.content as string) ?? "",
              updatedAt: conv.updated_at as string,
              status: (conv.status as string) ?? "active",
              sessionNumber: (conv.session_number as number) ?? 1,
              sessionStatus: (conv.session_status as string) ?? "active",
              itemATitle,
              itemBTitle,
              itemACategory,
              itemBCategory,
            };
          }),
        );

        setConversations(items);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [open, userId]);

  // Group conversations by partnerId
  const grouped = useMemo(() => {
    const filtered = search.trim()
      ? conversations.filter(
          (c) =>
            c.partnerName.toLowerCase().includes(search.toLowerCase()) ||
            c.itemATitle?.toLowerCase().includes(search.toLowerCase()) ||
            c.itemBTitle?.toLowerCase().includes(search.toLowerCase()),
        )
      : conversations;

    const map = new Map<string, ConversationItem[]>();
    for (const conv of filtered) {
      const key = conv.partnerId;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(conv);
    }
    return Array.from(map.entries());
  }, [conversations, search]);

  return (
    <>
      {open && (
        <div className="absolute inset-0 z-40 bg-black/30" onClick={onClose} />
      )}

      <div
        className={`absolute inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-white shadow-xl transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-blue-600" />
            <span className="font-semibold text-zinc-900">Conversations</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 hover:bg-zinc-100"
          >
            <X className="h-4 w-4 text-zinc-500" />
          </button>
        </div>

        {/* Search */}
        <div className="shrink-0 border-b border-zinc-100 px-3 py-2">
          <div className="flex items-center gap-2 rounded-xl bg-zinc-100 px-3 py-1.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="flex-1 bg-transparent text-xs text-zinc-700 placeholder-zinc-400 outline-none"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col gap-2 p-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-zinc-100" />
              ))}
            </div>
          ) : grouped.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <MessageCircle className="h-8 w-8 text-zinc-300" />
              <p className="text-sm text-zinc-400">
                {search ? "No results" : "No conversations yet"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-0 p-2">
              {grouped.map(([, sessions]) => {
                const partner = sessions[0];
                return (
                  <div key={partner.partnerId} className="mb-3">
                    {/* Partner header */}
                    <div className="mb-1 flex items-center gap-2 px-2 py-1">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-bold text-zinc-600">
                        {partner.partnerName.slice(0, 1).toUpperCase()}
                      </div>
                      <p className="text-xs font-semibold text-zinc-900">
                        @{partner.partnerName}
                      </p>
                    </div>

                    {/* Sessions */}
                    <div className="ml-4 space-y-1 border-l border-zinc-100 pl-3">
                      {sessions.map((conv) => (
                        <button
                          key={conv.id}
                          type="button"
                          onClick={() => {
                            router.push(`/chat/${conv.id}`);
                            onClose();
                          }}
                          className={`flex w-full items-start gap-2 rounded-xl px-2.5 py-2 text-left transition hover:bg-zinc-50 ${
                            conv.id === currentConversationId ? "bg-blue-50" : ""
                          }`}
                        >
                          {/* Item emojis */}
                          <span className="shrink-0 text-sm leading-none">
                            {categoryEmoji(conv.itemACategory)}
                          </span>
                          <div className="min-w-0 flex-1">
                            {/* Item titles */}
                            {(conv.itemATitle || conv.itemBTitle) ? (
                              <p className="truncate text-[11px] font-medium text-zinc-700">
                                {conv.itemATitle ?? "?"} ↔ {conv.itemBTitle ?? "?"}
                              </p>
                            ) : (
                              <p className="truncate text-[11px] font-medium text-zinc-500">
                                {conv.lastMessage ? conv.lastMessage.slice(0, 35) : "No messages"}
                              </p>
                            )}
                            <div className="mt-0.5 flex items-center gap-1.5">
                              <span className="text-[10px] text-zinc-400">
                                Session {conv.sessionNumber}
                              </span>
                              <span className="text-[10px]">
                                {SESSION_ICON[conv.sessionStatus] ?? "🟢"}
                              </span>
                              <span className="text-[10px] text-zinc-400">
                                {formatDate(conv.updatedAt)}
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
