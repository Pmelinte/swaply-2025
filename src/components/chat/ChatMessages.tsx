"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { ChatMessage } from "./ChatMessage";
import type { RealtimeMessage } from "@/lib/chat/chatRealtime";

interface Props {
  messages: (RealtimeMessage & { content: string })[];
  currentUserId: string;
  partnerTyping: boolean;
  partnerName: string;
  loading: boolean;
}

export function ChatMessages({ messages, currentUserId, partnerTyping, partnerName, loading }: Props) {
  const t = useTranslations("chat");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`h-10 w-48 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800 ${
              i % 2 === 0 ? "ml-auto" : ""
            }`}
          />
        ))}
      </div>
    );
  }

  if (!messages.length) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <p className="text-sm text-zinc-400">{t("noMessages")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto p-4">
      {messages.map((msg) => (
        <ChatMessage
          key={msg.id}
          msg={msg}
          isMe={msg.sender_id === currentUserId}
          currentUserId={currentUserId}
        />
      ))}

      {/* Typing indicator */}
      {partnerTyping && (
        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-2xl rounded-bl-sm bg-white px-3 py-2 shadow-sm dark:bg-zinc-800">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-2 w-2 rounded-full bg-zinc-400 animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
          <span className="text-[11px] text-zinc-400">
            {partnerName} {t("typingIndicator")}
          </span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
