import { getServerSupabase } from "@/lib/supabase/server";
import { getLocale, getTranslations } from "next-intl/server";
import MatchingPage from "@/components/matching/MatchingPage";
import { getPublicCoreUi } from "@/i18n/public-core-ui";

export const revalidate = 0;

function PublicMatchingPreview({ locale }: { locale: string }) {
  const loginUrl = `/${locale}/login?returnTo=/${locale}/matching`;
  const copy = getPublicCoreUi(locale);

  return (
    <div className="space-y-6">
      <h1 className="sr-only">{copy.matchingTitle}</h1>
      <section className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6 shadow-sm dark:border-blue-900 dark:from-blue-950/40 dark:via-zinc-950 dark:to-cyan-950/30 md:p-8">
        <div className="max-w-3xl space-y-4">
          <p className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700 shadow-sm dark:bg-zinc-900 dark:text-blue-200">
            {copy.preview}
          </p>
          <h2 className="text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 md:text-5xl">
            {copy.matchingTitle}
          </h2>
          <p className="text-base leading-7 text-zinc-600 dark:text-zinc-300 md:text-lg">
            {copy.matchingDescription}
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={loginUrl}
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
            >
              {copy.login}
            </a>
            <a
              href={`/${locale}/explore`}
              className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm font-bold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              {copy.explore}
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[copy.browseAll, copy.filters, copy.addObject].map((label, index) => (
          <article
            key={label}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div
              aria-hidden="true"
              className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-black text-blue-700 dark:bg-blue-900/40 dark:text-blue-200"
            >
              {index + 1}
            </div>
            <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50">
              {label}
            </h3>
          </article>
        ))}
      </section>
    </div>
  );
}

function firstSearchValue(
  value: string | string[] | undefined,
): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await getServerSupabase();
  const locale = await getLocale();
  const t = await getTranslations("matching");

  let userId: string | null = null;
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  }

  if (!userId) {
    return <PublicMatchingPreview locale={locale} />;
  }

  const parameters = (await searchParams) ?? {};
  const slot1 = firstSearchValue(parameters.slot1);
  const slot2 = firstSearchValue(parameters.slot2);
  const target = firstSearchValue(parameters.target);

  return (
    <>
      <h1 className="sr-only">{t("pageTitle")}</h1>
      <MatchingPage
        userId={userId}
        initialSlot1={slot1}
        initialSlot2={slot2}
        initialTarget={target}
      />
    </>
  );
}
