import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { TopBar } from "@/components/layout/TopBar";
import { FooterNav } from "@/components/layout/FooterNav";

export const metadata: Metadata = {
  title: "Swaply",
  description: "Swaply 2025 — implementare conform specificațiilor canonice",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-zinc-50 to-blue-50 text-zinc-900 antialiased font-sans dark:from-zinc-950 dark:to-slate-900 dark:text-zinc-50">
        <Providers>
          <TopBar />
          <div className="mx-auto min-h-screen max-w-6xl px-4 pb-24 pt-6">
            {children}
          </div>
          <FooterNav />
        </Providers>
      </body>
    </html>
  );
}
