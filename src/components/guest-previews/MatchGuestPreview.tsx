import Link from "next/link";
import { getMessages } from "./getMessages";

export async function MatchGuestPreview() {
  const messages = await getMessages();
  const t = (key: string) => messages.match?.[key] ?? key;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
        <header className="mb-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{t("guestTitle")}</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("guestAlgorithm")}</p>
        </header>
        <div className="space-y-4 text-sm text-zinc-600 dark:text-zinc-300">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
              <div className="mb-2 text-blue-500">✦</div>
              <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">{t("guestFeatureScore")}</h4>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t("guestFeatureScoreDesc")}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
              <div className="mb-2 text-green-500">⊞</div>
              <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">{t("guestFeatureLocation")}</h4>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t("guestFeatureLocationDesc")}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
              <div className="mb-2 text-amber-500">☰</div>
              <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">{t("guestFeatureCategory")}</h4>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t("guestFeatureCategoryDesc")}</p>
            </div>
          </div>

          {/* Demo match card */}
          <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4 dark:border-blue-800 dark:from-blue-950/30 dark:to-zinc-900">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-2xl dark:bg-blue-900/40">
                🎧
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">{t("guestDemoTitle")}</h4>
                  <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700 dark:bg-green-900/40 dark:text-green-300">
                    {t("guestDemoScore")}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>{t("guestDemoCategory")}</span>
                  <span>·</span>
                  <span>{t("guestDemoCondition")}</span>
                  <span>·</span>
                  <span>{t("guestDemoLocation")}</span>
                </div>
                <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-300">{t("guestDemoWants")}</p>
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
