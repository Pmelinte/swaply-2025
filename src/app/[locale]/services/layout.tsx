import type { Metadata } from "next";
import { buildRouteAlternates } from "@/lib/seo/route-alternates";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  return {
    alternates: buildRouteAlternates(locale, "/services"),
  };
}

export default function ServicesLayout({ children }: Props) {
  return children;
}
