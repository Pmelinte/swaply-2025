import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import LanguageProvider from '@/components/LanguageProvider';
import AppHeader from '@/components/AppHeader';

const inter = Inter({ subsets: ['latin'] });

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
      <body className={`${inter.className} bg-background text-foreground`}>
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
