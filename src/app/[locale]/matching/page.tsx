import { getServerSupabase } from "@/lib/supabase/server";
import { getLocale, getTranslations } from "next-intl/server";
import MatchingPage from "@/components/matching/MatchingPage";

export const revalidate = 0;

type MatchingPreviewCopy = {
  badge: string;
  heading: string;
  description: string;
  signup: string;
  explore: string;
  score: string;
  continueAfterLogin: string;
  examples: Array<
    [domain: string, label: string, score: string, reason: string]
  >;
};

const matchingPreviewCopy: Record<"en" | "ro", MatchingPreviewCopy> = {
  en: {
    badge: "Public preview",
    heading: "AI Matching suggestions",
    description:
      "See how Swaply compares offers and wishes by domain, distance, value, exchange mode and trust signals.",
    signup: "Sign up to unlock real matches",
    explore: "Explore objects first",
    score: "score",
    continueAfterLogin: "Continue after login",
    examples: [
      [
        "Objects",
        "Vintage jacket ↔ Mountain bike frame",
        "94",
        "Nearby, similar value, trusted profile",
      ],
      [
        "Properties",
        "Brasov weekend ↔ Constanta studio",
        "88",
        "Compatible dates and vacation handover",
      ],
      [
        "Services",
        "Website audit ↔ Clinic photo session",
        "83",
        "Remote service swap with close value",
      ],
      [
        "Events",
        "Vienna ticket ↔ Bratislava hotel night",
        "79",
        "Travel window overlaps",
      ],
    ],
  },
  ro: {
    badge: "Previzualizare publică",
    heading: "Sugestii de potrivire AI",
    description:
      "Vezi cum compară Swaply ofertele și dorințele după domeniu, distanță, valoare, mod de schimb și semnale de încredere.",
    signup: "Creează cont pentru potriviri reale",
    explore: "Explorează întâi obiectele",
    score: "scor",
    continueAfterLogin: "Continuă după autentificare",
    examples: [
      [
        "Obiecte",
        "Geacă vintage ↔ Cadru de bicicletă MTB",
        "94",
        "Aproape, valoare similară, profil de încredere",
      ],
      [
        "Proprietăți",
        "Weekend la Brașov ↔ Garsonieră la Constanța",
        "88",
        "Date compatibile și predare în vacanță",
      ],
      [
        "Servicii",
        "Audit site cabinet ↔ Ședință foto clinică",
        "83",
        "Schimb de servicii la distanță, cu valoare apropiată",
      ],
      [
        "Evenimente",
        "Bilet concert Viena ↔ Noapte de hotel Bratislava",
        "79",
        "Fereastra de călătorie se potrivește",
      ],
    ],
  },
};

function getMatchingPreviewCopy(locale: string) {
  return locale.startsWith("ro")
    ? matchingPreviewCopy.ro
    : matchingPreviewCopy.en;
}

function PublicMatchingPreview({
  locale,
  title,
}: {
  locale: string;
  title: string;
}) {
  const loginUrl = `/${locale}/login?returnTo=/${locale}/matching`;
  const copy = getMatchingPreviewCopy(locale);

  return (
    <div className="space-y-6">
      <h1 className="sr-only">{title}</h1>
      <section className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6 shadow-sm dark:border-blue-900 dark:from-blue-950/40 dark:via-zinc-950 dark:to-cyan-950/30 md:p-8">
        <div className="max-w-3xl space-y-4">
          <p className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700 shadow-sm dark:bg-zinc-900 dark:text-blue-200">
            {copy.badge}
          </p>
          <h2 className="text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 md:text-5xl">
            {copy.heading}
          </h2>
          <p className="text-base leading-7 text-zinc-600 dark:text-zinc-300 md:text-lg">
            {copy.description}
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={loginUrl}
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
            >
              {copy.signup}
            </a>
            <a
              href={`/${locale}/objects`}
              className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm font-bold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              {copy.explore}
            </a>
          </div>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        {copy.examples.map(([domain, label, score, reason]) => (
          <article
            key={label}
            className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">
                  {domain}
                </p>
                <h3 className="mt-1 text-base font-bold text-zinc-950 dark:text-zinc-50">
                  {label}
                </h3>
              </div>
              <div className="rounded-2xl bg-blue-600 px-3 py-2 text-center text-white shadow-sm">
                <div className="text-lg font-black leading-none">{score}</div>
                <div className="text-[10px] font-semibold uppercase tracking-wide">
                  {copy.score}
                </div>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              {reason}
            </p>
            <a
              href={loginUrl}
              className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {copy.continueAfterLogin}
            </a>
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
    return <PublicMatchingPreview locale={locale} title={t("pageTitle")} />;
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
