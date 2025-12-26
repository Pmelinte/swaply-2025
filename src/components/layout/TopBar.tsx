"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Languages, Menu } from "lucide-react";
import { useAppState } from "@/lib/state";
import { Badge } from "../ui";

const menuLinks = [
  { href: "/profile", label: "Profil & Setări" },
  { href: "/info", label: "Info & Ajutor" },
  { href: "/change", label: "Schimburi" },
];

export function TopBar() {
  const pathname = usePathname();
  const { user, logout } = useAppState();
  const [language, setLanguage] = useState("ro");
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            onClick={() => setLanguage(language === "ro" ? "en" : "ro")}
          >
            <Languages className="h-4 w-4" />
            <span className="font-semibold uppercase">{language}</span>
          </button>
          <span className="text-xs text-zinc-400">{pathname}</span>
        </div>
        <div className="flex items-center gap-2">
          {user ? <Badge tier={user.badge} /> : null}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-sm font-medium shadow-sm hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <Menu className="h-4 w-4" />
              <span>Menú</span>
            </button>
            {menuOpen ? (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                <div className="px-2 pb-2 text-xs text-zinc-500 dark:text-zinc-400">
                  Navighează rapid
                </div>
                {menuLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-700"
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                {user ? (
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                    }}
                    className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50 dark:text-red-200 dark:hover:bg-red-900/40"
                  >
                    Delogare
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="mt-1 block rounded-lg px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 dark:text-blue-200 dark:hover:bg-blue-900/40"
                  >
                    Autentificare
                  </Link>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
