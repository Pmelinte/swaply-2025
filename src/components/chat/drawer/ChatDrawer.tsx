"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { ChatDrawerHistory } from "./ChatDrawerHistory";
import { ChatDrawerDocuments } from "./ChatDrawerDocuments";
import { ChatDrawerUserProfile } from "./ChatDrawerUserProfile";
import { ChatDrawerAgreements } from "./ChatDrawerAgreements";
import type { AgendaState } from "@/lib/chat/chatAgenda";
import type { RealtimeMessage } from "@/lib/chat/chatRealtime";

type Tab = "history" | "documents" | "profile" | "agreements";

interface Props {
  conversationId: string;
  partnerId: string;
  partnerName: string;
  messages: (RealtimeMessage & { content: string })[];
  agendaState: AgendaState;
  myRole: "userA" | "userB";
  onClose?: () => void;
}

const TABS: { key: Tab; icon: string; labelKey: string }[] = [
  { key: "history",    icon: "💬", labelKey: "history" },
  { key: "documents",  icon: "📎", labelKey: "documents" },
  { key: "profile",    icon: "👤", labelKey: "profile" },
  { key: "agreements", icon: "📋", labelKey: "agreements" },
];

export function ChatDrawer({
  conversationId,
  partnerId,
  partnerName,
  messages,
  agendaState,
  myRole,
  onClose,
}: Props) {
  const t = useTranslations("chat.drawer");
  const [activeTab, setActiveTab] = useState<Tab>("history");

  return (
    <div className="flex h-full w-full flex-col bg-white dark:bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
          @{partnerName}
        </h2>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5 text-zinc-500" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-100 dark:border-zinc-800">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition ${
              activeTab === tab.key
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            }`}
          >
            <span className="text-base">{tab.icon}</span>
            <span>{t(tab.labelKey)}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "history" && (
          <ChatDrawerHistory
            currentConversationId={conversationId}
            partnerId={partnerId}
          />
        )}
        {activeTab === "documents" && (
          <ChatDrawerDocuments messages={messages} />
        )}
        {activeTab === "profile" && (
          <ChatDrawerUserProfile partnerId={partnerId} partnerName={partnerName} />
        )}
        {activeTab === "agreements" && (
          <ChatDrawerAgreements
            agendaState={agendaState}
            myRole={myRole}
            partnerName={partnerName}
          />
        )}
      </div>
    </div>
  );
}
