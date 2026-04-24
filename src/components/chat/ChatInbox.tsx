"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAppState } from "@/lib/state";

interface DemoConversation {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
  status: "active" | "agreed" | "completed";
}

const DEMO_CONVERSATIONS: DemoConversation[] = [
  {
    id: "demo-1",
    title: "Laptop ↔ Bicycle",
    preview: "Sounds like a fair swap, when can we meet?",
    updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    status: "active",
  },
  {
    id: "demo-2",
    title: "Kitchen set ↔ Tablet",
    preview: "Photos look good — I'll check delivery options.",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    status: "agreed",
  },
  {
    id: "demo-3",
    title: "Guitar ↔ Headphones",
    preview: "Thanks for the swap! Great experience.",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    status: "completed",
  },
];

export function ChatInbox() {
  const { user, conversations, loading } = useAppState();
  const t = useTranslations("chat");
  const tInbox = useTranslations("chat.inbox");

  if (loading.items && !conversations.length && user) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex animate-pulse gap-3">
            <div className="h-12 w-12 shrink-0 rounded-full bg-zinc-100 dark:bg-zinc-800" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-3 w-2/3 rounded bg-zinc-100 dark:bg-zinc-800" />
              <div className="h-2.5 w-1/2 rounded bg-zinc-100 dark:bg-zinc-800" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Unauthenticated users: demo conversations (no personal data)
  if (!user) {
    return (
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {DEMO_CONVERSATIONS.map((conv) => (
          <Link
            key={conv.id}
            href={`/chat/${conv.id}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 font-bold text-white">
              {conv.title.slice(0, 1)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {conv.title}
                </p>
                <span className="shrink-0 text-[10px] text-zinc-400">
                  {new Date(conv.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {conv.preview}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {conv.status}
            </span>
          </Link>
        ))}
      </div>
    );
  }

  if (!conversations.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="text-3xl">💬</div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{tInbox("empty")}</p>
        <Link
          href="/explore"
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {t("startFromExplore")}
        </Link>
      </div>
    );
  }

  return (
    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
      {conversations.map((conv) => {
        const lastMsg = conv.messages[conv.messages.length - 1];
        const unread = conv.messages.filter(
          (m) => m.senderId !== user?.id && !m.isRead,
        ).length;

        return (
          <Link
            key={conv.id}
            href={`/chat/${conv.id}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
          >
            {/* Avatar */}
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div className="flex h-full w-full items-center justify-center font-bold text-zinc-500">
                {conv.participantName.slice(0, 1).toUpperCase()}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  @{conv.participantName}
                </p>
                <span className="shrink-0 text-[10px] text-zinc-400">
                  {conv.updatedAt ? new Date(conv.updatedAt).toLocaleDateString() : ""}
                </span>
              </div>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {lastMsg?.content ?? conv.lastMessage ?? tInbox("lastMessage")}
              </p>
            </div>

            {/* Unread badge */}
            {unread > 0 && (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
