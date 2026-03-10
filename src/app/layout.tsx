import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { TopBar } from "@/components/layout/TopBar";
import { ContextBar } from "@/components/layout/ContextBar";
import { FooterNav } from "@/components/layout/FooterNav";
import { LegalFooter } from "@/components/layout/LegalFooter";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { GlobalNudge } from "@/components/layout/GlobalNudge";
import { CookieConsent } from "@/components/legal/CookieConsent";
import { OnboardingTutorial } from "@/components/onboarding/OnboardingTutorial";
import { Analytics } from "@vercel/analytics/react";
import { GoogleAnalytics } from "@next/third-parties/google";

export const metadata: Metadata = {
  title: {
    default: "Swaply — Schimb de obiecte fără bani",
    template: "%s | Swaply",
  },
  description: "Swaply conectează oameni care vor să facă schimb de obiecte, fără bani. Simplu, local, transparent. AI matching, chat securizat, flux complet de schimb.",
  manifest: "/manifest.json",
  metadataBase: new URL("https://swaply.app"),
  openGraph: {
    type: "website",
    locale: "ro_RO",
    siteName: "Swaply",
    title: "Swaply — Schimb de obiecte fără bani",
    description: "Schimbă ce ai cu ce vrei. AI matching, chat securizat, flux complet de schimb.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Swaply" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Swaply — Schimb de obiecte fără bani",
    description: "Schimbă ce ai cu ce vrei. AI matching, chat securizat.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: "https://swaply.app",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Swaply",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
          <InstallPrompt />
          <CookieConsent />
          <OnboardingTutorial />
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
