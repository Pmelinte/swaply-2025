import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ProfileLink } from '@/components/ProfileLink';

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
        {/* Navigation bar */}
        <header className="w-full border-b border-slate-800 bg-slate-900/70 backdrop-blur-md">
          <nav className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="text-xl font-bold text-slate-100">Swaply</h1>

            {/* Right navigation items */}
            <div className="flex items-center gap-3">
              <ProfileLink />
            </div>
          </nav>
        </header>

        {/* Page content */}
        <main className="pt-6">
          {children}
        </main>
      </body>
    </html>
  );
}
