"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Menu } from "lucide-react";
import Image from "next/image";

interface Props {
  partnerName: string;
  partnerAvatarUrl?: string | null;
  isPartnerVerified?: boolean;
  agendaOpen?: boolean;
  onToggleAgenda: () => void;
}

export function ChatHeader({ partnerName, partnerAvatarUrl, isPartnerVerified, agendaOpen, onToggleAgenda }: Props) {
  const t = useTranslations("chat");
  const router = useRouter();

  return (
    <div className="flex items-center gap-3 border-b border-zinc-100 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
      {/* Back */}
      <button
        type="button"
        onClick={() => router.back()}
        className="rounded-full p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        aria-label="Back"
      >
        <ArrowLeft className="h-5 w-5 text-zinc-600 dark:text-zinc-300" />
      </button>

      {/* Avatar */}
      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        {partnerAvatarUrl ? (
          <Image src={partnerAvatarUrl} alt={partnerName} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-bold text-zinc-500">
            {partnerName.slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>

      {/* Name + verified */}
      <div className="flex-1 min-w-0">
        <p className="truncate font-semibold text-zinc-900 dark:text-zinc-50">@{partnerName}</p>
        {isPartnerVerified && (
          <p className="text-[10px] text-green-600 dark:text-green-400">✅ {t("verified")}</p>
        )}
      </div>

      {/* Agenda toggle */}
      <button
        type="button"
        onClick={onToggleAgenda}
        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors ${
          agendaOpen
            ? "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300"
            : "hover:bg-zinc-100 text-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
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
