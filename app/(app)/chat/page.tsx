// src/app/(app)/chat/page.tsx

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { MatchPreview } from "@/features/chat/types";

type MatchesApiResponse =
  | { ok: true; matches: MatchPreview[] }
  | { ok: false; error: string };

export default function ChatInboxPage() {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<MatchPreview[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadMatches = async () => {
    try {
      const res = await fetch("/api/matches", { cache: "no-store" });
      const data: MatchesApiResponse = await res.json();

      if (!res.ok || !data.ok) {
        setError((data as any)?.error || "Eroare la încărcarea conversațiilor.");
        return;
      }

      setMatches(data.matches);
      setError(null);
    } catch (err) {
      console.error("[CHAT_INBOX_ERROR]", err);
      setError("Eroare la încărcarea conversațiilor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      <h1 className="text-2xl font-bold mb-4">Conversațiile tale</h1>

      {loading && <p>Se încarcă...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && matches.length === 0 && (
        <p className="text-gray-600">Nu ai conversații încă.</p>
      )}

      <div className="space-y-3">
        {matches.map((m) => {
          const name = m.otherUserName ?? "Utilizator Swaply";
          const avatar = m.otherUserAvatar;

          const last = m.lastMessage;
          const time = last
            ? new Date(last.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : null;

          const unread = (m as any).unreadCount ?? 0;

          return (
            <Link
              key={m.id}
              href={`/chat/${m.id}`}
              className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-100 transition relative"
            >
              {/* Avatar */}
              {avatar ? (
                <Image
                  src={avatar}
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

              {/* Info */}
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-lg">{name}</span>
                  {time && (
                    <span className="text-xs text-gray-500 min-w-[50px] text-right">
                      {time}
                    </span>
                  )}
                </div>

                <div className="text-gray-700 text-sm line-clamp-1">
                  {last ? last.content : "Niciun mesaj încă"}
                </div>
              </div>

              {/* 🔴 Badge pentru necitite */}
              {unread > 0 && (
                <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full absolute right-3 top-3">
                  {unread}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}