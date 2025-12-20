import type { Metadata } from "next";
import "./globals.css";

import Navbar from "@/components/Navbar";
import { LanguageProvider } from "@/components/LanguageProvider";
import LanguageBootstrap from "@/components/LanguageBootstrap";

export const metadata: Metadata = {
  title: "Swaply",
  description: "Swaply 2025",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro">
      <body className="bg-background text-foreground font-sans">
        <LanguageProvider>
          <LanguageBootstrap />
          <Navbar />
          <main className="min-h-screen bg-background text-foreground">
            {children}
          </main>
        </LanguageProvider>
      </body>
    </html>
  );
}
