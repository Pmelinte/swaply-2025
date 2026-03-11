import Link from "next/link";
import { getMessages } from "./getMessages";

export async function MyObjectsGuestPreview() {
  const messages = await getMessages();
  const t = (key: string) => messages.myObjects?.[key] ?? key;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{t("guestTitle")}</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{t("guestDescription")}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="flex items-start gap-3 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">
            <div className="mt-0.5 text-blue-500">📷</div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{t("guestFeaturePhotos")}</h4>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{t("guestFeaturePhotosDesc")}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">
            <div className="mt-0.5 text-green-500">✏️</div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{t("guestFeatureDetails")}</h4>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{t("guestFeatureDetailsDesc")}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">
            <div className="mt-0.5 text-amber-500">📈</div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{t("guestFeatureValue")}</h4>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{t("guestFeatureValueDesc")}</p>
            </div>
          </div>
        </div>
        <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
          💡 {t("guestTip")}
        </div>
        <div className="mt-5">
          <Link href="/register" className="inline-flex rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            {t("guestCta")}
          </Link>
        </div>
      </div>
    </div>
  );
}
