import type { Metadata } from "next";
import { buildRouteAlternates } from "@/lib/seo/route-alternates";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: buildRouteAlternates(locale, "/properties") };
}

export default function PropertiesLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-emerald-100/60">
      {children}
    </div>
  );
}
