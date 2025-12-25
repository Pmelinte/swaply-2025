import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/header';
import { BottomNav } from '@/components/bottom-nav';
import { getServerSession } from '@/lib/auth';
import { getCurrentProfile } from '@/lib/auth';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Swaply',
  description: 'Platformă de schimb de obiecte conform SWAPLY_MASTER_SPEC'
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  const profile = session ? await getCurrentProfile() : null;

  return (
    <html lang={profile?.language ?? 'ro'}>
      <body className={`${inter.className} min-h-screen bg-muted pb-24`}>
        <div className="mx-auto max-w-5xl px-4">
          <Header badgeLevel={profile?.badge_level} userEmail={session?.user.email ?? undefined} />
          <main className="mt-4 space-y-6 pb-16 md:pb-6">{children}</main>
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
