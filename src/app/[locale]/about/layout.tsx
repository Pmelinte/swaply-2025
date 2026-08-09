import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { locales } from "@/i18n/config";

const BASE_URL = "https://www.swaply.world";
const SAFE_DESCRIPTION =
  "The story behind Swaply — a platform for discovering and arranging voluntary exchanges.";

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });

  const metaTitle = t("metaTitle");
  const title = `${metaTitle} | Swaply`;
  const description = SAFE_DESCRIPTION;

  return {
    title: { absolute: title },
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary", title, description },
    alternates: {
      canonical: `${BASE_URL}/${locale}/about`,
      languages: Object.fromEntries([
        ...locales.map((loc) => [loc, `${BASE_URL}/${loc}/about`]),
        ["x-default", `${BASE_URL}/en/about`],
      ]),
    },
  };
}

export default function AboutLayout({ children }: Props) {
  return children;
}
