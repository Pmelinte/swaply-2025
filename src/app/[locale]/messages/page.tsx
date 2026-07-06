import { ChatPage } from '@/components/chat/ChatPage';
import { getServerSupabase } from '@/lib/supabase/server';
import { getLocale, getTranslations } from 'next-intl/server';

export const revalidate = 0;

const previewThreads = [
  {
    name: 'Alex from Cluj',
    subject: 'Vintage camera ↔ Bluetooth speaker',
    lastMessage: 'Looks good. Can we confirm courier pickup after you check the packaging photos?',
    status: 'Packaging check',
    time: '12 min ago',
  },
  {
    name: 'Maria from Brasov',
    subject: 'Weekend apartment ↔ Seaside studio',
    lastMessage: 'Dates match. Swaply can keep the location private until both sides accept.',
    status: 'Waiting for accept',
    time: '1 h ago',
  },
  {
    name: 'Daniel from Vienna',
    subject: 'Concert ticket ↔ Hotel night',
    lastMessage: 'The ticket transfer is allowed by the issuer. Next step: confirm travel window.',
    status: 'Rules checked',
    time: 'Yesterday',
  },
];

function PublicMessagesPreview({ locale, title }: { locale: string; title: string }) {
  const loginUrl = `/${locale}/login?returnTo=/${locale}/messages`;

  return (
    <div className="space-y-6">
      <h1 className="sr-only">{title}</h1>

      <section className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6 shadow-sm dark:border-blue-900 dark:from-blue-950/40 dark:via-zinc-950 dark:to-cyan-950/30 md:p-8">
        <div className="max-w-3xl space-y-4">
          <p className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700 shadow-sm dark:bg-zinc-900 dark:text-blue-200">
            Public preview
          </p>
          <h2 className="text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 md:text-5xl">
            Swap messages before exchanging
          </h2>
          <p className="text-base leading-7 text-zinc-600 dark:text-zinc-300 md:text-lg">
            Conversations keep the exchange structured: translation, checklist, packaging photos, courier details and final confirmation stay in one place.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href={loginUrl} className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700">
              Sign in to open your inbox
            </a>
            <a href={`/${locale}/matching`} className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm font-bold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800">
              See matching preview
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-3">
          {previewThreads.map((thread) => (
            <article key={thread.subject} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-zinc-950 dark:text-zinc-50">{thread.name}</p>
                  <h3 className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">{thread.subject}</h3>
                </div>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-200">
                  {thread.time}
                </span>
              </div>
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{thread.lastMessage}</p>
              <p className="mt-3 inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">{thread.status}</p>
            </article>
          ))}
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">Conversation tools</p>
              <h3 className="mt-1 text-xl font-black text-zinc-950 dark:text-zinc-50">What unlocks after login</h3>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {['Automatic translation', 'Swap checklist', 'Photo attachments', 'Courier details', 'Location after consent', 'Final feedback'].map((feature) => (
              <div key={feature} className="rounded-2xl bg-zinc-50 p-4 text-sm font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">
                {feature}
              </div>
            ))}
          </div>
          <a href={loginUrl} className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700">
            Continue after login
          </a>
        </div>
      </section>
    </div>
  );
}

export default async function MessagesRoute() {
  const t = await getTranslations('chat');
  const locale = await getLocale();
  const supabase = await getServerSupabase();

  let userId: string | null = null;
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  }

  if (!userId) {
    return <PublicMessagesPreview locale={locale} title={t('pageTitle')} />;
  }

  return (
    <>
      <h1 className="sr-only">{t('pageTitle')}</h1>
      <ChatPage conversationId="demo-1" />
    </>
  );
}
