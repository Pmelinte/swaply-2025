'use client';

import LanguageSelector from '@/components/LanguageSelector';
import HeaderMenu from '@/components/HeaderMenu';
import { useTranslation } from '@/components/LanguageProvider';

export default function AppHeader() {
  const { t } = useTranslation();

  return (
    <header className="w-full border-b border-slate-200 bg-white/90 backdrop-blur shadow-sm">
      <nav className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">
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
