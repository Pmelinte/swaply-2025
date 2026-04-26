"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, MessageCircle, Plus } from "lucide-react";
import Image from "next/image";

interface Props {
  partnerName: string;
  partnerAvatarUrl?: string | null;
  isPartnerVerified?: boolean;
  historyOpen?: boolean;
  sessionStatus?: string | null;
  onToggleHistory: () => void;
  onNewSession?: () => void;
}

export function ChatHeader({
  partnerName,
  partnerAvatarUrl,
  isPartnerVerified,
  historyOpen,
  sessionStatus,
  onToggleHistory,
  onNewSession,
}: Props) {
  const t = useTranslations("chat");
  const router = useRouter();
  const canStartNewSession = sessionStatus === "paused" || sessionStatus === "completed";

  return (
    <div className="flex h-[53px] shrink-0 items-center gap-2 border-b border-zinc-100 bg-white px-3">
      {/* Back */}
      <button
        type="button"
        onClick={() => router.back()}
        className="rounded-full p-1.5 text-zinc-600 hover:bg-zinc-100"
        aria-label="Back"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      {/* Avatar */}
      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-zinc-100">
        {partnerAvatarUrl ? (
          <Image src={partnerAvatarUrl} alt={partnerName} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-bold text-zinc-500">
            {partnerName.slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>

      {/* Name + verified */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-zinc-900">@{partnerName}</p>
        {isPartnerVerified && (
          <p className="text-[10px] text-green-600">✅ {t("verified")}</p>
        )}
      </div>

      {/* New Session button — only when paused/completed */}
      {canStartNewSession && onNewSession && (
        <button
          type="button"
          onClick={onNewSession}
          className="flex items-center gap-1 rounded-full border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
          aria-label="New session"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">New session</span>
        </button>
      )}

      {/* History drawer trigger */}
      <button
        type="button"
        onClick={onToggleHistory}
        className={`rounded-full p-1.5 transition-colors ${
          historyOpen
            ? "bg-blue-100 text-blue-700"
            : "text-zinc-500 hover:bg-zinc-100"
        }`}
        aria-label="Conversation history"
        aria-expanded={historyOpen}
      >
        <MessageCircle className="h-5 w-5" />
      </button>
    </div>
  );
}
