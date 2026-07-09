import type { Metadata } from "next";
import { buildPublicPageMetadata } from "@/lib/public-pages/publicPageMetadata";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPublicPageMetadata(locale, "safety");
}

export default function SafetyLayout({ children }: Props) {
  return children;
}
