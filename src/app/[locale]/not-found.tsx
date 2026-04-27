"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-bold text-zinc-300 dark:text-zinc-600">404</h1>
      <p className="text-xl font-semibold mt-4 text-zinc-900 dark:text-zinc-50">{t("title")}</p>
      <p className="text-zinc-500 dark:text-zinc-400 mt-2 max-w-md">{t("description")}</p>
      <div className="flex gap-3 mt-8 flex-wrap justify-center">
        <Link
          href="/"
          className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          {t("backHome")}
        </Link>
        <Link
          href="/objects"
          className="rounded-full border border-zinc-200 bg-white px-6 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {t("browseObjects")}
        </Link>
      </div>
    </div>
  );
}
