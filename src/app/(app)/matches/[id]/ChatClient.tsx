// src/app/(app)/matches/[id]/ChatClient.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { createBrowserClient } from "@supabase/ssr";

import { createMessageAction } from "@/features/chat/server/chat-actions";

type ChatMessage = {
  id: string;
  match_id: string;
  sender_id: string;
  text: string | null;
  created_at: string;
};

interface ChatClientProps {
  matchId: string;
  currentUserId: string;
}

export default function ChatClient({ matchId, currentUserId }: ChatClientProps) {
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createBrowserClient(url, anon);
  }, []);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = (smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  // 1) initial load
  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("messages")
        .select("id,match_id,sender_id,text,created_at")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true });

      if (!mounted) return;

      if (error) {
        setMessages([]);
      } else {
        setMessages((data as ChatMessage[]) ?? []);
        setTimeout(() => scrollToBottom(false), 50);
      }

      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [supabase, matchId]);

  // 2) realtime inserts
  useEffect(() => {
    const channel = supabase
      .channel(`match:${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const m = payload.new as ChatMessage;
          setMessages((prev) => [...prev, m]);
          setTimeout(() => scrollToBottom(true), 50);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, matchId]);

  const refresh = async () => {
    const { data } = await supabase
      .from("messages")
      .select("id,match_id,sender_id,text,created_at")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true });

    setMessages((data as ChatMessage[]) ?? []);
    setTimeout(() => scrollToBottom(true), 50);
  };

  const send = async () => {
    const value = text.trim();
    if (!value) return;

    setSending(true);
    try {
      await createMessageAction({ matchId, text: value });
      setText("");

      // fallback: dacă realtime nu e activ pe tabela messages, tot vezi mesajul
      await refresh();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full flex-col rounded-md border">
      <div className="flex items-center gap-3 border-b p-3">
        <Image src="/logo.png" alt="Swaply" width={28} height={28} />
        <div className="text-sm font-medium">Chat</div>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-2">
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : messages.length === 0 ? (
          <div className="text-sm text-muted-foreground">No messages yet.</div>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === currentUserId;
            return (
              <div
                key={m.id}
                className={`max-w-[85%] rounded-md px-3 py-2 text-sm ${
                  mine ? "ml-auto bg-black text-white" : "mr-auto bg-muted"
                }`}
              >
                {m.text}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t p-3 flex gap-2">
        <input
          className="w-full rounded-md border px-3 py-2 text-sm"
          value={text}
