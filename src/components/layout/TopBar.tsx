"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { BellDot, Languages, Menu, ShieldCheck } from "lucide-react";
import type { LanguageCode } from "@/lib/types";
import { useAppState } from "@/lib/state";
import { Badge } from "../ui";

const menuLinks = [
  { href: "/", label: "Home" },
  { href: "/objects", label: "Obiecte" },
  { href: "/match", label: "Match" },
  { href: "/chat", label: "Chat" },
  { href: "/change", label: "Swaply" },
  { href: "/info", label: "Info" },
  { href: "/profile", label: "Profil & Setări" },
];

const contextualActions: Record<
  string,
  Array<{ label: string; href: string; disabled?: boolean }>
> = {
  "/": [
    { label: "Vezi obiecte disponibile", href: "/objects" },
    { label: "Caută pe hartă", href: "/info#map" },
    { label: "Vezi match-urile tale", href: "/match" },
  ],
  "/objects": [
    { label: "Adaugă un obiect", href: "/objects/new" },
    { label: "Vezi match-urile", href: "/match" },
  ],
  "/match": [
    { label: "Inițiază chat", href: "/chat" },
    { label: "Propune swap", href: "/change" },
  ],
  "/chat": [
    { label: "Deschide swap", href: "/change" },
    { label: "Vezi reguli chat", href: "/info#legal" },
  ],
  "/change": [
    { label: "Confirmă swap", href: "/change" },
    { label: "Vezi obiect", href: "/objects" },
  ],
  "/info": [
    { label: "Termeni & GDPR", href: "/info#legal" },
    { label: "Beneficii badge", href: "/info#monetizare" },
  ],
  "/profile": [
    { label: "Completează profilul", href: "/profile" },
    { label: "Badge & beneficii", href: "/info#monetizare" },
  ],
};

export function TopBar() {
  const pathname = usePathname();
  const { user, logout, language, setLanguage, announcements } = useAppState();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathKey =
    Object.keys(contextualActions).find(
      (key) => pathname === key || pathname.startsWith(`${key}/`),
    ) ?? pathname;
  const actions = contextualActions[pathKey] ?? [];
  const unread = announcements.length;

  const languages: LanguageCode[] = ["ro", "en", "es"];
  const handleLanguageToggle = () => {
    const currentIndex = languages.indexOf(language);
    const next = languages[(currentIndex + 1) % languages.length];
    setLanguage(next);
  };

  return (
    <div className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            onClick={handleLanguageToggle}
          >
            <Languages className="h-4 w-4" />
            <span className="font-semibold uppercase">{language}</span>
          </button>
          <span className="text-xs text-zinc-400">{pathname}</span>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <button
              type="button"
              className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-sm font-semibold shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <Badge tier={user.badge} />
            </button>
          ) : null}
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
                <div className="mt-2 space-y-1 rounded-lg border-t border-zinc-200 pt-2 dark:border-zinc-700">
                  <div className="flex items-center justify-between px-2 text-[11px] uppercase text-zinc-500 dark:text-zinc-400">
                    <span>Meniu contextual</span>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-100">
                      {pathKey}
                    </span>
                  </div>
                  {actions.map((action) => (
                    <Link
                      key={action.label}
                      href={action.href}
                      className={`block rounded-lg px-3 py-2 text-sm ${action.disabled ? "text-zinc-400 line-through" : "text-zinc-800 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-700"}`}
                      onClick={() => setMenuOpen(false)}
                      aria-disabled={action.disabled}
                    >
                      {action.label}
                    </Link>
                  ))}
                </div>
                <div className="mt-2 space-y-1 rounded-lg border-t border-zinc-200 pt-2 dark:border-zinc-700">
                  <div className="flex items-center justify-between px-2 text-[11px] uppercase text-zinc-500 dark:text-zinc-400">
                    <span>Notificări & cont</span>
                    <Badge tier={user?.badge ?? "free"} />
                  </div>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-700"
                    aria-disabled
                  >
                    <span className="flex items-center gap-2">
                      <BellDot className="h-4 w-4" />
                      Notificări (like/interes/chat/swaply)
                    </span>
                    <span className="rounded-full bg-blue-100 px-2 text-[11px] font-semibold text-blue-800 dark:bg-blue-900/50 dark:text-blue-100">
                      {unread}
                    </span>
                  </button>
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-700"
                    onClick={() => setMenuOpen(false)}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Setări & Profil
                  </Link>
                  <Link
                    href="/info#legal"
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-700"
                    onClick={() => setMenuOpen(false)}
                  >
                    Termeni & GDPR
                  </Link>
                  {user ? (
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setMenuOpen(false);
                      }}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50 dark:text-red-200 dark:hover:bg-red-900/40"
                    >
                      Delogare
                    </button>
                  ) : (
                    <Link
                      href="/login"
                      className="block rounded-lg px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 dark:text-blue-200 dark:hover:bg-blue-900/40"
                    >
                      Autentificare
                    </Link>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
