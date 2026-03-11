import Link from "next/link";
import { getMessages } from "./getMessages";

export async function ChatGuestPreview() {
  const messages = await getMessages();
  const t = (key: string) => messages.chat?.[key] ?? key;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
        <header className="mb-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{t("guestTitle")}</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("guestDescription")}</p>
        </header>
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
      </section>

      <div className="text-center">
        <Link
          href="/register"
          className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          {t("guestCta")}
        </Link>
      </div>
    </div>
  );
}
