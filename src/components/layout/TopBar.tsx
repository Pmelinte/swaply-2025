"use client";

import { useRouter, usePathname, Link } from "@/i18n/navigation";
import Image from "next/image";
import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, LogOut, Globe, Search, User, Settings, Menu } from "lucide-react";
import { useDrawerStore } from "@/lib/state/drawerStore";
import { getDrawerVariantForPathname } from "@/lib/drawer/routeToDrawerVariant";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { locales, languageNames, flagUrl, type Locale } from "@/i18n/config";
import type { LanguageCode } from "@/lib/types";
import { promoteProfileLanguage } from "@/lib/i18n/profileLanguagePreferences";
import { TokensDisplay } from "@/components/tokens/TokensDisplay";
import { NotificationBell } from "@/components/notifications/NotificationBell";

/* ── Cookie utility ── */
function setCountryCookie(countryCode: string) {
  document.cookie = `user_country=${countryCode};path=/;max-age=${365 * 24 * 60 * 60};SameSite=Lax`;
}

function setLocaleCookie(locale: Locale) {
  document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=${365 * 24 * 60 * 60};SameSite=Lax`;
}

function getStoredCountry(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("user_country");
}

/** Derive default country from the current locale */
function countryForLocale(locale: Locale): string {
  return languageNames[locale].countryCode;
}

export function TopBar() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const {
    user,
    dataSource,
    logout,
    language,
    setLanguage,
    updateProfile,
  } = useAppState();

  const [loggingOut, setLoggingOut] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [langSearch, setLangSearch] = useState("");
  const langRef = useRef<HTMLDivElement>(null);
  const drawerOpen = useDrawerStore((state) => state.open);

  const openContextualDrawer = useCallback(() => {
    useDrawerStore.getState().openWith(getDrawerVariantForPathname(pathname));
  }, [pathname]);

  // Country state – persisted independently of locale
  const [country, setCountryState] = useState<string>(() => {
    return getStoredCountry() || countryForLocale(language as Locale);
  });

  const setCountry = useCallback((code: string) => {
    setCountryState(code);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("user_country", code);
      setCountryCookie(code);
    }
  }, []);

  // Sync country from localStorage on mount (in case cookie was set elsewhere)
  useEffect(() => {
    const stored = getStoredCountry();
    if (stored && stored !== country) {
      setCountryState(stored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // After authenticated hydration, the canonical profile primary language wins.
  // This restores the same locale after login or reload without changing the
  // independently selected country.
  const profilePrimaryLocale = user?.languages?.[0];
  useEffect(() => {
    if (dataSource !== "supabase" || !user?.id || !profilePrimaryLocale) return;
    if (!locales.includes(profilePrimaryLocale as Locale)) return;

    const preferredLocale = profilePrimaryLocale as Locale;
    if (language === preferredLocale) {
      setLocaleCookie(preferredLocale);
      return;
    }

    setLanguage(preferredLocale as LanguageCode);
    setLocaleCookie(preferredLocale);
    router.replace(pathname, { locale: preferredLocale });
  }, [
    dataSource,
    language,
    pathname,
    profilePrimaryLocale,
    router,
    setLanguage,
    user?.id,
  ]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
      router.push("/login");
    }
  };

  // Close dropdown on outside click
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

  // Build country+language entries from the config
  const entries = locales.map((loc) => {
    const info = languageNames[loc];
    return {
      locale: loc,
      countryCode: info.countryCode,
      countryName: info.name.replace(/^(\w+).*/, "$1"), // "English" -> country-ish fallback
      languageName: info.name,
      nativeName: info.nativeName,
    };
  });

  const filteredEntries = entries.filter((entry) => {
    if (!langSearch) return true;
    const q = langSearch.toLowerCase();
    return (
      entry.locale.includes(q) ||
      entry.countryCode.includes(q) ||
      entry.languageName.toLowerCase().includes(q) ||
      entry.nativeName.toLowerCase().includes(q)
    );
  });

  const handleSelectEntry = async (loc: Locale, countryCode: string) => {
    const nextLanguages = promoteProfileLanguage(loc, user?.languages ?? []);

    setLanguage(loc as LanguageCode);
    setCountry(countryCode);
    setLangOpen(false);
    setLangSearch("");
    setLocaleCookie(loc);

    // Navigate immediately; profile persistence continues through the canonical
    // revisioned owner RPC and keeps the selected locale primary after reload.
    router.replace(pathname, { locale: loc });

    if (user) {
      try {
        await updateProfile(
          { languages: nextLanguages as LanguageCode[] },
          { persist: dataSource === "supabase" },
        );
      } catch (error) {
        console.error("[language-preference] profile persistence failed", error);
      }
    }
  };

  // Current display values
  const currentLocaleInfo = languageNames[language as Locale] || languageNames.en;
  const displayFlag = flagUrl(country);
  const displayCountryCode = country.toUpperCase();
  const displayNativeName = currentLocaleInfo.nativeName;

  // Swipe-to-open: detect right-swipe from left edge of screen
  useEffect(() => {
    let startX = 0;
    let startY = 0;

    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const onTouchEnd = (e: TouchEvent) => {
      const deltaX = e.changedTouches[0].clientX - startX;
      const deltaY = e.changedTouches[0].clientY - startY;
      if (startX < 20 && deltaX > 60 && Math.abs(deltaX) > Math.abs(deltaY)) {
        useDrawerStore.getState().openWith(getDrawerVariantForPathname(pathname));
      }
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [pathname]);

  return (
    <>
    <div className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
        {/* Left: Hamburger + Logo + Country/Language */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openContextualDrawer}
            className="inline-flex items-center justify-center rounded-lg p-1.5 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            aria-label={t("nav.contextMenu")}
            aria-haspopup="dialog"
            aria-expanded={drawerOpen}
            aria-controls="swaply-contextual-drawer"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <Link href="/" className="flex items-center gap-2" title="Swaply">
            <Image src="/logo-swaply.svg" alt="Swaply" width={28} height={28} className="h-7 w-7" priority />
            <span className="hidden text-lg font-bold text-zinc-900 dark:text-zinc-50 sm:inline">Swaply</span>
          </Link>

          {/* Country + Language selector */}
          <div ref={langRef} className="relative">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              onClick={() => setLangOpen((prev) => !prev)}
              aria-label="Change country and language"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={displayFlag} alt="" width={20} height={15} className="rounded-sm" />
              <span className="font-semibold">{displayCountryCode}</span>
              <span className="text-zinc-400 dark:text-zinc-500">&middot;</span>
              <span className="hidden sm:inline">{displayNativeName}</span>
              <ChevronDown className="h-2.5 w-2.5" />
            </button>

            {langOpen && (
              <div className="absolute left-0 top-full z-30 mt-1 w-80 rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-800">
                {/* Search */}
                <div className="p-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      value={langSearch}
                      onChange={(e) => setLangSearch(e.target.value)}
                      placeholder={t("common.search")}
                      className="w-full rounded-lg border border-zinc-200 py-1.5 pl-8 pr-3 text-sm outline-none focus:border-blue-400 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-400"
                      autoFocus
                    />
                  </div>
                </div>

                {/* List */}
                <div className="max-h-80 overflow-y-auto px-1 pb-2">
                  {filteredEntries.map((entry) => {
                    const isActive = entry.locale === language && entry.countryCode === country;
                    return (
                      <button
                        key={entry.locale}
                        type="button"
                        onClick={() => void handleSelectEntry(entry.locale, entry.countryCode)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                          isActive
                            ? "bg-blue-50 font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                            : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-700"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={flagUrl(entry.countryCode)}
                          alt=""
                          width={20}
                          height={15}
                          className="shrink-0 rounded-sm"
                        />
                        <span className="flex-1 truncate">
                          <span className="font-medium">{entry.countryCode.toUpperCase()}</span>
                          <span className="mx-1.5 text-zinc-300 dark:text-zinc-600">&middot;</span>
                          <span>{entry.nativeName}</span>
                        </span>
                        <span className="text-xs text-zinc-400">{entry.languageName}</span>
                      </button>
                    );
                  })}
                  {filteredEntries.length === 0 && (
                    <div className="px-3 py-4 text-center text-sm text-zinc-400">{t("objects.noResults")}</div>
                  )}
                </div>

                {/* Footer hint */}
                <div className="border-t border-zinc-100 px-3 py-2 dark:border-zinc-700">
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                    <Globe className="h-3 w-3" />
                    <span>{t("common.recommendedNextStep")}</span>
                  </div>
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

              {/* Profile dropdown menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-full p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    aria-label={t("nav.profile")}
                    data-testid="profile-menu-trigger"
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
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48" data-testid="profile-menu-content">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {t("nav.profile")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile?tab=cont" className="flex items-center gap-2" data-testid="profile-menu-settings">
                      <Settings className="h-4 w-4" />
                      {t("nav.settings")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => void handleLogout()}
                    disabled={loggingOut}
                    className="text-red-600 focus:text-red-700 dark:text-red-400 dark:focus:text-red-300"
                  >
                    <LogOut className="h-4 w-4" />
                    {t("nav.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
    </>
  );
}
