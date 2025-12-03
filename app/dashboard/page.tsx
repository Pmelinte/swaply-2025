'use client';

import Link from 'next/link';
import { useTranslation } from '@/components/LanguageProvider';

export default function DashboardPage() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-background text-foreground px-4 py-10">
      <div className="w-full max-w-4xl mx-auto bg-card text-card-foreground border border-slate-200 rounded-2xl p-8 shadow-lg space-y-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-slate-900">{t('dashboard')}</h1>
          <p className="text-slate-600 text-sm">{t('welcome')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/items"
            className="block bg-white hover:bg-slate-50 border border-slate-200 rounded-xl p-6 text-center transition shadow-sm"
          >
            <div className="text-2xl mb-2">📦</div>
            <div className="text-slate-900 font-medium">{t('my_items')}</div>
          </Link>

          <Link
            href="/logout"
            className="block bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl p-6 text-center transition shadow-sm"
          >
            <div className="text-2xl mb-2">🚪</div>
            <div className="text-red-700 font-medium">{t('logout')}</div>
          </Link>
        </div>
      </div>
    </main>
  );
}
