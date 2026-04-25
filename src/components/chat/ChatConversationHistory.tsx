"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { X, MessageCircle } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";

interface ConversationItem {
  id: string;
  partnerName: string;
  lastMessage: string;
  updatedAt: string;
  status: "active" | "agreed" | "cancelled" | "completed";
}

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string | undefined;
  currentConversationId: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-blue-100 text-blue-700",
  agreed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  completed: "bg-zinc-100 text-zinc-600",
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays === 0) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function ChatConversationHistory({ open, onClose, userId, currentConversationId }: Props) {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(false);

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
          .select("id, participant_ids, status, updated_at")
          .contains("participant_ids", [userId])
          .order("updated_at", { ascending: false })
          .limit(20);

        if (!convs) return;

        const items: ConversationItem[] = await Promise.all(
          convs.map(async (conv: Record<string, unknown>) => {
            const participantIds = conv.participant_ids as string[];
            const partnerId = participantIds.find((id) => id !== userId) ?? "";

            const { data: profile } = await sb
              .from("profiles")
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

            return {
              id: conv.id as string,
              partnerName: (profile?.display_name as string) ?? partnerId.slice(0, 8),
              lastMessage: (lastMsg?.content as string) ?? "",
              updatedAt: conv.updated_at as string,
              status: (conv.status as ConversationItem["status"]) ?? "active",
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
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
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

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col gap-2 p-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-zinc-100" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <MessageCircle className="h-8 w-8 text-zinc-300" />
              <p className="text-sm text-zinc-400">No conversations yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1 p-2">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => {
                    router.push(`/chat/${conv.id}`);
                    onClose();
                  }}
                  className={`flex items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-zinc-50 ${
                    conv.id === currentConversationId ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-sm font-bold text-zinc-600">
                    {conv.partnerName.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="truncate text-sm font-semibold text-zinc-900">
                        @{conv.partnerName}
                      </p>
                      <span className="shrink-0 text-[10px] text-zinc-400">
                        {formatDate(conv.updatedAt)}
                      </span>
                    </div>
                    <p className="truncate text-xs text-zinc-500">
                      {conv.lastMessage ? conv.lastMessage.slice(0, 40) : "No messages yet"}
                    </p>
                    <span
                      className={`mt-1 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                        STATUS_COLORS[conv.status] ?? STATUS_COLORS.active
                      }`}
                    >
                      {conv.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
