// src/app/(app)/chat/[id]/page.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import type { ChatMessage } from "@/features/chat/types";

type MessagesApiResponse =
  | { ok: true; messages: ChatMessage[] }
  | { ok: false; error: string };

type UserApiResponse =
  | { ok: true; user: { id: string; email: string } }
  | { ok: false; user: null };

export default function ChatThreadPage() {
  const { id: matchId } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Încarcă user-ul curent
  const loadUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data: UserApiResponse = await res.json();

      if (data.ok && data.user) {
        setUserId(data.user.id);
      }
    } catch (err) {
      console.error("[CHAT_USER_LOAD_ERROR]", err);
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);

      const res = await fetch(`/api/matches/${matchId}/messages`);
      const data: MessagesApiResponse = await res.json();

      if (!res.ok || !data.ok) {
        setError((data as any)?.error || "Eroare la încărcarea conversației.");
        return;
      }

      setMessages(data.messages);
      setError(null);
    } catch (err) {
      console.error("[CHAT_THREAD_LOAD_ERROR]", err);
      setError("Eroare la încărcarea conversației.");
    } finally {
      setLoading(false);
      setTimeout(scrollToBottom, 50);
    }
  };

  useEffect(() => {
    loadUser();
    loadMessages();

    // marcăm ca citit
    fetch(`/api/matches/${matchId}/read`, { method: "POST" })
      .catch((err) => console.error("[READ_UPDATE_ERROR]", err));
  }, [matchId]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;

    try {
      const res = await fetch(`/api/matches/${matchId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });

      const data = await res.json();

      if (!data.ok) {
        alert("Nu s-a putut trimite mesajul.");
        return;
      }

      setInput("");
      await loadMessages();
    } catch (err) {
      console.error("[SEND_MESSAGE_ERROR]", err);
      alert("Eroare la trimiterea mesajului.");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-2xl mx-auto px-4 py-4">
      <h2 className="text-xl font-bold mb-4">Conversație</h2>

      <div className="flex-1 overflow-y-auto border rounded p-4 bg-gray-50 space-y-3">
        {loading && <p>Se încarcă...</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}

        {!loading &&
          messages.map((msg) => {
            const mine = userId && msg.senderId === userId;

            return (
              <div
                key={msg.id}
                className={`max-w-[75%] px-3 py-2 rounded-lg ${
                  mine
                    ? "bg-blue-600 text-white ml-auto"
                    : "bg-white text-gray-900 border mr-auto"
                }`}
              >
                {msg.content}
                <div className="text-[10px] opacity-70 mt-1">
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </div>
              </div>
            );
          })}

        <div ref={bottomRef} />
      </div>

      <div className="mt-4 flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2"
          placeholder="Scrie un mesaj..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded font-semibold"
          onClick={sendMessage}
        >
          Trimite
        </button>
      </div>
    </div>
  );
}