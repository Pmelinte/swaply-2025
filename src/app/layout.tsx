import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { TopBar } from "@/components/layout/TopBar";
import { ContextBar } from "@/components/layout/ContextBar";
import { FooterNav } from "@/components/layout/FooterNav";
import { LegalFooter } from "@/components/layout/LegalFooter";
import { GlobalNudge } from "@/components/layout/GlobalNudge";
import { ClientOverlays } from "@/components/ClientOverlays";
import { TokenToast } from "@/components/tokens/TokenToast";
import { Analytics } from "@vercel/analytics/react";
import { GoogleAnalytics } from "@next/third-parties/google";
import Script from "next/script";

export const metadata: Metadata = {
  title: {
    default: "Swaply — Schimb de obiecte fără bani",
    template: "%s | Swaply",
  },
  description: "Swaply conectează oameni care vor să facă schimb de obiecte, fără bani. Simplu, local, transparent. AI matching, chat securizat, flux complet de schimb.",
  manifest: "/manifest.json",
  metadataBase: new URL("https://swaply.world"),
  openGraph: {
    type: "website",
    locale: "ro_RO",
    siteName: "Swaply",
    title: "Swaply — Schimb de obiecte fără bani",
    description: "Schimbă ce ai cu ce vrei. AI matching, chat securizat, flux complet de schimb.",
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "Swaply" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Swaply — Schimb de obiecte fără bani",
    description: "Schimbă ce ai cu ce vrei. AI matching, chat securizat.",
    images: ["/og-image.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: "https://swaply.world",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Swaply",
    startupImage: [
      { url: "/icons/apple-touch-icon.png" },
    ],
  },
  icons: [
    { rel: "icon", url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    { rel: "apple-touch-icon", url: "/icons/apple-touch-icon.png", sizes: "180x180" },
  ],
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://maps.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://keaejxlwqtjjglijiplh.supabase.co" />
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
              description: "Platformă de schimb de obiecte fără bani în România",
              contactPoint: {
                "@type": "ContactPoint",
                email: "support@swaply.app",
              },
            }),
          }}
        />
      </head>
      {process.env.NEXT_PUBLIC_GA_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      )}
      <body
        suppressHydrationWarning
        className="bg-gradient-to-br from-zinc-50 to-blue-50 text-zinc-900 antialiased font-sans dark:from-zinc-950 dark:to-slate-900 dark:text-zinc-50"
      >
        <Providers>
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
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
