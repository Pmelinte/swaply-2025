import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { locales } from "@/i18n/config";
import DomainUniverseBar from "@/components/navigation/DomainUniverseBar";

const BASE_URL = "https://www.swaply.world";

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "objects" });
  const metaTitle = t("metaTitle");
  const title = `${metaTitle} | Swaply`;
  const description = t("metaDescription");

  return {
    title: { absolute: title },
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary", title, description },
    alternates: {
      canonical: `${BASE_URL}/${locale}/objects`,
      languages: Object.fromEntries([
        ...locales.map((loc) => [loc, `${BASE_URL}/${loc}/objects`]),
        ["x-default", `${BASE_URL}/en/objects`],
      ]),
    },
  };
}

export default function ObjectsLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-sky-100/60">
      <DomainUniverseBar />
      {children}
    </div>
  );
}
