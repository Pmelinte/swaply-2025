'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function HeaderMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      {/* Avatar-ul din dreapta sus */}
      <button
        onClick={() => setOpen(!open)}
        className="h-10 w-10 rounded-full bg-slate-800 border border-slate-600 overflow-hidden"
      >
        <Image
          src="/default-avatar.png"
          alt="Profile"
          width={40}
          height={40}
        />
      </button>

      {/* Meniul dropdown */}
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
