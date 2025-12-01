'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function ProfileLink() {
  const pathname = usePathname();
  const isActive = pathname === '/profile';

  return (
    <Link
      href="/profile"
      className={[
        'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors border',
        isActive
          ? 'bg-blue-600 text-white border-blue-500'
          : 'bg-slate-900/60 text-slate-200 border-slate-700 hover:bg-slate-800 hover:border-slate-600'
      ].join(' ')}
    >
      <span className="inline-block h-6 w-6 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-xs">
        👤
      </span>
      <span>Profile</span>
    </Link>
  );
}
