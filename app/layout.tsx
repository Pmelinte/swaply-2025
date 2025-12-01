import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import HeaderMenu from '@/components/HeaderMenu';
import LanguageSelector from '@/components/LanguageSelector';

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
      <body className={inter.className}>
        {/* Bara de sus */}
        <header className="w-full border-b border-slate-800 bg-slate-900/70 backdrop-blur-md">
          <nav className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            
            {/* Logo */}
            <h1 className="text-xl font-bold text-slate-100">Swaply</h1>

            {/* Dreapta: limbă + meniu profil */}
            <div className="flex items-center gap-4">
              <LanguageSelector />
              <HeaderMenu />
            </div>

          </nav>
        </header>

        {/* Conținut */}
        <main className="pt-6">
          {children}
        </main>
      </body>
    </html>
  );
}
