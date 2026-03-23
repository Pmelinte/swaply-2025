"use client";

import { useTranslations } from "next-intl";

export function AuthorCard() {
  const t = useTranslations("blog");
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white/80 p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/80">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
        PM
      </div>
      <div>
        <p className="font-semibold text-zinc-900 dark:text-zinc-50">
          Petru Melinte
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {t("founderTitle")}
        </p>
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
          {t("founderBio")}
        </p>
      </div>
    </div>
  );
}
