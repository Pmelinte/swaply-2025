import { Link } from "@/i18n/navigation";
import { getMessages } from "./getMessages";

export async function ProfileGuestPreview() {
  const messages = await getMessages();
  const t = (key: string) => messages.profile?.[key] ?? key;

  const features = [
    { title: "guestFeatureRating", desc: "guestFeatureRatingDesc" },
    { title: "guestFeatureBadge", desc: "guestFeatureBadgeDesc" },
    { title: "guestFeatureHistory", desc: "guestFeatureHistoryDesc" },
    { title: "guestFeatureVerify", desc: "guestFeatureVerifyDesc" },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
        <header className="mb-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{t("guestTitle")}</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("guestDescription")}</p>
        </header>
        <div className="space-y-4 text-sm text-zinc-600 dark:text-zinc-300">
          <div className="grid gap-3 sm:grid-cols-2">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">{t(f.title)}</h4>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t(f.desc)}</p>
              </div>
            ))}
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
