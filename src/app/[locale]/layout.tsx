import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { locales, type Locale } from "@/i18n/config";
import { getLocaleDirection } from "@/i18n/direction";
import { Providers } from "./providers";
import { TopBar } from "@/components/layout/TopBar";
import { BranchBar } from "@/components/layout/BranchBar";
import { ContextBar } from "@/components/layout/ContextBar";
import { FooterNav } from "@/components/layout/FooterNav";
import { UnifiedSideDrawer } from "@/components/drawer/UnifiedSideDrawer";
import { ClientOverlays } from "@/components/ClientOverlays";
import { TokenToast } from "@/components/tokens/TokenToast";
import Script from "next/script";
import { CookieConsent } from "@/components/CookieConsent";
import { ConditionalAnalytics } from "@/components/ConditionalAnalytics";
import { SWAPLY_PUBLIC_SUPPORT_EMAIL } from "@/lib/legal-copy";
import {
  SWAPLY_PUBLIC_BASE_URL,
  buildPublicHreflangLanguages,
  toSwaplyLocalizedPublicUrl,
} from "@/lib/public-site";

const PRIORITY_LOCALES = ["ro", "en"] as const;

export function generateStaticParams() {
  return PRIORITY_LOCALES.map((locale) => ({ locale }));
}

export const dynamicParams = true;

function buildHreflangAlternates(locale: string, path: string) {
  return {
    canonical: toSwaplyLocalizedPublicUrl(locale, path),
    languages: buildPublicHreflangLanguages(locales, path),
  };
}

export const metadata: Metadata = {
  title: {
    default: "Swaply — Swap objects without money",
    template: "%s | Swaply",
  },
  description:
    "Swaply connects people who want to swap objects, without money. Simple, local, transparent. AI matching, secure chat, complete swap flow.",
  manifest: "/manifest.json",
  metadataBase: new URL(SWAPLY_PUBLIC_BASE_URL),
  openGraph: {
    type: "website",
    siteName: "Swaply",
    title: "Swaply — Swap objects without money",
    description:
      "Swap what you have for what you want. AI matching, secure chat, complete swap flow.",
    images: [
      { url: "/og-image.svg", width: 1200, height: 630, alt: "Swaply" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Swaply — Swap objects without money",
    description: "Swap what you have for what you want. AI matching, secure chat.",
    images: ["/og-image.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: buildHreflangAlternates("en", ""),
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Swaply",
    startupImage: [{ url: "/icons/apple-touch-icon.png" }],
  },
  icons: [
    {
      rel: "icon",
      url: "/icons/favicon-32x32.png",
      sizes: "32x32",
      type: "image/png",
    },
    {
      rel: "apple-touch-icon",
      url: "/icons/apple-touch-icon.png",
      sizes: "180x180",
    },
  ],
};

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  const canonicalLocale = locale as Locale;
  setRequestLocale(canonicalLocale);
  const messages = await getMessages();

  return (
    <html
      lang={canonicalLocale}
      dir={getLocaleDirection(canonicalLocale)}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://maps.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link
          rel="dns-prefetch"
          href="https://keaejxlwqtjjglijiplh.supabase.co"
        />
        <Script
          id="organization-schema"
          type="application/ld+json"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Swaply",
              url: SWAPLY_PUBLIC_BASE_URL,
              logo: `${SWAPLY_PUBLIC_BASE_URL}/logo-swaply.svg`,
              description:
                "Global barter platform available in 43 languages. Swap objects, services and homes without money — locally or internationally.",
              areaServed: "Worldwide",
              contactPoint: {
                "@type": "ContactPoint",
                email: SWAPLY_PUBLIC_SUPPORT_EMAIL,
              },
            }),
          }}
        />
        <script
          type="speculationrules"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              prerender: [
                {
                  urls: [
                    `/${canonicalLocale}/objects`,
                    `/${canonicalLocale}/login`,
                    `/${canonicalLocale}/register`,
                  ],
                  eagerness: "moderate",
                },
              ],
            }),
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="bg-gradient-to-br from-zinc-50 to-blue-50 text-zinc-900 antialiased font-sans dark:from-zinc-950 dark:to-slate-900 dark:text-zinc-50"
      >
        <NextIntlClientProvider locale={canonicalLocale} messages={messages}>
          <Providers locale={canonicalLocale}>
            <TopBar />
            <BranchBar />
            <ContextBar />
            <main className="mx-auto min-h-screen max-w-6xl px-4 pb-24 pt-4 md:pb-8">
              {children}
            </main>
            <FooterNav />
            <UnifiedSideDrawer />
            <ClientOverlays />
            <TokenToast />
            <ConditionalAnalytics />
            <CookieConsent />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
