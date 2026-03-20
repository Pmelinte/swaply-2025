import Link from "next/link";
import { getMessages } from "./getMessages";

export async function ChangeGuestPreview() {
  const messages = await getMessages();
  const t = (key: string) => messages.change?.[key] ?? key;

  const steps = [
    { icon: "📤", title: t("guestStep1Title"), desc: t("guestStep1Desc"), color: "border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-950/30" },
    { icon: "✅", title: t("guestStep2Title"), desc: t("guestStep2Desc"), color: "border-green-400 bg-green-50 dark:border-green-600 dark:bg-green-950/30" },
    { icon: "🚚", title: t("guestStep3Title"), desc: t("guestStep3Desc"), color: "border-amber-400 bg-amber-50 dark:border-amber-600 dark:bg-amber-950/30" },
    { icon: "📦", title: t("guestStep4Title"), desc: t("guestStep4Desc"), color: "border-purple-400 bg-purple-50 dark:border-purple-600 dark:bg-purple-950/30" },
    { icon: "⭐", title: t("guestStep5Title"), desc: t("guestStep5Desc"), color: "border-yellow-400 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-950/30" },
  ];

  return (
    <div className="mx-auto max-w-[800px] px-4 py-12 sm:py-12">
      {/* Hero */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          🔄 {t("guestHeroTitle")}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-zinc-600 dark:text-zinc-400">
          {t("guestHeroDescription")}
        </p>
      </div>

      {/* Vertical timeline */}
      <div className="relative mb-10 pl-8 sm:pl-10">
        {/* Vertical line */}
        <div className="absolute left-3 top-0 h-full w-0.5 bg-zinc-200 dark:bg-zinc-700 sm:left-4" />

        <div className="space-y-6">
          {steps.map((step, i) => (
            <div key={i} className="relative">
              {/* Timeline dot */}
              <div className="absolute -left-8 flex h-6 w-6 items-center justify-center rounded-full border-2 border-blue-500 bg-white text-xs font-bold text-blue-600 dark:bg-zinc-900 dark:text-blue-400 sm:-left-10 sm:h-8 sm:w-8 sm:text-sm">
                {i + 1}
              </div>

              {/* Step card */}
              <div className={`rounded-xl border-l-4 p-4 ${step.color}`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{step.icon}</span>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{step.title}</h3>
                </div>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{step.desc}</p>
              </div>
            </div>
          ))}
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
