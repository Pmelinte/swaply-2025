// src/app/(app)/matches/[id]/ChatClient.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { createBrowserClient } from "@supabase/ssr";

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
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = (smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  const refresh = async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("id,match_id,sender_id,text,created_at")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true });

    if (error) {
      setError(error.message);
      return;
    }

    setMessages((data as ChatMessage[]) ?? []);
    setTimeout(() => scrollToBottom(true), 50);
  };

  // 1) initial load
  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("messages")
        .select("id,match_id,sender_id,text,created_at")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true });

      if (!mounted) return;

      if (error) {
        setError(error.message);
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

  const send = async () => {
    const value = text.trim();
    if (!value) return;

    setSending(true);
    setError(null);

    try {
      // ✅ Insert direct în DB; evităm CreateMessageInput mismatch
      const { error } = await supabase.from("messages").insert({
        match_id: matchId,
        sender_id: currentUserId,
        text: value,
      });

      if (error) throw error;

      setText("");

      // fallback: dacă realtime nu e activ, tot vezi mesajul
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Eroare la trimiterea mesajului.");
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

      <div className="border-t p-3 space-y-2">
        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="flex gap-2">
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
    </div>
  );
}
