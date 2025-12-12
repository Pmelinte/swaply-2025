// src/features/chat/components/ChatClient.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/features/chat/types";

interface ChatClientProps {
  matchId: string;
}

export default function ChatClient({ matchId }: ChatClientProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // ------------------------------------------------
  // Load messages
  // ------------------------------------------------
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/matches/${matchId}/messages`);
        const data = await res.json();

        if (!res.ok || !data.ok) {
          throw new Error(data.error || "failed_to_load_messages");
        }

        if (mounted) {
          setMessages(data.messages ?? []);
        }
      } catch (e: any) {
        if (mounted) setError(e.message ?? "load_error");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
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
    if (!content.trim()) return;

    const optimistic: ChatMessage = {
      id: `tmp-${Date.now()}`,
      matchId,
      senderId: "me",
      content,
      createdAt: new Date().toISOString(),
    };

    setMessages((m) => [...m, optimistic]);
    setContent("");

    try {
      const res = await fetch(`/api/matches/${matchId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "send_failed");
      }

      setMessages((m) =>
        m.map((msg) => (msg.id === optimistic.id ? data.message : msg)),
      );
    } catch (e) {
      // rollback optimist
      setMessages((m) => m.filter((msg) => msg.id !== optimistic.id));
      alert("Mesajul nu a putut fi trimis.");
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
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[75%] px-3 py-2 rounded ${
              m.senderId === "me"
                ? "ml-auto bg-blue-600 text-white"
                : "mr-auto bg-gray-200"
            }`}
          >
            <p className="text-sm">{m.content}</p>
            <span className="block text-[10px] opacity-70">
              {new Date(m.createdAt).toLocaleTimeString()}
            </span>
          </div>
        ))}
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
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Trimite
        </button>
      </div>
    </div>
  );
}