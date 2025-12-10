// src/app/(app)/chat/[id]/page.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import type { ChatMessage, MatchPreview } from "@/features/chat/types";

type MessagesApiResponse =
  | { ok: true; messages: ChatMessage[] }
  | { ok: false; error: string };

type UserApiResponse =
  | { ok: true; user: { id: string; email: string } }
  | { ok: false; user: null };

type SummaryApiResponse =
  | { ok: true; match: MatchPreview }
  | { ok: false; error: string };

export default function ChatThreadPage() {
  const { id: matchId } = useParams<{ id: string }>();

  const [loadingMessages, setLoadingMessages] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [summary, setSummary] = useState<MatchPreview | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // ---------------------------
  // Încarcă user ID
  // ---------------------------
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

  // ---------------------------
  // Încarcă summary (header)
  // ---------------------------
  const loadSummary = async () => {
    try {
      const res = await fetch(`/api/matches/${matchId}/summary`, {
        cache: "no-store",
      });
      const data: SummaryApiResponse = await res.json();

      if (res.ok && data.ok) {
        setSummary(data.match);
      } else {
        console.error("[SUMMARY_ERROR]", data);
      }
    } catch (err) {
      console.error("[SUMMARY_FETCH_ERROR]", err);
    }
  };

  // ---------------------------
  // Încarcă mesajele (cu mod silent)
  // ---------------------------
  const loadMessages = async (silent = false) => {
    try {
      if (!silent) {
        setLoadingMessages(true);
      }

      const res = await fetch(`/api/matches/${matchId}/messages`, {
        cache: "no-store",
      });

      const data: MessagesApiResponse = await res.json();

      if (!res.ok || !data.ok) {
        setError((data as any)?.error || "Eroare la încărcarea conversației.");
        return;
      }

      setMessages((old) => {
        const newMessages = data.messages;

        // Dacă numărul de mesaje e același, nu re-randăm inutil
        if (old.length === newMessages.length) {
          return old;
        }

        return newMessages;
      });

      setError(null);
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      console.error("[CHAT_THREAD_LOAD_ERROR]", err);
      setError("Eroare la încărcarea conversației.");
    } finally {
      if (!silent) {
        setLoadingMessages(false);
      }
    }
  };

  // ---------------------------
  // Lifecycle: prima încărcare
  // ---------------------------
  useEffect(() => {
    loadUser();
    loadSummary();
    loadMessages();

    // marcăm ca citit
    fetch(`/api/matches/${matchId}/read`, { method: "POST" }).catch((err) =>
      console.error("[READ_UPDATE_ERROR]", err),
    );
  }, [matchId]);

  // ---------------------------
  // Auto-refresh la fiecare 3 secunde
  // ---------------------------
  useEffect(() => {
    const interval = setInterval(() => {
      loadMessages(true); // silent refresh
    }, 3000);

    return () => clearInterval(interval);
  }, [matchId]);

  // ---------------------------
  // Trimite mesaj
  // ---------------------------
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

  // ---------------------------
  // UI
  // ---------------------------
  const headerName = summary?.otherUserName ?? "Utilizator Swaply";
  const headerAvatar = summary?.otherUserAvatar;
  const headerStatus =
    summary?.status === "active"
      ? "Match activ"
      : summary?.status === "pending"
      ? "Match în așteptare"
      : "Match închis";

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-2xl mx-auto px-4 py-4">
      {/* Header conversație */}
      <div className="flex items-center gap-3 mb-4 border-b pb-2">
        {headerAvatar ? (
          <Image
            src={headerAvatar}
            alt="avatar"
            width={48}
            height={48}
            className="rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-xl">
            👤
          </div>
        )}

        <div className="flex flex-col">
          <span className="font-bold text-lg">{headerName}</span>
          <span className="text-sm text-gray-600">{headerStatus}</span>
        </div>
      </div>

      {/* Mesaje */}
      <div className="flex-1 overflow-y-auto border rounded p-4 bg-gray-50 space-y-3">
        {loadingMessages && <p>Se încarcă...</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}

        {!loadingMessages &&
          messages.map((msg) => {
            const mine = userId && msg.senderId === userId;
            const time = new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={msg.id}
                className={`flex w-full ${
                  mine ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm shadow-sm ${
                    mine
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-white text-gray-900 border border-gray-200 rounded-bl-sm"
                  }`}
                >
                  <div>{msg.content}</div>
                  <div
                    className={`mt-1 text-[10px] opacity-75 ${
                      mine ? "text-right" : "text-left text-gray-500"
                    }`}
                  >
                    {time}
                  </div>
                </div>
              </div>
            );
          })}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
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