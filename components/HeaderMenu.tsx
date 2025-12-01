'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export default function HeaderMenu() {
  const [open, setOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadAvatar = async () => {
      try {
        const supabase = getSupabaseBrowserClient();

        // 1. verificăm userul curent
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 2. încărcăm profilul din API
        const res = await fetch('/api/profile');
        const data = await res.json();

        if (data?.profile?.avatar_url) {
          setAvatarUrl(data.profile.avatar_url);
        }
      } catch (err) {
        // ignorăm erorile pentru meniu
      }
    };

    loadAvatar();
  }, []);

  return (
    <div className="relative">
      {/* Avatar din dreapta sus */}
      <button
        onClick={() => setOpen(!open)}
        className="h-10 w-10 rounded-full bg-slate-800 border border-slate-600 overflow-hidden flex items-center justify-center"
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
          <span className="text-slate-400 text-lg">👤</span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg bg-slate-900 border border-slate-700 shadow-xl z-50">
          <Link
            href="/profile"
            className="block px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
          >
            Profile
          </Link>
          <Link
            href="/dashboard"
            className="block px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
          >
            Dashboard
          </Link>
          <Link
            href="/items"
            className="block px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
          >
            My Items
          </Link>
          <Link
            href="/logout"
            className="block px-4 py-2 text-sm text-red-400 hover:bg-slate-800"
          >
            Logout
          </Link>
        </div>
      )}
    </div>
  );
}
