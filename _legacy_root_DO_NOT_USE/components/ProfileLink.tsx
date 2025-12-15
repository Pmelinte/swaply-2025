'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/components/LanguageProvider';

export function ProfileLink() {
  const pathname = usePathname();
  const isActive = pathname === '/profile';
  const { t } = useTranslation();

  return (
    <Link
      href="/profile"
      className={[
        'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors border shadow-sm',
        isActive
          ? 'bg-blue-600 text-white border-blue-500'
          : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
      ].join(' ')}
    >
      <span className="inline-block h-6 w-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs text-slate-700">
        👤
      </span>
      <span>{t('profile')}</span>
    </Link>
  );
}
