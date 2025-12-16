// src/app/(app)/matches/[id]/ChatClient.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { createBrowserClient } from "@supabase/ssr";

import {
  createMessageAction,
  listMessagesAction,
} from "@/features/chat/server/chat-actions";

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

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      try {
        const list = await listMessagesAction(matchId);
        if (!mounted) return;
        setMessages((list as ChatMessage[]) ?? []);
        setTimeout(scrollToBottom, 50);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
    // listMessagesAction e server action; nu o punem în deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  useEffect(() => {
    // Realtime (dacă ai enable la Realtime pe tabela messages)
    const channel = supabase
      .channel(`match:${matchId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          const m = payload.new as ChatMessage;
          setMessages((prev) => [...prev, m]);
          setTimeout(scrollToBottom, 50);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, matchId]);

  const send = async () => {
    const value = text.trim();
    if (!value) return;

    setSending(true);
    try {
      await createMessageAction({
        matchId,
        text: value,
      });

      setText("");
      // nu adăugăm manual în listă: realtime ar trebui să o facă.
      // dacă realtime nu e activ, fallback: re-fetch
      // (îl păstrăm simplu, să nu rupem nimic)
      const list = await listMessagesAction(matchId);
      setMessages((list as ChatMessage[]) ?? []);
      setTimeout(scrollToBottom, 50);
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
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message…"
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          disabled={sending}
        />
        <button
          type="button"
          onClick={send}
          disabled={sending}
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {sending ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}
