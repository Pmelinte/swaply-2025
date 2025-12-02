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
    <div className="relative">
      {/* buton principal */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-800 transition-colors"
      >
        <div className="relative h-5 w-5 overflow-hidden rounded-full border border-slate-600">
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
        <div className="absolute right-0 mt-2 w-40 rounded-xl bg-slate-900 border border-slate-700 shadow-xl z-50 py-1">
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
                    ? 'bg-slate-800 text-slate-100'
                    : 'text-slate-200 hover:bg-slate-800')
                }
              >
                <div className="relative h-4 w-4 overflow-hidden rounded-full border border-slate-600">
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
