import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Swaply 2025',
  description: 'Swaply – global swap platform (2025 clean build)'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-50">
        {children}
      </body>
    </html>
  );
}
