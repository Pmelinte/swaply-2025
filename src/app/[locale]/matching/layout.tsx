import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildRouteAlternates } from "@/lib/seo/route-alternates";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: "Matching — Swaply",
    description: "Find your perfect swap partners",
    alternates: buildRouteAlternates(locale, "/matching"),
  };
}

export default function MatchingLayout({ children }: Props) {
  return <>{children}</>;
}
