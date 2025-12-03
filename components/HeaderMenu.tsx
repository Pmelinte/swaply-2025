'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useTranslation } from '@/components/LanguageProvider';

export default function HeaderMenu() {
  const [open, setOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { t } = useTranslation();

  const closeMenu = () => setOpen(false);

  useEffect(() => {
    const loadAvatar = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const res = await fetch('/api/profile');
        const data = await res.json();

        if (data?.profile?.avatar_url) {
          setAvatarUrl(data.profile.avatar_url);
        }
      } catch (err) {
        // ignorăm erorile
      }
    };

    loadAvatar();
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="h-10 w-10 rounded-full bg-white border border-slate-300 shadow-sm overflow-hidden flex items-center justify-center text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt="Avatar"
            width={40}
            height={40}
            className="object-cover"
          />
        ) : (
          <span className="text-lg">👤</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 rounded-lg bg-white border border-slate-200 shadow-lg ring-1 ring-slate-100 z-50 overflow-hidden">
          <Link
            href="/profile"
            className="block px-4 py-2 text-sm text-slate-800 hover:bg-slate-50"
            onClick={closeMenu}
          >
            {t('profile')}
          </Link>
          <Link
            href="/dashboard"
            className="block px-4 py-2 text-sm text-slate-800 hover:bg-slate-50"
            onClick={closeMenu}
          >
            {t('dashboard')}
          </Link>
          <Link
            href="/items"
            className="block px-4 py-2 text-sm text-slate-800 hover:bg-slate-50"
            onClick={closeMenu}
          >
            {t('my_items')}
          </Link>
          <Link
            href="/logout"
            className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            onClick={closeMenu}
          >
            {t('logout')}
          </Link>
        </div>
      )}
    </div>
  );
}
