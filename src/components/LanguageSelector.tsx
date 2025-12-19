'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/components/LanguageProvider';

const LANGS = [
  { code: 'en', labelKey: 'en', flag: '/flags/en.svg' },
  { code: 'ro', labelKey: 'ro', flag: '/flags/ro.svg' },
  { code: 'fr', labelKey: 'fr', flag: '/flags/fr.svg' },
  { code: 'de', labelKey: 'de', flag: '/flags/de.svg' },
  { code: 'es', labelKey: 'es', flag: '/flags/es.svg' },
];

export default function LanguageSelector() {
  const { lang, setLang, t } = useLanguage();
  const [open, setOpen] = useState(false);

  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  const handleSelect = (code: string) => {
    setLang(code as any);
    setOpen(false);
  };

  return (
    <div className="relative z-20">
      {/* buton principal */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors"
        aria-expanded={open}
        aria-label={t('preferred_language')}
      >
        <div className="relative h-5 w-5 overflow-hidden rounded-full border border-slate-200">
          <Image
            src={current.flag}
            alt={current.labelKey}
            fill
            sizes="20px"
            className="object-cover"
          />
        </div>
        <span className="hidden sm:inline">
          {t(current.labelKey)}
        </span>
      </button>

      {/* dropdown */}
      {open && (
        <div className="absolute left-0 mt-2 w-40 rounded-xl bg-white border border-slate-200 shadow-xl ring-1 ring-slate-100 z-30 py-1">
          {LANGS.map((l) => {
            const active = l.code === lang;
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => handleSelect(l.code)}
                className={
                  `w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors ` +
                  (active
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-700 hover:bg-slate-50')
                }
              >
                <div className="relative h-4 w-4 overflow-hidden rounded-full border border-slate-200">
                  <Image
                    src={l.flag}
                    alt={l.labelKey}
                    fill
                    sizes="16px"
                    className="object-cover"
                  />
                </div>
                <span>{t(l.labelKey)}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
