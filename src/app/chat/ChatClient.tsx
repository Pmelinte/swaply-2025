"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { LoggedOutGate } from "@/components/gated";
import { CTAButton, NextStepRecommendation, SectionCard, StateShowcase } from "@/components/ui";
import { ChatPanel } from "@/features/chat/ChatPanel";

export function ChatClient({
  to,
  conversationId,
}: {
  to?: string | null;
  conversationId?: string | null;
}) {
  const { user, conversations, ensureConversation } = useAppState();
  const t = useTranslations("chat");
  const dmConversationId =
    to && user?.id ? `dm:${[user.id, to].sort().join(":")}` : undefined;
  const initialConversationId = (conversationId ?? dmConversationId) ?? undefined;

  useEffect(() => {
    if (!user?.id) return;
    if (!to) return;
    // Ensure the conversation exists in state (creates the shell + pulls participant profile if possible).
    void ensureConversation(to);
  }, [ensureConversation, to, user?.id]);

  if (!user) {
    return (
      <div className="space-y-6">
        <SectionCard title="Chat securizat" description="Comunică direct cu ceilalți utilizatori Swaply">
          <div className="space-y-4 text-sm text-zinc-600 dark:text-zinc-300">
            <p>
              Chat-ul Swaply îți permite să negociezi detaliile schimbului direct cu celălalt utilizator. Toate mesajele sunt moderate automat pentru a preveni spam-ul, limbajul abuziv și scurgerile de date personale.
            </p>
            <ul className="list-inside list-disc space-y-1.5 text-zinc-500 dark:text-zinc-400">
              <li>Mesaje text în timp real între participanți</li>
              <li>Moderare AI automată pentru siguranță</li>
              <li>Istoric complet al conversațiilor</li>
              <li>Notificări pentru mesaje noi</li>
              <li>Buton rapid de confirmare a schimbului direct din chat</li>
            </ul>
          </div>
        </SectionCard>
        <LoggedOutGate returnTo="/chat" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SectionCard
        title={t("title")}
        description={t("description")}
        action={<CTAButton href="/change">{t("confirmSwap")}</CTAButton>}
      >
        <ChatPanel conversations={conversations} initialConversationId={initialConversationId} />
      </SectionCard>
      <SectionCard title={t("rules")} description={t("rulesDescription")}>
        <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
          <li>{t("attachmentsScanned")}</li>
          <li>{t("translationToggle")}</li>
          <li>{t("ctaToSwaply")}</li>
        </ul>
      </SectionCard>

      <NextStepRecommendation
        steps={[
          { label: t("confirmASwap"), href: "/change", description: t("confirmDescription") },
          { label: t("viewMatches"), href: "/match", description: t("viewMatchesDescription") },
        ]}
      />

      <StateShowcase
        title="Stări CHAT"
        states={[
          {
            key: "loading",
            title: "Încărcare conversații",
            description: "Skeleton list + badge moderare până sosesc conversațiile.",
          },
          {
            key: "empty",
            title: "Fără conversații",
            description: "Empty state în panel + CTA spre /objects sau /match pentru inițiere chat.",
          },
          {
            key: "error",
            title: "Eroare livrare mesaj",
            description: "Mesaj clar + buton retry, fără crash și fără a deconecta utilizatorul.",
          },
        ]}
      />
    </div>
  );
}

