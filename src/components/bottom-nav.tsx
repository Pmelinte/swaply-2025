'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Home' },
  { href: '/objects', label: 'Objects' },
  { href: '/match', label: 'Match' },
  { href: '/chat', label: 'Chat' },
  { href: '/change', label: 'Change' },
  { href: '/info', label: 'Info' }
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white shadow md:hidden">
      <ul className="flex justify-between px-4 py-3 text-sm font-medium">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <li key={link.href}>
              <Link
                className={`flex flex-col items-center gap-1 ${
                  active ? 'text-primary font-semibold' : 'text-gray-500'
                }`}
                href={link.href}
              >
                <span className="rounded-full px-3 py-1 text-xs md:text-sm hover:bg-muted">{link.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
