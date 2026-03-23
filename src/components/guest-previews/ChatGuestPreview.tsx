import { Link } from "@/i18n/navigation";
import { getMessages } from "./getMessages";

export async function ChatGuestPreview() {
  const messages = await getMessages();
  const t = (key: string) => messages.chat?.[key] ?? key;

  const features = [
    { icon: "🔒", text: t("guestFeature1") },
    { icon: "📜", text: t("guestFeature2") },
    { icon: "📎", text: t("guestFeature3") },
    { icon: "🛡️", text: t("guestFeature4") },
  ];

  const chatMessages = [
    { side: "left" as const, initials: "M", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300", text: t("guestMockMsg1") },
    { side: "right" as const, initials: "A", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300", text: t("guestMockMsg2") },
    { side: "left" as const, initials: "M", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300", text: t("guestMockMsg3") },
  ];

  return (
    <div className="mx-auto max-w-[800px] px-4 py-12 sm:py-12">
      {/* Hero */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          💬 {t("guestHeroTitle")}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-zinc-600 dark:text-zinc-400">
          {t("guestHeroDescription")}
        </p>
      </div>

      {/* Features checklist */}
      <div className="mb-8 grid gap-3 sm:grid-cols-2">
        {features.map((f) => (
          <div
            key={f.text}
            className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <span className="text-xl">{f.icon}</span>
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{f.text}</span>
          </div>
        ))}
      </div>

      {/* Mock conversation */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        {/* Chat header */}
        <div className="border-b border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              {t("guestMockUser1")} & {t("guestMockUser2")}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-4 p-4 sm:p-6">
          {chatMessages.map((msg, i) =>
            msg.side === "left" ? (
              <div key={i} className="flex gap-2">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${msg.color}`}>
                  {msg.initials}
                </div>
                <div className="max-w-[75%] rounded-2xl rounded-tl-sm bg-zinc-100 px-4 py-2.5 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                  {msg.text}
                </div>
              </div>
            ) : (
              <div key={i} className="flex flex-row-reverse gap-2">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${msg.color}`}>
                  {msg.initials}
                </div>
                <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-2.5 text-sm text-white">
                  {msg.text}
                </div>
              </div>
            ),
          )}
        </div>

        {/* Disabled input */}
        <div className="border-t border-zinc-100 p-3 dark:border-zinc-700">
          <div className="flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-2.5 dark:bg-zinc-800">
            <span className="flex-1 text-sm text-zinc-400 dark:text-zinc-500">
              {t("guestInputPlaceholder")}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-zinc-400 dark:bg-zinc-700 dark:text-zinc-500">
              ➤
            </div>
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-col items-center gap-3">
        <Link
          href="/register"
          className="inline-flex items-center justify-center rounded-full bg-blue-600 px-8 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-blue-700"
        >
          {t("guestCta")}
        </Link>
        <Link
          href="/login"
          className="text-sm font-medium text-zinc-500 transition hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
        >
          {t("guestCtaLogin")}
        </Link>
      </div>
    </div>
  );
}
