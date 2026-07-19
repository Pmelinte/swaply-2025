"use client";

import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { getProfileTranslationPreferences } from "@/lib/profile/profileTranslationPreferences";
import { CTAButton, NextStepRecommendation, SectionCard, StateShowcase } from "@/components/ui-custom";
import { ChatPanel } from "@/features/chat/ChatPanel";

export function ChatClient({
  to,
  conversationId,
  serverAuthenticated = true,
}: {
  to?: string | null;
  conversationId?: string | null;
  serverAuthenticated?: boolean;
}) {
  const {
    user,
    loading,
    conversations,
    ensureConversation,
    toggleConversationTranslation,
  } = useAppState();
  const locale = useLocale();
  const t = useTranslations("chat");
  const tc = useTranslations("common");
  const translationPreferenceSeededRef = useRef(new Set<string>());
  const dmConversationId =
    to && user?.id ? `dm:${[user.id, to].sort().join(":")}` : undefined;
  const initialConversationId = (conversationId ?? dmConversationId) ?? undefined;

  useEffect(() => {
    if (!user?.id) return;
    if (!to) return;
    // Ensure the conversation exists in state (creates the shell + pulls participant profile if possible).
    void ensureConversation(to);
  }, [ensureConversation, to, user?.id]);

  useEffect(() => {
    const activeConversationIds = new Set(conversations.map((conversation) => conversation.id));
    for (const seededId of translationPreferenceSeededRef.current) {
      if (!activeConversationIds.has(seededId)) {
        translationPreferenceSeededRef.current.delete(seededId);
      }
    }

    const { autoTranslateMessages } = getProfileTranslationPreferences(user);
    if (!user?.id || !autoTranslateMessages) return;

    for (const conversation of conversations) {
      if (translationPreferenceSeededRef.current.has(conversation.id)) continue;
      translationPreferenceSeededRef.current.add(conversation.id);
      if (!conversation.translationEnabled) {
        toggleConversationTranslation(conversation.id);
      }
    }
  }, [conversations, toggleConversationTranslation, user]);

  // Skip auth spinner when server already resolved auth status
  if (loading.auth && serverAuthenticated) {
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
        action={<CTAButton href="/exchange">{t("confirmSwap")}</CTAButton>}
      >
        <ChatPanel
          key={locale}
          conversations={conversations}
          initialConversationId={initialConversationId}
        />
      </SectionCard>
      <SectionCard title={t("rules")} description={t("rulesDescription")}>
        <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
          <li>{t("attachmentsScanned")}</li>
          <li>{t("translationToggle")}</li>
          <li>{t("ctaToSwaply")}</li>
        </ul>
      </SectionCard>

      <NextStepRecommendation
        title={tc("nextStepRecommended")}
        steps={[
          { label: t("confirmASwap"), href: "/exchange", description: t("confirmDescription") },
          { label: t("viewMatches"), href: "/matching", description: t("viewMatchesDescription") },
        ]}
      />

      <StateShowcase
        title="CHAT States"
        states={[
          {
            key: "loading",
            title: "Loading conversations",
            description: "Skeleton list + moderation badge until conversations arrive.",
          },
          {
            key: "empty",
            title: "No conversations",
            description: "Empty state in panel + CTA to /objects or /match to start a chat.",
          },
          {
            key: "error",
            title: "Message delivery error",
            description: "Clear message + retry button, no crash and no user disconnection.",
          },
        ]}
      />
    </div>
  );
}
