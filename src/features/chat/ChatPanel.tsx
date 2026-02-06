"use client";

import { useState } from "react";
import { Conversation } from "@/lib/types";
import { useAppState } from "@/lib/state";
import { formatDate } from "@/lib/utils";
import { Badge, Pill } from "@/components/ui";

export function ChatPanel({
  conversations,
  initialConversationId,
}: {
  conversations: Conversation[];
  initialConversationId?: string;
}) {
  const { addMessage, toggleConversationTranslation } = useAppState();
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [draft, setDraft] = useState("");

  const effectiveActiveId =
    (selectedId && conversations.some((c) => c.id === selectedId) ? selectedId : undefined) ??
    (initialConversationId && conversations.some((c) => c.id === initialConversationId)
      ? initialConversationId
      : undefined) ??
    conversations[0]?.id;

  const active = conversations.find((c) => c.id === effectiveActiveId);

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <div className="space-y-2 rounded-2xl border border-zinc-200 bg-white/80 p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Conversații</h3>
        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => setSelectedId(conv.id)}
            className={`w-full rounded-xl border px-3 py-2 text-left ${
              conv.id === effectiveActiveId
                ? "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100"
                : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="font-semibold">{conv.participantName}</div>
              <Badge tier={conv.participantBadge} />
            </div>
            <p className="line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
              {conv.lastMessage}
            </p>
          </button>
        ))}
      </div>
      <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        {active ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-zinc-500">Chat securizat</p>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {active.participantName}
                </h3>
              </div>
              <button
                type="button"
                className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white hover:bg-zinc-800"
                onClick={() => toggleConversationTranslation(active.id)}
              >
                Traducere: {active.translationEnabled ? "ON" : "OFF"}
              </button>
            </div>
            <div className="space-y-3 rounded-xl border border-zinc-100 bg-zinc-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-800/50">
              {active.messages.map((msg) => (
                <div key={msg.id} className="rounded-lg bg-white/80 p-3 shadow-sm dark:bg-zinc-900">
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <span>{msg.senderId === active.participantId ? "Partener" : "Tu"}</span>
                    <span>{formatDate(msg.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-800 dark:text-zinc-100">{msg.content}</p>
                  <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                    {msg.translated ? <Pill color="blue">Tradus</Pill> : null}
                    {msg.moderated ? <Pill color="amber">Moderare</Pill> : null}
                    {msg.attachments?.map((att) => (
                      <Pill key={att.id} color={att.safe ? "green" : "amber"}>
                        Atașament: {att.name}
                      </Pill>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!draft) return;
                void addMessage(active.id, draft);
                setDraft("");
              }}
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Trimite un mesaj (moderare și traducere active)"
                className="flex-1 rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              />
              <button
                type="submit"
                className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Trimite
              </button>
            </form>
          </>
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-300">
            Selectează o conversație. Traducerea și moderarea sunt afișate ca badge-uri pe mesaje.
          </p>
        )}
      </div>
    </div>
  );
}
