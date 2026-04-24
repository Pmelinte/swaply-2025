"use client";

import { useTranslations } from "next-intl";
import type { RealtimeMessage } from "@/lib/chat/chatRealtime";

interface Props {
  messages: (RealtimeMessage & { content: string })[];
}

export function ChatDrawerDocuments({ messages }: Props) {
  const t = useTranslations("chat.drawer");

  const mediaMessages = messages.filter(
    (m) => m.message_type === "image" || m.message_type === "audio" || m.message_type === "video",
  );

  if (!mediaMessages.length) {
    return (
      <p className="py-4 text-center text-sm text-zinc-400">{t("noDocuments")}</p>
    );
  }

  return (
    <div className="space-y-2">
      {/* Images grid */}
      {mediaMessages.filter((m) => m.message_type === "image").length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
            {t("images")}
          </p>
          <div className="grid grid-cols-3 gap-1">
            {mediaMessages
              .filter((m) => m.message_type === "image" && m.media_url)
              .map((m) => (
                <a
                  key={m.id}
                  href={m.media_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="aspect-square overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800"
                >
                  <img
                    src={m.media_url!}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </a>
              ))}
          </div>
        </div>
      )}

      {/* Audio */}
      {mediaMessages.filter((m) => m.message_type === "audio").length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
            {t("audio")}
          </p>
          <div className="space-y-1">
            {mediaMessages
              .filter((m) => m.message_type === "audio" && m.media_url)
              .map((m) => (
                <div key={m.id} className="rounded-xl border border-zinc-100 p-2 dark:border-zinc-800">
                  <audio controls src={m.media_url!} className="w-full" />
                  <p className="mt-1 text-[10px] text-zinc-400">
                    {new Date(m.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Video */}
      {mediaMessages.filter((m) => m.message_type === "video").length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
            {t("video")}
          </p>
          <div className="space-y-1">
            {mediaMessages
              .filter((m) => m.message_type === "video" && m.media_url)
              .map((m) => (
                <div key={m.id} className="rounded-xl border border-zinc-100 p-2 dark:border-zinc-800">
                  <video controls src={m.media_url!} className="max-h-36 w-full rounded-lg" />
                  <p className="mt-1 text-[10px] text-zinc-400">
                    {new Date(m.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
