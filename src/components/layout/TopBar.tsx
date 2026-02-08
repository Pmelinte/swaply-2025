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
  { href: "/match", label: "Matching" },
  { href: "/chat", label: "Mesaje" },
  { href: "/change", label: "Schimb" },
  { href: "/info", label: "Informatii" },
  { href: "/profile", label: "Profil & Setari" },
];

const contextualActions: Record<
  string,
  Array<{ label: string; href: string; disabled?: boolean }>
> = {
  "/": [
    { label: "Vezi obiecte disponibile", href: "/objects" },
    { label: "Cauta pe harta", href: "/info#map" },
    { label: "Analizeaza potriviri", href: "/match" },
  ],
  "/objects": [
    { label: "Adauga un obiect", href: "/objects/new" },
    { label: "Analizeaza potriviri", href: "/match" },
  ],
  "/match": [
    { label: "Trimite mesaj", href: "/chat" },
    { label: "Propune schimb", href: "/change" },
  ],
  "/chat": [
    { label: "Propune schimb", href: "/change" },
    { label: "Reguli conversatii", href: "/info#legal" },
  ],
  "/change": [
    { label: "Confirma schimbul", href: "/change" },
    { label: "Vezi obiect", href: "/objects" },
  ],
  "/info": [
    { label: "Termeni & GDPR", href: "/info#legal" },
    { label: "Beneficii badge", href: "/info#monetizare" },
  ],
  "/profile": [
    { label: "Completeaza profilul", href: "/profile" },
    { label: "Badge & beneficii", href: "/info#monetizare" },
  ],
};

export function TopBar() {
  const pathname = usePathname();
  const { user, logout, language, setLanguage, notifications, markNotificationRead } =
    useAppState();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const pathKey =
    Object.keys(contextualActions).find(
      (key) => pathname === key || pathname.startsWith(`${key}/`),
    ) ?? pathname;
  const actions = contextualActions[pathKey] ?? [];
  const unread = notifications.filter((n) => !n.read).length;

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
                  <div className="relative">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-700"
                      onClick={() => setNotifOpen((prev) => !prev)}
                    >
                      <span className="flex items-center gap-2">
                        <BellDot className="h-4 w-4" />
                        Notificări (like/interes/chat/swaply)
                      </span>
                      <span className="rounded-full bg-blue-100 px-2 text-[11px] font-semibold text-blue-800 dark:bg-blue-900/50 dark:text-blue-100">
                        {unread}
                      </span>
                    </button>
                    {notifOpen ? (
                      <div className="mt-1 space-y-1 rounded-lg border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-700 dark:bg-zinc-900">
                        {notifications.length ? (
                          notifications.slice(0, 8).map((n) => (
                            <button
                              key={n.id}
                              type="button"
                              onClick={() => void markNotificationRead(n.id)}
                              className={`w-full rounded-md px-3 py-2 text-left text-xs transition ${
                                n.read ? "opacity-60" : "opacity-100"
                              } ${
                                n.priority === "warning"
                                  ? "bg-amber-50 text-amber-900 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-100 dark:hover:bg-amber-900/40"
                                  : n.priority === "success"
                                    ? "bg-green-50 text-green-900 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-100 dark:hover:bg-green-900/40"
                                    : "bg-blue-50 text-blue-900 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-100 dark:hover:bg-blue-900/40"
                              }`}
                            >
                              {n.message}
                            </button>
                          ))
                        ) : (
                          <div className="rounded-md bg-zinc-100 px-3 py-2 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                            Nicio notificare momentan.
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
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
