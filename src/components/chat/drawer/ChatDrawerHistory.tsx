"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAppState } from "@/lib/state";

interface Props {
  currentConversationId: string;
  partnerId: string;
}

export function ChatDrawerHistory({ currentConversationId, partnerId }: Props) {
  const t = useTranslations("chat.drawer");
  const { conversations } = useAppState();

  // Conversations with same partner
  const samePartner = conversations.filter(
    (c) => c.participantId === partnerId && c.id !== currentConversationId,
  );

  // Other conversations
  const others = conversations.filter(
    (c) => c.participantId !== partnerId && c.id !== currentConversationId,
  );

  if (!conversations.length) {
    return (
      <p className="py-4 text-center text-sm text-zinc-400">{t("noHistory")}</p>
    );
  }

  return (
    <div className="space-y-4">
      {samePartner.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
            {t("withSameUser")}
          </p>
          <div className="space-y-1">
            {samePartner.map((conv) => (
              <Link
                key={conv.id}
                href={`/chat/${conv.id}`}
                className="flex items-center justify-between rounded-xl border border-zinc-100 px-3 py-2 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
              >
                <div>
                  <p className="text-xs font-medium text-zinc-800 dark:text-zinc-100">
                    {conv.lastMessage || t("noMessages")}
                  </p>
                  <p className="text-[10px] text-zinc-400">
                    {new Date(conv.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {others.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
            {t("otherConversations")}
          </p>
          <div className="space-y-1">
            {others.slice(0, 5).map((conv) => (
              <Link
                key={conv.id}
                href={`/chat/${conv.id}`}
                className="flex items-center gap-2 rounded-xl border border-zinc-100 px-3 py-2 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-500 dark:bg-zinc-700">
                  {conv.participantName.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-xs font-medium text-zinc-800 dark:text-zinc-100">
                    @{conv.participantName}
                  </p>
                  <p className="truncate text-[10px] text-zinc-400">{conv.lastMessage}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
