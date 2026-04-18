"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Menu } from "lucide-react";
import Image from "next/image";

interface Props {
  partnerName: string;
  partnerAvatarUrl?: string | null;
  isPartnerVerified?: boolean;
  onOpenDrawer: () => void;
}

export function ChatHeader({ partnerName, partnerAvatarUrl, isPartnerVerified, onOpenDrawer }: Props) {
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

      {/* Drawer trigger */}
      <button
        type="button"
        onClick={onOpenDrawer}
        className="rounded-full p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        aria-label="Open drawer"
      >
        <Menu className="h-5 w-5 text-zinc-600 dark:text-zinc-300" />
      </button>
    </div>
  );
}
