import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import HeaderMenu from '@/components/HeaderMenu';

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
            {/* Stânga: logo / titlu */}
            <h1 className="text-xl font-bold text-slate-100">
              Swaply
            </h1>

            {/* Dreapta: simbol limbă + meniu profil */}
            <div className="flex items-center gap-4">
              {/* Buton limbă - deocamdată doar simbol, logica o facem după */}
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-slate-800"
              >
                <span className="text-lg">🌐</span>
                <span className="hidden sm:inline">Language</span>
              </button>

              {/* Meniul de profil din dreapta */}
              <HeaderMenu />
            </div>
          </nav>
        </header>

        {/* Conținut pagină */}
        <main className="pt-6">
          {children}
        </main>
      </body>
    </html>
  );
}

