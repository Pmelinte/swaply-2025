"use client";

import { useRouter, usePathname, Link } from "@/i18n/navigation";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { locales, languageNames, localeFlagUrl, type Locale } from "@/i18n/config";
import type { LanguageCode } from "@/lib/types";
import { TokensDisplay } from "@/components/tokens/TokensDisplay";
import { NotificationBell } from "@/components/notifications/NotificationBell";

export function TopBar() {
  const t = useTranslations();
  const router = useRouter();
  const { user, logout, language, setLanguage } =
    useAppState();
  const [loggingOut, setLoggingOut] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [langSearch, setLangSearch] = useState("");
  const langRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
      router.push("/login");
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
        setLangSearch("");
      }
    }
    if (langOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [langOpen]);

  const filteredLocales = locales.filter((loc) => {
    if (!langSearch) return true;
    const q = langSearch.toLowerCase();
    const info = languageNames[loc];
    return (
      loc.includes(q) ||
      info.name.toLowerCase().includes(q) ||
      info.nativeName.toLowerCase().includes(q)
    );
  });

  const pathname = usePathname();

  const handleSelectLanguage = (loc: Locale) => {
    setLanguage(loc as LanguageCode);
    setLangOpen(false);
    setLangSearch("");
    // Navigate to the same page in the new locale
    router.replace(pathname, { locale: loc });
  };

  return (
    <div className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
        {/* Left: Logo + Language */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2" title="Swaply">
            <Image src="/logo-swaply.svg" alt="Swaply" width={28} height={28} className="h-7 w-7" priority />
            <span className="hidden text-lg font-bold text-zinc-900 dark:text-zinc-50 sm:inline">Swaply</span>
          </Link>

          {/* Language selector */}
          <div ref={langRef} className="relative">
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              onClick={() => setLangOpen((prev) => !prev)}
              aria-label="Change language"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={localeFlagUrl(language as Locale)} alt="" width={20} height={15} className="rounded-sm" />
              <span className="font-semibold uppercase">{language}</span>
              <ChevronDown className="h-2.5 w-2.5" />
            </button>
            {langOpen && (
              <div className="absolute left-0 top-full z-30 mt-1 w-64 rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                <div className="p-2">
                  <input
                    type="text"
                    value={langSearch}
                    onChange={(e) => setLangSearch(e.target.value)}
                    placeholder={t("common.search") + "\u2026"}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-blue-400 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                    autoFocus
                  />
                </div>
                <div className="max-h-72 overflow-y-auto px-1 pb-2">
                  {filteredLocales.map((loc) => {
                    const info = languageNames[loc];
                    const isActive = loc === language;
                    return (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => handleSelectLanguage(loc)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                          isActive
                            ? "bg-blue-50 font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                            : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-700"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={localeFlagUrl(loc)} alt="" width={20} height={15} className="shrink-0 rounded-sm" />
                        <span className="flex-1">{info.nativeName}</span>
                        <span className="text-xs text-zinc-400">{info.name}</span>
                      </button>
                    );
                  })}
                  {filteredLocales.length === 0 && (
                    <div className="px-3 py-2 text-sm text-zinc-400">&mdash;</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Notifications + Profile + Logout */}
        <div className="flex items-center gap-1.5">
          {user ? (
            <>
              {/* Token balance */}
              <TokensDisplay />

              {/* Bell / Notifications */}
              <NotificationBell userId={user.id} />

              {/* Profile avatar */}
              <Link
                href="/profile"
                className="inline-flex items-center justify-center rounded-full p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                title={t("nav.profile")}
                aria-label={t("nav.profile")}
              >
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.displayName}
                    width={20}
                    height={20}
                    className="h-5 w-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                    {(user.displayName || user.email || "?")[0].toUpperCase()}
                  </div>
                )}
              </Link>

              {/* Logout */}
              <button
                type="button"
                onClick={() => void handleLogout()}
                disabled={loggingOut}
                className="inline-flex items-center justify-center rounded-full p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                title={t("nav.logout")}
                aria-label={t("nav.logout")}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {t("nav.login")}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
