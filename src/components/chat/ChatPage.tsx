"use client";

import { useMemo, useState, useRef, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { ArrowLeft, Menu, Paperclip, Camera, Mic, Send } from "lucide-react";
import { ChatMessages, type ChatBubbleMessage } from "./ChatMessages";

interface DemoFixture {
  partnerUsername: string;
  partnerAvatar: string | null;
  online: boolean;
  messages: ChatBubbleMessage[];
}

const DEFAULT_DEMO: DemoFixture = {
  partnerUsername: "alex_demo",
  partnerAvatar: null,
  online: true,
  messages: [
    { id: "1", senderId: "partner", text: "Salut! Ai poze cu bicicleta?", time: "10:32", type: "text" },
    { id: "2", senderId: "me", text: "Da, îți trimit acum! 📸", time: "10:33", type: "text", read: true },
    {
      id: "3",
      senderId: "partner",
      text: "Când ești disponibil pentru întâlnire?",
      time: "14:21",
      type: "text",
      dayLabel: "Azi",
    },
    {
      id: "4",
      senderId: "me",
      text: "Joi după ora 18:00 mi-ar conveni.",
      time: "14:22",
      type: "text",
      read: true,
    },
    {
      id: "5",
      senderId: "system",
      text: 'alex_demo a bifat "Detalii item" ✅',
      time: "14:25",
      type: "system",
    },
  ],
};

const DEMO_FIXTURES: Record<string, DemoFixture> = {
  "demo-1": DEFAULT_DEMO,
  "demo-2": DEFAULT_DEMO,
  "demo-3": {
    partnerUsername: "maria_demo",
    partnerAvatar: null,
    online: false,
    messages: [
      { id: "1", senderId: "partner", text: "Bună! Schimbul mai este disponibil?", time: "09:10", type: "text" },
      { id: "2", senderId: "me", text: "Da, încă disponibil!", time: "09:12", type: "text", read: true },
    ],
  },
};

function pickFixture(conversationId: string): DemoFixture {
  const direct = DEMO_FIXTURES[conversationId];
  if (direct) return direct;
  return {
    ...DEFAULT_DEMO,
    partnerUsername: conversationId.startsWith("demo-")
      ? conversationId.slice(5) || DEFAULT_DEMO.partnerUsername
      : DEFAULT_DEMO.partnerUsername,
  };
}

function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

interface Props {
  conversationId: string;
}

export function ChatPage({ conversationId }: Props) {
  const router = useRouter();
  const t = useTranslations("chat");
  const tInput = useTranslations("chat.input");
  const tPage = useTranslations("chat.page");

  const fixture = useMemo(() => pickFixture(conversationId), [conversationId]);

  const [messages, setMessages] = useState<ChatBubbleMessage[]>(fixture.messages);
  const [draft, setDraft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const partnerInitial = fixture.partnerUsername.slice(0, 1).toUpperCase();
  const meInitial = "T";

  function handleSend() {
    const text = draft.trim();
    if (!text) return;
    const next: ChatBubbleMessage = {
      id: `local-${Date.now()}`,
      senderId: "me",
      text,
      time: nowHHMM(),
      type: "text",
      read: false,
    };
    setMessages((prev) => [...prev, next]);
    setDraft("");
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const canSend = draft.trim().length > 0;

  return (
    <div className="mx-auto flex h-[calc(100vh-64px)] w-full max-w-2xl flex-col overflow-hidden border-x border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      {/* ── Header ── */}
      <header className="flex items-center gap-3 border-b border-zinc-100 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-full p-1.5 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          aria-label={tPage("back")}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-sm font-bold text-white"
        >
          {partnerInitial}
        </div>

        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {fixture.partnerUsername}
          </p>
          <p
            className={`flex items-center gap-1 text-[11px] ${
              fixture.online
                ? "text-green-600 dark:text-green-400"
                : "text-zinc-400"
            }`}
          >
            <span
              aria-hidden
              className={`inline-block h-1.5 w-1.5 rounded-full ${
                fixture.online ? "bg-green-500" : "bg-zinc-400"
              }`}
            />
            {fixture.online ? tPage("online") : tPage("offline")}
          </p>
        </div>

        <button
          type="button"
          className="rounded-full p-1.5 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* ── Messages ── */}
      <ChatMessages
        messages={messages}
        partnerInitial={partnerInitial}
        meInitial={meInitial}
      />

      {/* ── Input ── */}
      <div className="border-t border-zinc-100 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-end gap-2">
          <button
            type="button"
            disabled
            aria-label={t("attach")}
            className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-zinc-800"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled
            aria-label={t("attachImage")}
            className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-zinc-800"
          >
            <Camera className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled
            aria-label={t("attachAudio")}
            className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-zinc-800"
          >
            <Mic className="h-4 w-4" />
          </button>

          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={tInput("placeholder")}
            aria-label={tInput("placeholder")}
            className="max-h-32 flex-1 resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800 placeholder-zinc-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
          />

          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            aria-label={tInput("send")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow hover:bg-blue-700 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
