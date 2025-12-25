'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface HeaderProps {
  userEmail?: string;
  badgeLevel?: 'free' | 'premium' | 'platinum';
}

const badgeStyles: Record<string, string> = {
  free: 'bg-gray-100 text-gray-700',
  premium: 'bg-amber-100 text-amber-700',
  platinum: 'bg-slate-900 text-white'
};

export function Header({ userEmail, badgeLevel = 'free' }: HeaderProps) {
  const pathname = usePathname();
  const [language, setLanguage] = useState('RO');
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
      <div className="flex items-center gap-3">
        <select
          aria-label="Select language"
          className="rounded-lg border px-3 py-1 text-sm"
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
        >
          <option value="RO">RO</option>
          <option value="EN">EN</option>
        </select>
        {userEmail ? (
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeStyles[badgeLevel]}`}>
              {badgeLevel.toUpperCase()}
            </span>
            <span className="text-sm text-gray-700">{userEmail}</span>
          </div>
        ) : (
          <Link className="text-sm font-semibold text-primary" href={`/login?returnTo=${pathname}`}>
            Autentificare
          </Link>
        )}
      </div>
      <div className="relative">
        <button
          aria-label="Open contextual menu"
          className="flex h-10 w-10 items-center justify-center rounded-full border"
          onClick={() => setOpen((prev) => !prev)}
          type="button"
        >
          ⋮
        </button>
        {open ? (
          <div className="absolute right-0 mt-2 w-56 rounded-lg border bg-white shadow-md">
            <ul className="divide-y text-sm">
              <li>
                <Link className="block px-4 py-2 hover:bg-muted" href="/info">
                  Info & Legal
                </Link>
              </li>
              <li>
                <Link className="block px-4 py-2 hover:bg-muted" href="/profile">
                  Profil & Setări
                </Link>
              </li>
              <li>
                <Link className="block px-4 py-2 hover:bg-muted" href="/objects">
                  Obiectele mele
                </Link>
              </li>
            </ul>
          </div>
        ) : null}
      </div>
    </header>
  );
}
