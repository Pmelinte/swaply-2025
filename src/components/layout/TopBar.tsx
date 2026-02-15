"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { BellDot, ChevronDown, Languages, LogOut, Menu, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { Badge } from "../ui";
import { locales, languageNames, type Locale } from "@/i18n/config";
import type { LanguageCode } from "@/lib/types";

export function TopBar() {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, language, setLanguage, notifications, markNotificationRead } =
    useAppState();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [langSearch, setLangSearch] = useState("");
  const langRef = useRef<HTMLDivElement>(null);

  const menuLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/objects", label: t("nav.objects") },
    { href: "/match", label: t("nav.matching") },
    { href: "/chat", label: t("nav.messages") },
    { href: "/change", label: t("nav.exchange") },
    { href: "/info", label: t("nav.info") },
    { href: "/profile", label: t("nav.profile") },
  ];

  const contextualActions: Record<
    string,
    Array<{ label: string; href: string; disabled?: boolean }>
  > = {
    "/": [
      { label: t("nav.viewObjects"), href: "/objects" },
      { label: t("nav.searchOnMap"), href: "/info#map" },
      { label: t("nav.analyzeMatches"), href: "/match" },
    ],
    "/objects": [
      { label: t("nav.addObject"), href: "/objects/new" },
      { label: t("nav.analyzeMatches"), href: "/match" },
    ],
    "/match": [
      { label: t("nav.sendMessage"), href: "/chat" },
      { label: t("nav.proposeExchange"), href: "/change" },
    ],
    "/chat": [
      { label: t("nav.proposeExchange"), href: "/change" },
      { label: t("nav.chatRules"), href: "/info#legal" },
    ],
    "/change": [
      { label: t("nav.confirmExchange"), href: "/change" },
      { label: t("nav.viewObject"), href: "/objects" },
    ],
    "/info": [
      { label: t("nav.termsAndGdpr"), href: "/info#legal" },
      { label: t("nav.badgeBenefits"), href: "/info#monetizare" },
    ],
    "/profile": [
      { label: t("nav.completeProfile"), href: "/profile" },
      { label: t("nav.badgeBenefits"), href: "/info#monetizare" },
    ],
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    setMenuOpen(false);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
      router.push("/login");
    }
  };

  const [notifOpen, setNotifOpen] = useState(false);
  const pathKey =
    Object.keys(contextualActions).find(
      (key) => pathname === key || pathname.startsWith(`${key}/`),
    ) ?? pathname;
  const actions = contextualActions[pathKey] ?? [];
  const unread = notifications.filter((n) => !n.read).length;

  // Close language dropdown on outside click
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

  // Filter languages by search
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

  const handleSelectLanguage = (loc: Locale) => {
    setLanguage(loc as LanguageCode);
    setLangOpen(false);
    setLangSearch("");
    // Update html lang attribute
    document.documentElement.lang = loc;
  };

  return (
    <div className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
          {/* Language Selector */}
          <div ref={langRef} className="relative">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              onClick={() => setLangOpen((prev) => !prev)}
            >
              <Languages className="h-4 w-4" />
              <span className="font-semibold uppercase">{language}</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            {langOpen && (
              <div className="absolute left-0 top-full z-30 mt-1 w-64 rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                <div className="p-2">
                  <input
                    type="text"
                    value={langSearch}
                    onChange={(e) => setLangSearch(e.target.value)}
                    placeholder={t("common.search") + "…"}
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
                        <span className="w-8 font-mono text-xs uppercase text-zinc-400">{loc}</span>
                        <span className="flex-1">{info.nativeName}</span>
                        <span className="text-xs text-zinc-400">{info.name}</span>
                      </button>
                    );
                  })}
                  {filteredLocales.length === 0 && (
                    <div className="px-3 py-2 text-sm text-zinc-400">—</div>
                  )}
                </div>
              </div>
            )}
          </div>
          <span className="text-xs text-zinc-400">{pathname}</span>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-sm font-semibold shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <Badge tier={user.badge} />
                <span className="hidden sm:inline max-w-[120px] truncate">{user.displayName || user.email}</span>
              </Link>
              <button
                type="button"
                onClick={() => void handleLogout()}
                disabled={loggingOut}
                className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-white px-3 py-1 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:bg-zinc-800 dark:text-red-400 dark:hover:bg-red-900/30"
                title={t("nav.logout")}
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{loggingOut ? "…" : t("nav.logout")}</span>
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-blue-600 px-3 py-1 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {t("nav.login")}
            </Link>
          )}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-sm font-medium shadow-sm hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <Menu className="h-4 w-4" />
            </button>
            {menuOpen ? (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                <div className="px-2 pb-2 text-xs text-zinc-500 dark:text-zinc-400">
                  {t("nav.quickNav")}
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
                    <span>{t("nav.contextMenu")}</span>
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
                    <span>{t("nav.notificationsAndAccount")}</span>
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
                        {t("notifications.title")}
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
                            {t("notifications.empty")}
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
                    {t("nav.profile")}
                  </Link>
                  <Link
                    href="/info#legal"
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-700"
                    onClick={() => setMenuOpen(false)}
                  >
                    {t("nav.termsAndGdpr")}
                  </Link>
                  {user ? (
                    <button
                      type="button"
                      onClick={() => void handleLogout()}
                      disabled={loggingOut}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-200 dark:hover:bg-red-900/40"
                    >
                      {loggingOut ? t("nav.loggingOut") : t("nav.logout")}
                    </button>
                  ) : (
                    <Link
                      href="/login"
                      className="block rounded-lg px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 dark:text-blue-200 dark:hover:bg-blue-900/40"
                    >
                      {t("nav.login")}
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
