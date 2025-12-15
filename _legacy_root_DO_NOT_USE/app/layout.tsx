import './globals.css';
import type { Metadata } from 'next';
import LanguageProvider from '@/components/LanguageProvider';
import AppHeader from '@/components/AppHeader';

export const metadata: Metadata = {
  title: 'Swaply',
  description: 'Global swapping with AI assistance',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground font-sans">
        <LanguageProvider>
          <AppHeader />
          <main className="pt-6 min-h-screen bg-background text-foreground">
            {children}
          </main>
        </LanguageProvider>
      </body>
    </html>
  );
}
