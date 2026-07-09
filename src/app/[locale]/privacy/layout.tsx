import type { Metadata } from "next";
import { buildPublicPageMetadata } from "@/lib/public-pages/publicPageMetadata";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPublicPageMetadata(locale, "privacy");
}

export default function PrivacyLayout({ children }: Props) {
  return children;
}
