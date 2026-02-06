"use client";

import { useEffect } from "react";
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
    return <LoggedOutGate returnTo="/chat" />;
  }

  return (
    <div className="space-y-4">
      <SectionCard
        title="Chat securizat"
        description="Traducere (dacă e on) + moderare + atașamente scanate + CTA spre Swaply"
        action={<CTAButton href="/change">Confirmă swap</CTAButton>}
      >
        <ChatPanel conversations={conversations} initialConversationId={initialConversationId} />
      </SectionCard>
      <SectionCard title="Reguli chat" description="Fără leak de date private, moderare automată">
        <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
          <li>Atașamentele sunt scanate pentru siguranță; statusul safe apare ca badge.</li>
          <li>Traducerea poate fi activată/ dezactivată per conversație.</li>
          <li>CTA către Swaply (pagina Change) este prezent pentru confirmare logistică.</li>
        </ul>
      </SectionCard>

      <NextStepRecommendation
        steps={[
          { label: "Confirmă un swap", href: "/change", description: "Treci la confirmarea logisticii" },
          { label: "Vezi match-uri", href: "/match", description: "Descoperă alte potriviri noi" },
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

