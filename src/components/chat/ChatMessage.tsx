"use client";

import { useTranslations } from "next-intl";
import { Check, CheckCheck } from "lucide-react";
import { ChatMessageTranslate } from "./ChatMessageTranslate";
import { formatDate } from "@/lib/utils";
import { useLocale } from "next-intl";
import type { RealtimeMessage } from "@/lib/chat/chatRealtime";

interface Props {
  msg: RealtimeMessage & { content: string };
  isMe: boolean;
  currentUserId: string;
}

function SystemMessage({ content }: { content: string }) {
  return (
    <div className="my-1 flex justify-center">
      <span className="rounded-full bg-zinc-100 px-3 py-0.5 text-[11px] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
        {content}
      </span>
    </div>
  );
}

export function ChatMessage({ msg, isMe, currentUserId }: Props) {
  const t = useTranslations("chat");
  const locale = useLocale();

  if (msg.message_type === "system" || msg.message_type === "agenda_update") {
    return <SystemMessage content={msg.content} />;
  }

  const isRead = (msg.read_by ?? []).some((id) => id !== currentUserId);

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[78%] rounded-2xl px-3 py-2 shadow-sm ${
        isMe
          ? "rounded-br-sm bg-blue-600 text-white"
          : "rounded-bl-sm bg-white dark:bg-zinc-800"
      }`}>
        {/* Media */}
        {msg.message_type === "image" && msg.media_url && (
          <img
            src={msg.media_url}
            alt="shared"
            className="mb-1 max-h-48 rounded-xl object-cover"
          />
        )}

        {msg.message_type === "audio" && msg.media_url && (
          <audio controls className="mb-1 max-w-full" src={msg.media_url} />
        )}

        {msg.message_type === "video" && msg.media_url && (
          <video controls className="mb-1 max-h-40 rounded-xl" src={msg.media_url} />
        )}

        {/* Text content */}
        {msg.content && (
          <p className={`text-sm ${isMe ? "text-white" : "text-zinc-800 dark:text-zinc-100"}`}>
            {msg.content}
          </p>
        )}

        {/* Footer: time + read receipt */}
        <div className={`mt-0.5 flex items-center gap-1 ${isMe ? "justify-end" : "justify-start"}`}>
          <span className={`text-[10px] ${isMe ? "text-blue-200" : "text-zinc-400"}`}>
            {formatDate(msg.created_at, locale)}
          </span>
          {isMe && (
            isRead
              ? <CheckCheck className="h-3 w-3 text-blue-200" />
              : <Check className="h-3 w-3 text-blue-200/60" />
          )}
        </div>

        {/* Translation (only for received messages with text) */}
        {!isMe && msg.message_type === "text" && msg.content && (
          <ChatMessageTranslate text={msg.content} isMe={isMe} />
        )}
      </div>
    </div>
  );
}
