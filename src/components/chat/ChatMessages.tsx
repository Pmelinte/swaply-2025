"use client";

import { useEffect, useRef } from "react";

export type ChatBubbleSender = "me" | "partner" | "system";

export interface ChatBubbleMessage {
  id: string;
  senderId: ChatBubbleSender;
  text: string;
  time: string;
  type: "text" | "system";
  read?: boolean;
  /** When set, a day separator is rendered above this message. */
  dayLabel?: string;
}

interface Props {
  messages: ChatBubbleMessage[];
  partnerInitial: string;
  meInitial: string;
}

function DaySeparator({ label }: { label: string }) {
  return (
    <div className="my-3 flex items-center gap-3" role="separator" aria-label={label}>
      <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
      <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </span>
      <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
    </div>
  );
}

function Avatar({ initial, tone }: { initial: string; tone: "me" | "partner" }) {
  const bg =
    tone === "me"
      ? "bg-blue-500 text-white"
      : "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200";
  return (
    <div
      aria-hidden
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${bg}`}
    >
      {initial}
    </div>
  );
}

function ReadTicks({ read }: { read?: boolean }) {
  return (
    <span
      aria-label={read ? "Read" : "Delivered"}
      className={`ml-1 inline-flex text-[11px] leading-none ${
        read ? "text-blue-200" : "text-blue-100/70"
      }`}
    >
      ✓✓
    </span>
  );
}

function SystemRow({ text }: { text: string }) {
  return (
    <div className="my-2 flex justify-center">
      <p className="text-center text-xs italic text-zinc-400 dark:text-zinc-500">
        {text}
      </p>
    </div>
  );
}

export function ChatMessages({ messages, partnerInitial, meInitial }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto bg-zinc-50 px-4 py-4 dark:bg-zinc-950">
      {messages.map((msg) => {
        const sep = msg.dayLabel ? (
          <DaySeparator key={`${msg.id}-sep`} label={msg.dayLabel} />
        ) : null;

        if (msg.senderId === "system" || msg.type === "system") {
          return (
            <div key={msg.id}>
              {sep}
              <SystemRow text={msg.text} />
            </div>
          );
        }

        const isMe = msg.senderId === "me";

        return (
          <div key={msg.id}>
            {sep}
            <div
              className={`flex items-end gap-2 ${
                isMe ? "justify-end" : "justify-start"
              }`}
            >
              {!isMe && <Avatar initial={partnerInitial} tone="partner" />}

              <div
                className={`flex max-w-[78%] flex-col ${
                  isMe ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`px-3 py-2 text-sm shadow-sm ${
                    isMe
                      ? "rounded-2xl rounded-tr-sm bg-blue-500 text-white"
                      : "rounded-2xl rounded-tl-sm bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                </div>
                <div
                  className={`mt-0.5 flex items-center gap-1 px-1 text-[11px] text-zinc-400 ${
                    isMe ? "justify-end" : "justify-start"
                  }`}
                >
                  <span>{msg.time}</span>
                  {isMe && <ReadTicks read={msg.read} />}
                </div>
              </div>

              {isMe && <Avatar initial={meInitial} tone="me" />}
            </div>
          </div>
        );
      })}

      <div ref={bottomRef} />
    </div>
  );
}
