"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Box,
  HeartHandshake,
  MessageCircle,
  Shuffle,
  Info,
} from "lucide-react";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/objects", label: "Obiecte", icon: Box },
  { href: "/match", label: "Match", icon: HeartHandshake },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/change", label: "Swaply", icon: Shuffle },
  { href: "/info", label: "Info", icon: Info },
];

export function FooterNav() {
  const pathname = usePathname();
  return (
    <nav className="sticky bottom-0 z-20 border-t border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="mx-auto grid max-w-6xl grid-cols-6 gap-1 px-2 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
        {links.map((link) => {
          const Icon = link.icon;
          const active =
            pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 transition hover:bg-zinc-100 dark:hover:bg-zinc-800 ${active ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-100" : ""}`}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
