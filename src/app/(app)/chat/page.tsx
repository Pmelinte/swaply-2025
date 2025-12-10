// src/app/(app)/chat/page.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { MatchPreview } from "@/features/chat/types";

type MatchesApiResponse =
  | { ok: true; matches: MatchPreview[] }
  | { ok: false; error: string };

function formatDate(iso: string | undefined | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

export default function ChatPage() {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<MatchPreview[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadMatches = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/matches", {
          method: "GET",
          headers: {
            "Accept": "application/json",
          },
        });

        const data: MatchesApiResponse = await res.json();

        if (!res.ok || !data.ok) {
          setError(
            (data as any)?.error || "Nu s-au putut încărca conversațiile."
          );
          return;
        }

        if (!isMounted) return;

        setMatches(data.matches);
      } catch (err) {
        console.error("[CHAT_PAGE_LOAD_MATCHES_ERROR]", err);
        if (!isMounted) return;
        setError("Eroare la încărcarea conversațiilor.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadMatches();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 space-y-4">
      <h1 className="text-2xl font-bold mb-4">Chat</h1>

      {loading && <p>Se încarcă conversațiile...</p>}

      {error && !loading && (
        <p className="text-red-600 text-sm">{error}</p>
      )}

      {!loading && !error && matches.length === 0 && (
        <p className="text-gray-600">
          Nu ai încă niciun chat activ. Începe prin a da swipe sau a iniția un schimb.
        </p>
      )}

      <div className="space-y-3">
        {matches.map((match) => {
          const otherUserName = match.otherUserName ?? "Utilizator Swaply";
          const lastMessageText = match.lastMessage?.content ?? "Niciun mesaj încă";
          const lastUpdated = formatDate(match.updatedAt || match.createdAt);

          return (
            <Link
              key={match.id}
              href={`/chat/${match.id}`}
              className="block border rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold">{otherUserName}</span>
                <span className="text-xs text-gray-500">
                  {lastUpdated}
                </span>
              </div>
              <div className="text-sm text-gray-700 line-clamp-1">
                {lastMessageText}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Status: {match.status}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}