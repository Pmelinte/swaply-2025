import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, Building2 } from "lucide-react";
import { getTranslations } from "next-intl/server";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "branches" });
  return { title: t("properties") };
}

export default async function PropertiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "branches" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-12 text-center">
      <div className="flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white shadow-lg">
          <Building2 className="h-10 w-10" />
        </div>
      </div>
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{t("properties")}</h1>
      <p className="text-lg text-zinc-500 dark:text-zinc-400">{t("comingSoon")}</p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
      >
        <ArrowLeft className="h-4 w-4" />
        {tCommon("back")}
      </Link>
    </div>
  );
}
