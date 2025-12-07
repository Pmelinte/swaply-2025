"use client";

import { useEffect, useRef, useState } from "react";
import type { MatchPreview, ChatMessage } from "@/features/chat/types";
import {
  getThreadAction,
  createMessageAction,
} from "@/features/chat/server/chat-actions";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Image from "next/image";

interface ChatClientProps {
  match: MatchPreview;
}

export default function ChatClient({ match }: ChatClientProps) {
  const supabase = createClientComponentClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Încarcă thread-ul inițial
  useEffect(() => {
    (async () => {
      const thread = await getThreadAction(match.id);
      setMessages(thread.messages);
      setLoading(false);
      scrollToBottom();
    })();
  }, [match.id]);

  // Scroll automat la finalul chat-ului
  const scrollToBottom = () => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  // Realtime: ascultăm mesajele noi
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${match.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${match.id}`,
        },
        (payload) => {
          const newMsg = payload.new as any;
          setMessages((prev) => [
            ...prev,
            {
              id: newMsg.id,
              matchId: newMsg.match_id,
              senderId: newMsg.sender_id,
              content: newMsg.content,
              createdAt: newMsg.created_at,
            },
          ]);
          scrollToBottom();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [match.id, supabase]);

  // Trimite mesaj
  const sendMessage = async () => {
    if (!text.trim()) return;

    const content = text.trim();
    setText("");

    const sent = await createMessageAction({
      matchId: match.id,
      content,
    });

    // mesajul va intra și prin realtime, deci nu îl duplicăm
  };

  if (loading) {
    return <p>Se încarcă conversația...</p>;
  }

  return (
    <div className="flex flex-col h-[80vh] border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="border-b p-4 flex items-center gap-3 bg-gray-50">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 relative">
          {match.otherUserAvatar ? (
            <Image
              src={match.otherUserAvatar}
              alt={match.otherUserName ?? "User"}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">👤</div>
          )}
        </div>
        <div>
          <p className="font-semibold text-lg">{match.otherUserName}</p>
          <p className="text-xs text-gray-500">Match creat la {match.createdAt.slice(0, 10)}</p>
        </div>
      </div>

      {/* Mesaje */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
        {messages.map((msg) => {
          const isMe = msg.senderId === match.userAId || msg.senderId === match.userBId
            ? msg.senderId === match.userAId && match.userAId === match.otherUserId
            : false;

          const mine = msg.senderId !== match.userBId; // simplu pentru acum

          return (
            <div
              key={msg.id}
              className={`max-w-[70%] px-4 py-2 rounded-xl ${
                mine ? "bg-blue-600 text-white ml-auto" : "bg-gray-200 text-black"
              }`}
            >
              {msg.content}
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-gray-50 flex gap-2">
        <input
          className="flex-1 border rounded-lg px-3 py-2"
          placeholder="Scrie un mesaj..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
        />
        <button
          onClick={sendMessage}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Trimite
        </button>
      </div>
    </div>
  );
}
