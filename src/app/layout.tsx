import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { TopBar } from "@/components/layout/TopBar";
import { ContextBar } from "@/components/layout/ContextBar";
import { FooterNav } from "@/components/layout/FooterNav";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { GlobalNudge } from "@/components/layout/GlobalNudge";

export const metadata: Metadata = {
  title: "Swaply",
  description: "Schimba obiecte cu alti utilizatori din zona ta",
  manifest: "/manifest.json",
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
          <FooterNav />
          <InstallPrompt />
        </Providers>
      </body>
    </html>
  );
}
