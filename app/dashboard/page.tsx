"use client";

import Link from "next/link";
import useTranslation from "@/components/LanguageProvider";

export default function DashboardPage() {
  const { t } = useTranslation();

  return (
    <main className="p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">{t("dashboard.title")}</h1>
        <p className="text-sm opacity-80">{t("dashboard.subtitle")}</p>
      </header>

      <section className="space-y-3">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/items"
            className="inline-flex items-center rounded-md border px-4 py-2 text-sm hover:bg-black/5"
          >
            {t("dashboard.goToItems")}
          </Link>

          <Link
            href="/items/add"
            className="inline-flex items-center rounded-md border px-4 py-2 text-sm hover:bg-black/5"
          >
            {t("dashboard.addItem")}
          </Link>

          <Link
            href="/settings/profile"
            className="inline-flex items-center rounded-md border px-4 py-2 text-sm hover:bg-black/5"
          >
            {t("dashboard.profileSettings")}
          </Link>
        </div>
      </section>
    </main>
  );
}
