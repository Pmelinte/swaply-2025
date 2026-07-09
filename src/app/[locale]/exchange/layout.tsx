import type { Metadata } from "next";
import { buildRouteAlternates } from "@/lib/seo/route-alternates";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  return {
    alternates: buildRouteAlternates(locale, "/exchange"),
  };
}

export default function ExchangeLayout({ children }: Props) {
  return children;
}
