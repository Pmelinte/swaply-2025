import Link from "next/link";
import { getMessages } from "./getMessages";

export async function ChangeGuestPreview() {
  const messages = await getMessages();
  const t = (key: string) => messages.change?.[key] ?? key;

  const steps = [
    { key: "guestStep1Title", icon: "📦", color: "text-blue-600 dark:text-blue-400" },
    { key: "guestStep2Title", icon: "✓", color: "text-green-600 dark:text-green-400" },
    { key: "guestStep3Title", icon: "🚚", color: "text-amber-600 dark:text-amber-400" },
    { key: "guestStep4Title", icon: "🛡️", color: "text-purple-600 dark:text-purple-400" },
    { key: "guestStep5Title", icon: "⭐", color: "text-yellow-600 dark:text-yellow-400" },
  ];

  const descKeys = ["guestStep1Desc", "guestStep2Desc", "guestStep3Desc", "guestStep4Desc", "guestStep5Desc"];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
        <header className="mb-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{t("guestTitle")}</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("guestDescription")}</p>
        </header>
        <div className="space-y-4 text-sm text-zinc-600 dark:text-zinc-300">
          {/* Visual timeline */}
          <div className="flex items-center justify-between gap-1 overflow-x-auto rounded-xl bg-gradient-to-r from-blue-50 to-green-50 p-4 dark:from-blue-950/30 dark:to-green-950/30">
            {steps.map((step, i) => (
              <div key={step.key} className="flex items-center gap-1">
                <div className="flex flex-col items-center gap-1">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm dark:bg-zinc-800 ${step.color}`}>
                    <span className="text-lg">{step.icon}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-300">{t(step.key)}</span>
                </div>
                {i < 4 && <div className="mx-1 h-0.5 w-6 bg-zinc-300 dark:bg-zinc-600 sm:w-10" />}
              </div>
            ))}
          </div>

          {/* Step descriptions */}
          <div className="grid gap-2 sm:grid-cols-5">
            {descKeys.map((key) => (
              <p key={key} className="text-center text-[11px] text-zinc-500 dark:text-zinc-400">{t(key)}</p>
            ))}
          </div>

          <p className="text-sm text-zinc-600 dark:text-zinc-300">{t("guestLogistics")}</p>
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
