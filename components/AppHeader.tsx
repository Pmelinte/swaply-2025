'use client';

import LanguageSelector from '@/components/LanguageSelector';
import HeaderMenu from '@/components/HeaderMenu';
import { useTranslation } from '@/components/LanguageProvider';

export default function AppHeader() {
  const { t } = useTranslation();

  return (
    <header className="w-full border-b border-slate-800 bg-slate-900/70 backdrop-blur-md">
      <nav className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-100">
          {t('welcome')}
        </h1>
        <div className="flex items-center gap-4">
          <LanguageSelector />
          <HeaderMenu />
        </div>
      </nav>
    </header>
  );
}
