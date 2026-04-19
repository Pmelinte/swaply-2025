"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { useAppState } from "@/lib/state";
import { useDrawerStore } from "@/lib/state/drawerStore";
import { ChatDrawerHistory } from "@/components/chat/drawer/ChatDrawerHistory";
import { ChatDrawerDocuments } from "@/components/chat/drawer/ChatDrawerDocuments";
import { ChatDrawerUserProfile } from "@/components/chat/drawer/ChatDrawerUserProfile";
import { ChatDrawerAgreements } from "@/components/chat/drawer/ChatDrawerAgreements";
import type { AgendaState } from "@/lib/chat/chatAgenda";

type Tab = "history" | "documents" | "profile" | "agreements";

const TABS: { key: Tab; icon: string; labelKey: string }[] = [
  { key: "history",    icon: "💬", labelKey: "tabHistory" },
  { key: "documents",  icon: "📎", labelKey: "tabDocuments" },
  { key: "profile",    icon: "👤", labelKey: "tabProfile" },
  { key: "agreements", icon: "📋", labelKey: "tabAgreements" },
];

// Empty agenda used when agendaState is not available from the store yet.
// Documents and agreements tabs are fully functional once the chat page
// calls openWith({ type: "chat", conversationId }) and passes live state.
const EMPTY_AGENDA: AgendaState = {};

interface Props {
  conversationId: string;
}

export default function DrawerChat({ conversationId }: Props) {
  const t = useTranslations("chatDrawer");
  const close = useDrawerStore((s) => s.close);
  const { conversations } = useAppState();
  const [activeTab, setActiveTab] = useState<Tab>("history");

  // Derive partner info from the app-state conversation list so we don't
  // need extra props beyond the conversationId that the store already holds.
  const conversation = useMemo(
    () => conversations.find((c) => c.id === conversationId),
    [conversations, conversationId],
  );

  const partnerId = conversation?.participantId ?? "";
  const partnerName = conversation?.participantName ?? "";

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">@{partnerName}</h2>
        <button
          type="button"
          onClick={close}
          className="rounded-full p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <X className="h-5 w-5 text-zinc-500" />
        </button>
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
            <span>{t(tab.labelKey as keyof object)}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "history" && (
          <ChatDrawerHistory
            currentConversationId={conversationId}
            partnerId={partnerId}
          />
        )}
        {activeTab === "documents" && (
          <ChatDrawerDocuments messages={[]} />
        )}
        {activeTab === "profile" && (
          <ChatDrawerUserProfile partnerId={partnerId} partnerName={partnerName} />
        )}
        {activeTab === "agreements" && (
          <ChatDrawerAgreements
            agendaState={EMPTY_AGENDA}
            myRole="userA"
            partnerName={partnerName}
          />
        )}
      </div>
    </>
  );
}
