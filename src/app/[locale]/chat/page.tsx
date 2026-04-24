export const revalidate = 0;
import dynamic from "next/dynamic";
import { getTranslations } from "next-intl/server";

const ChatInbox = dynamic(
  () => import("@/components/chat/ChatInbox").then((m) => m.ChatInbox),
);

export default async function ChatInboxPage() {
  const t = await getTranslations("chat.inbox");

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {t("title")}
        </h1>
      </div>
      <ChatInbox />
    </div>
  );
}
