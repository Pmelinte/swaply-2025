'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/components/LanguageProvider';

const LANGS = [
  { code: 'en', labelKey: 'en', flag: '/flags/en.png' },
  { code: 'ro', labelKey: 'ro', flag: '/flags/ro.png' },
  { code: 'fr', labelKey: 'fr', flag: '/flags/fr.png' },
  { code: 'de', labelKey: 'de', flag: '/flags/de.png' },
  { code: 'es', labelKey: 'es', flag: '/flags/es.png' }
];

export default function LanguageSelector() {
  const { lang, setLang, t } = useLanguage();
  const [open, setOpen] = useState(false);

  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  const handleSelect = (code: string) => {
    setLang(code as any); // anunțăm LanguageProvider că s-a schimbat limba
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-slate-800"
      >
        {current && (
          <Image
            src={current.flag}
            alt={current.labelKey}
            width={20}
            height={20}
            className="rounded"
          />
        )}
        <span className="hidden sm:inline">
          {t(current.labelKey)}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 rounded-lg bg-slate-900 border border-slate-700 shadow-xl z-50">
          {LANGS.map((langOpt) => (
            <button
              key={langOpt.code}
              onClick={() => handleSelect(langOpt.code)}
              className="flex items-center gap-2 w-full px-3 py-2 text-slate-200 text-sm hover:bg-slate-800"
            >
              <Image
                src={langOpt.flag}
                alt={langOpt.labelKey}
                width={20}
                height={20}
                className="rounded"
              />
              {t(langOpt.labelKey)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
