import { RealChatPage } from "@/components/chat/RealChatPage";
import { getServerSupabase } from "@/lib/supabase/server";
import { getLocale, getTranslations } from "next-intl/server";
import { getPublicCoreCopy } from "@/i18n/public-core-copy";
import styles from "./messages-performance.module.css";

export const revalidate = 0;

type PublicMessagesPreviewProps = {
  locale: string;
  title: string;
  loginLabel: string;
  matchingLabel: string;
  conversationsLabel: string;
  secureChatLabel: string;
  exchangeLabel: string;
};

function PublicMessagesPreview({
  locale,
  title,
  loginLabel,
  matchingLabel,
  conversationsLabel,
  secureChatLabel,
  exchangeLabel,
}: PublicMessagesPreviewProps) {
  const copy = getPublicCoreCopy(locale);
  const loginUrl = `/${locale}/login?returnTo=/${locale}/messages`;

  return (
    <div className="space-y-6">
      <h1 className="sr-only">{title}</h1>
      <section className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6 shadow-sm dark:border-blue-900 dark:from-blue-950/40 dark:via-zinc-950 dark:to-cyan-950/30 md:p-8">
        <div className="max-w-3xl space-y-4">
          <p className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700 shadow-sm dark:bg-zinc-900 dark:text-blue-200">
            {copy.preview}
          </p>
          <h2 className="text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 md:text-5xl">
            {title}
          </h2>
          <p className="text-base leading-7 text-zinc-600 dark:text-zinc-300 md:text-lg">
            {copy.messagesDescription}
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={loginUrl}
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
            >
              {loginLabel}
            </a>
            <a
              href={`/${locale}/matching`}
              className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm font-bold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              {matchingLabel}
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {[conversationsLabel, secureChatLabel, exchangeLabel].map((label, index) => (
          <div
            key={label}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div
              aria-hidden="true"
              className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-cyan-100 text-xs font-black text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-200"
            >
              {index + 1}
            </div>
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              {label}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}

export default async function MessagesRoute() {
  const [t, tCommon, tNav] = await Promise.all([
    getTranslations("chat"),
    getTranslations("common"),
    getTranslations("nav"),
  ]);
  const locale = await getLocale();
  const supabase = await getServerSupabase();

  let userId: string | null = null;
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  }

  if (!userId) {
    return (
      <PublicMessagesPreview
        locale={locale}
        title={t("pageTitle")}
        loginLabel={tCommon("nudgeLogin")}
        matchingLabel={tNav("matching")}
        conversationsLabel={t("conversations")}
        secureChatLabel={t("secureChat")}
        exchangeLabel={tNav("exchange")}
      />
    );
  }

  return (
    <div className={styles.shell}>
      <h1 className="sr-only">{t("pageTitle")}</h1>
      <RealChatPage />
    </div>
  );
}
