'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

const LANGS = [
  { code: 'en', label: 'English', flag: '/flags/en.png' },
  { code: 'ro', label: 'Română', flag: '/flags/ro.png' },
  { code: 'fr', label: 'Français', flag: '/flags/fr.png' },
  { code: 'de', label: 'Deutsch', flag: '/flags/de.png' },
  { code: 'es', label: 'Español', flag: '/flags/es.png' },
];

export default function LanguageSelector() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('en');

  useEffect(() => {
    const loadProfileLang = async () => {
      try {
        const res = await fetch('/api/profile');
        const data = await res.json();

        if (data?.profile?.preferred_language) {
          setCurrent(data.profile.preferred_language);
        }
      } catch {}
    };

    loadProfileLang();
  }, []);

  const changeLang = async (lang: string) => {
    setCurrent(lang);
    setOpen(false);

    // salvăm limba în profil
    await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferred_language: lang }),
    });
  };

  const selected = LANGS.find((l) => l.code === current);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-slate-800"
      >
        {selected && (
          <Image
            src={selected.flag}
            alt={selected.label}
            width={20}
            height={20}
            className="rounded"
          />
        )}
        <span className="hidden sm:inline">{selected?.label || 'Language'}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 rounded-lg bg-slate-900 border border-slate-700 shadow-xl z-50">
          {LANGS.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLang(lang.code)}
              className="flex items-center gap-2 w-full px-3 py-2 text-slate-200 text-sm hover:bg-slate-800"
            >
              <Image
                src={lang.flag}
                alt={lang.label}
                width={20}
                height={20}
                className="rounded"
              />
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
