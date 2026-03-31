import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { locales, type Locale } from "@/i18n/config";
import { Providers } from "./providers";
import { TopBar } from "@/components/layout/TopBar";
import { ContextBar } from "@/components/layout/ContextBar";
import { FooterNav } from "@/components/layout/FooterNav";
import { LegalFooter } from "@/components/layout/LegalFooter";
import { GlobalNudge } from "@/components/layout/GlobalNudge";
import { ClientOverlays } from "@/components/ClientOverlays";
import { TokenToast } from "@/components/tokens/TokenToast";
import Script from "next/script";
import { CookieConsent } from "@/components/CookieConsent";
import { ConditionalAnalytics } from "@/components/ConditionalAnalytics";

// ── Generate static params for all 43 locales ───────────────────────
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// ── Build hreflang alternates for every locale ──────────────────────
function buildHreflangAlternates(locale: string, path: string) {
  const baseUrl = "https://www.swaply.world";
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = `${baseUrl}/${loc}${path}`;
  }
  languages["x-default"] = `${baseUrl}/en${path}`;
  return {
    canonical: `${baseUrl}/${locale}${path}`,
    languages,
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
  metadataBase: new URL("https://swaply.world"),
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

  // Validate locale
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  // Enable static rendering for this locale
  setRequestLocale(locale);

  // Load messages server-side
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
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
              url: "https://www.swaply.world",
              logo: "https://www.swaply.world/logo-swaply.svg",
              description:
                "Global barter platform available in 43 languages. Swap objects, services and homes without money — locally or internationally.",
              areaServed: "Worldwide",
              contactPoint: {
                "@type": "ContactPoint",
                email: "support@swaply.app",
              },
            }),
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="bg-gradient-to-br from-zinc-50 to-blue-50 text-zinc-900 antialiased font-sans dark:from-zinc-950 dark:to-slate-900 dark:text-zinc-50"
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers locale={locale}>
            <TopBar />
            <ContextBar />
            <GlobalNudge />
            <div className="mx-auto min-h-screen max-w-6xl px-4 pb-24 pt-4">
              {children}
            </div>
            <LegalFooter />
            <FooterNav />
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
