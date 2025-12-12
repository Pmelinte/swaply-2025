// src/features/chat/components/ChatClient.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/features/chat/types";

interface ChatClientProps {
  matchId: string;
  currentUserId: string;
}

type MessagesApiResponse =
  | { ok: true; messages: ChatMessage[] }
  | { ok: false; error: string };

type SendApiResponse =
  | { ok: true; message: ChatMessage }
  | { ok: false; error: string };

export default function ChatClient({ matchId, currentUserId }: ChatClientProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // ------------------------------------------------
  // Load messages
  // ------------------------------------------------
  const loadMessages = async () => {
    try {
      const res = await fetch(`/api/matches/${matchId}/messages`, {
        cache: "no-store",
      });
      const data: MessagesApiResponse = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error((data as any)?.error || "failed_to_load_messages");
      }

      setMessages(data.messages ?? []);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "load_error");
    }
  };

  // ------------------------------------------------
  // Mark as read (best-effort)
  // ------------------------------------------------
  const markRead = async () => {
    try {
      await fetch(`/api/matches/${matchId}/read`, {
        method: "POST",
      });
    } catch {
      // ignore (best-effort)
    }
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        setLoading(true);
        await loadMessages();
        await markRead(); // important pentru badge
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  // ------------------------------------------------
  // Auto-scroll
  // ------------------------------------------------
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ------------------------------------------------
  // Send message
  // ------------------------------------------------
  const sendMessage = async () => {
    const text = content.trim();
    if (!text || sending) return;

    setSending(true);

    const optimistic: ChatMessage = {
      id: `tmp-${Date.now()}`,
      matchId,
      senderId: currentUserId,
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((m) => [...m, optimistic]);
    setContent("");

    try {
      const res = await fetch(`/api/matches/${matchId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, content: text }),
      });

      const data: SendApiResponse = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error((data as any)?.error || "send_failed");
      }

      // înlocuim optimistul cu mesajul real din DB
      setMessages((m) =>
        m.map((msg) => (msg.id === optimistic.id ? data.message : msg)),
      );

      // după trimis, marcăm ca read (best effort) și reîncărcăm inbox-ul implicit
      await markRead();
    } catch {
      // rollback optimist
      setMessages((m) => m.filter((msg) => msg.id !== optimistic.id));
      alert("Mesajul nu a putut fi trimis.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="p-4">Se încarcă conversația…</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Eroare: {error}</div>;
  }

  return (
    <div className="flex flex-col h-full border rounded">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((m) => {
          const mine = m.senderId === currentUserId;

          return (
            <div
              key={m.id}
              className={`max-w-[75%] px-3 py-2 rounded ${
                mine ? "ml-auto bg-blue-600 text-white" : "mr-auto bg-gray-200"
              }`}
            >
              <p className="text-sm">{m.content}</p>
              <span className="block text-[10px] opacity-70">
                {new Date(m.createdAt).toLocaleTimeString()}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="border-t p-3 flex gap-2">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 border rounded px-3 py-2"
          placeholder="Scrie un mesaj…"
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
          disabled={sending}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
          disabled={sending || !content.trim()}
        >
          {sending ? "..." : "Trimite"}
        </button>
      </div>
    </div>
  );
}