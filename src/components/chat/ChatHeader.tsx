"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Menu, MessageCircle } from "lucide-react";
import Image from "next/image";

interface Props {
  partnerName: string;
  partnerAvatarUrl?: string | null;
  isPartnerVerified?: boolean;
  agendaOpen?: boolean;
  historyOpen?: boolean;
  onToggleAgenda: () => void;
  onToggleHistory: () => void;
}

export function ChatHeader({
  partnerName,
  partnerAvatarUrl,
  isPartnerVerified,
  agendaOpen,
  historyOpen,
  onToggleAgenda,
  onToggleHistory,
}: Props) {
  const t = useTranslations("chat");
  const router = useRouter();

  return (
    <div className="flex h-[53px] shrink-0 items-center gap-2 border-b border-zinc-100 bg-white px-3">
      {/* Conversation history trigger */}
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

      {/* Agenda toggle */}
      <button
        type="button"
        onClick={onToggleAgenda}
        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors ${
          agendaOpen
            ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
            : "text-zinc-600 hover:bg-zinc-100"
        }`}
        aria-label="Toggle Exchange Agenda"
        aria-expanded={agendaOpen}
      >
        <Menu className="h-4 w-4" />
        <span className="hidden sm:inline">Agenda</span>
      </button>
    </div>
  );
}
