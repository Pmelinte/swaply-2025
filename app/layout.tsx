import type { Metadata } from "next";
import "./globals.css";

import { LanguageProvider } from "@/components/LanguageProvider";

export const metadata: Metadata = {
  title: "Swaply",
  description: "Swaply 2025"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground font-sans">
        <LanguageProvider>
          <main className="min-h-screen bg-background text-foreground">
            {children}
          </main>
        </LanguageProvider>
      </body>
    </html>
  );
}
