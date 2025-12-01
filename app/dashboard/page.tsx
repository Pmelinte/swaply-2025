'use client';

import Link from 'next/link';
import { useTranslation } from '@/components/LanguageProvider';

export default function DashboardPage() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl space-y-6">
        
        <div className="flex flex-col gap-2 mb-6">
          <h1 className="text-3xl font-bold text-slate-100">
            {t('dashboard')}
          </h1>
          <p className="text-slate-400 text-sm">
            {t('welcome')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <Link
            href="/items"
            className="block bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg p-6 text-center transition"
          >
            <div className="text-2xl mb-2">📦</div>
            <div className="text-slate-200 font-medium">
              {t('my_items')}
            </div>
          </Link>

          <Link
            href="/logout"
            className="block bg-red-900/40 hover:bg-red-900/60 border border-red-700 rounded-lg p-6 text-center transition"
          >
            <div className="text-2xl mb-2">🚪</div>
            <div className="text-red-300 font-medium">
              {t('logout')}
            </div>
          </Link>

        </div>
      </div>
    </main>
  );
}
