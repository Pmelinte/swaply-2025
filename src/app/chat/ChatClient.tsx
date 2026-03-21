"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { CTAButton, NextStepRecommendation, SectionCard, StateShowcase } from "@/components/ui";
import { ChatPanel } from "@/features/chat/ChatPanel";

export function ChatClient({
  to,
  conversationId,
}: {
  to?: string | null;
  conversationId?: string | null;
}) {
  const { user, loading, conversations, ensureConversation } = useAppState();
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

  if (loading.auth) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-zinc-400 dark:text-zinc-500">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-500 dark:border-zinc-600 dark:border-t-blue-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <SectionCard title={t("guestTitle")} description={t("guestDescription")}>
          <div className="space-y-4 text-sm text-zinc-600 dark:text-zinc-300">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">{t("guestFeaturePrivate")}</h4>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t("guestFeaturePrivateDesc")}</p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">{t("guestFeatureHistory")}</h4>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t("guestFeatureHistoryDesc")}</p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">{t("guestFeatureModeration")}</h4>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t("guestFeatureModerationDesc")}</p>
              </div>
            </div>

            {/* Mock conversation */}
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
              <div className="border-b border-zinc-100 bg-zinc-50 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-800/80">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{t("guestMockUser1")} & {t("guestMockUser2")}</span>
              </div>
              <div className="space-y-3 p-4">
                <div className="flex gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">M</div>
                  <div className="rounded-2xl rounded-tl-sm bg-zinc-100 px-3 py-2 text-xs text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">{t("guestMockMsg1")}</div>
                </div>
                <div className="flex flex-row-reverse gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">A</div>
                  <div className="rounded-2xl rounded-tr-sm bg-blue-600 px-3 py-2 text-xs text-white">{t("guestMockMsg2")}</div>
                </div>
                <div className="flex gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">M</div>
                  <div className="rounded-2xl rounded-tl-sm bg-zinc-100 px-3 py-2 text-xs text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">{t("guestMockMsg3")}</div>
                </div>
                <div className="flex flex-row-reverse gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">A</div>
                  <div className="rounded-2xl rounded-tr-sm bg-blue-600 px-3 py-2 text-xs text-white">{t("guestMockMsg4")}</div>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        <div className="text-center">
          <CTAButton href="/register">{t("guestCta")}</CTAButton>
        </div>
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

