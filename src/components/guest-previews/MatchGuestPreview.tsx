import { Link } from "@/i18n/navigation";
import { getMessages } from "./getMessages";

export async function MatchGuestPreview() {
  const messages = await getMessages();
  const t = (key: string) => messages.match?.[key] ?? key;

  const demoMatches = [
    {
      emoji: "💻",
      title: t("guestDemo1Title"),
      swap: t("guestDemo1Swap"),
      location: t("guestDemo1Location"),
      score: "92%",
      rating: "4.8 ⭐",
      bg: "bg-blue-100 dark:bg-blue-900/40",
    },
    {
      emoji: "📷",
      title: t("guestDemo2Title"),
      swap: t("guestDemo2Swap"),
      location: t("guestDemo2Location"),
      score: "87%",
      rating: "4.6 ⭐",
      bg: "bg-amber-100 dark:bg-amber-900/40",
    },
    {
      emoji: "🎸",
      title: t("guestDemo3Title"),
      swap: t("guestDemo3Swap"),
      location: t("guestDemo3Location"),
      score: "78%",
      rating: "4.9 ⭐",
      bg: "bg-green-100 dark:bg-green-900/40",
    },
  ];

  return (
    <div className="mx-auto max-w-[800px] px-4 py-12 sm:py-12">
      {/* Hero */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          🔗 {t("guestHeroTitle")}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-zinc-600 dark:text-zinc-400">
          {t("guestHeroDescription")}
        </p>
      </div>

      {/* Algorithm features */}
      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {[
          { icon: "✦", color: "text-blue-500", title: t("guestFeatureScore"), desc: t("guestFeatureScoreDesc") },
          { icon: "📍", color: "text-green-500", title: t("guestFeatureLocation"), desc: t("guestFeatureLocationDesc") },
          { icon: "📊", color: "text-amber-500", title: t("guestFeatureCategory"), desc: t("guestFeatureCategoryDesc") },
        ].map((f) => (
          <div key={f.title} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <div className={`mb-2 text-xl ${f.color}`}>{f.icon}</div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{f.title}</h3>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Demo match cards */}
      <div className="mb-4 space-y-3">
        {demoMatches.map((match) => (
          <div
            key={match.title}
            className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <div className="flex items-center gap-4">
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-2xl ${match.bg}`}>
                {match.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="truncate font-semibold text-zinc-900 dark:text-zinc-50">{match.title}</h4>
                  <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700 dark:bg-green-900/40 dark:text-green-300">
                    {match.score}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  ↔ {match.swap}
                </p>
                <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>📍 {match.location}</span>
                  <span>{match.rating}</span>
                </div>
              </div>
            </div>
            {/* Disabled action buttons */}
            <div className="mt-3 flex gap-2">
              <button
                disabled
                className="flex-1 rounded-full bg-blue-100 px-4 py-2 text-xs font-semibold text-blue-400 opacity-60 blur-[0.5px] dark:bg-blue-900/30 dark:text-blue-500"
              >
                {t("guestBtnAccept")}
              </button>
              <button
                disabled
                className="flex-1 rounded-full bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-400 opacity-60 blur-[0.5px] dark:bg-zinc-800 dark:text-zinc-500"
              >
                {t("guestBtnSkip")}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Note */}
      <p className="mb-8 text-center text-sm text-zinc-500 dark:text-zinc-400 italic">
        {t("guestDemoNote")}
      </p>

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
