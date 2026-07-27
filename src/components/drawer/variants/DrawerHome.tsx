"use client";

import { Children, useCallback, useEffect, useId, useRef } from "react";
import { usePathname, Link } from "@/i18n/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { useDrawerStore } from "@/lib/state/drawerStore";
import {
  X,
  Info,
  LogOut,
  LogIn,
  UserPlus,
  Tag,
  BookOpen,
  FileText,
  ShieldCheck,
  Lock,
  ShieldAlert,
  AlertTriangle,
  Settings,
  Package,
  Sparkles,
  Star,
  UserRound,
  Bell,
  History,
  Plus,
  Users,
  Handshake,
} from "lucide-react";

export default function DrawerHome() {
  const t = useTranslations();
  const pathname = usePathname();
  const { user, logout } = useAppState();
  const close = useDrawerStore((s) => s.close);
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      close();
    }
  }, [pathname, close]);

  const handleLogout = async () => {
    close();
    await logout();
  };

  const handleLinkClick = useCallback(() => close(), [close]);

  const handleCookieSettings = () => {
    localStorage.removeItem("cookie_consent");
    window.dispatchEvent(new Event("storage"));
    window.location.reload();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-drawer-page="home">
      <header className="relative overflow-hidden bg-gradient-to-br from-blue-700 to-cyan-500 px-4 pb-5 pt-4 text-white">
        <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10" aria-hidden="true" />
        <div className="absolute -bottom-12 -left-10 h-28 w-28 rounded-full bg-black/10" aria-hidden="true" />
        <div className="relative flex items-start justify-between gap-3">
          <Link href="/" className="flex min-w-0 items-center gap-3" onClick={handleLinkClick}>
            <span className="rounded-2xl bg-white/15 p-2.5 backdrop-blur-sm">
              <Image src="/logo-swaply.svg" alt="Swaply" width={28} height={28} className="h-7 w-7" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/75">Home</p>
              <h2 className="text-xl font-extrabold leading-tight">Swaply</h2>
            </div>
          </Link>
          <button
            type="button"
            onClick={close}
            className="rounded-xl bg-white/10 p-2 text-white transition hover:bg-white/20"
            aria-label={t("common.close")}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950">
        {user ? (
          <div className="border-b border-blue-100 bg-white px-4 py-4 dark:border-blue-950 dark:bg-zinc-900">
            <Link href="/profile" onClick={handleLinkClick} className="flex items-center gap-3">
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={user.displayName}
                  width={44}
                  height={44}
                  className="h-11 w-11 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                  {(user.displayName || user.email || "?")[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">{user.displayName}</p>
                <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{user.email}</p>
              </div>
            </Link>
            <Link
              href="/objects/new"
              onClick={handleLinkClick}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              {t("nav.addObject")}
            </Link>
          </div>
        ) : (
          <div className="border-b border-blue-100 bg-white px-4 py-4 dark:border-blue-950 dark:bg-zinc-900">
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/login"
                onClick={handleLinkClick}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <LogIn className="h-4 w-4" />
                {t("nav.login")}
              </Link>
              <Link
                href="/register"
                onClick={handleLinkClick}
                className="flex items-center justify-center gap-2 rounded-xl border border-blue-200 px-3 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950/30"
              >
                <UserPlus className="h-4 w-4" />
                {t("login.registration")}
              </Link>
            </div>
          </div>
        )}

        {user ? (
          <>
            <DrawerSection title={t("common.myDesk")} sectionId="home-dashboard">
              <DrawerLink href="/profile" label={t("profile.title")} icon={UserRound} pathname={pathname} onClick={handleLinkClick} actionId="home-profile" />
              <DrawerLink href="/my-objects" label={t("myObjects.title")} icon={Package} pathname={pathname} onClick={handleLinkClick} actionId="home-my-objects" />
              <DrawerLink href="/notifications" label={t("notifications.title")} icon={Bell} pathname={pathname} onClick={handleLinkClick} actionId="home-notifications" />
              <DrawerLink href="/matching" label={t("nav.matching")} icon={Sparkles} pathname={pathname} onClick={handleLinkClick} actionId="home-matching" />
              <DrawerLink href="/exchange" label={t("nav.exchange")} icon={Handshake} pathname={pathname} onClick={handleLinkClick} actionId="home-exchange" />
              <DrawerLink href="/history" label={t("history.title")} icon={History} pathname={pathname} onClick={handleLinkClick} actionId="home-history" />
            </DrawerSection>

            <DrawerSection title={t("profile.reputationAndTokens")} sectionId="home-reputation">
              <DrawerLink href="/info#monetizare" label={t("profile.badgeBenefits")} icon={Star} pathname={pathname} onClick={handleLinkClick} actionId="home-reputation" />
              <DrawerLink href="/pricing" label={t("pricing.title")} icon={Tag} pathname={pathname} onClick={handleLinkClick} actionId="home-pricing" />
            </DrawerSection>
          </>
        ) : (
          <DrawerSection title={t("info.guideTitle")} sectionId="home-get-started">
            <DrawerLink href="/info" label={t("info.pageTitle")} icon={Info} pathname={pathname} onClick={handleLinkClick} actionId="home-how-it-works" />
            <DrawerLink href="/safety" label={t("legal.safetyTitle")} icon={ShieldAlert} pathname={pathname} onClick={handleLinkClick} actionId="home-safety" />
            <DrawerLink href="/stories" label={t("info.successStories")} icon={Users} pathname={pathname} onClick={handleLinkClick} actionId="home-stories" />
          </DrawerSection>
        )}

        <DrawerSection title={t("info.guideTitle")} sectionId="home-guidance">
          <DrawerLink href="/blog" label={t("blog.pageTitle")} icon={BookOpen} pathname={pathname} onClick={handleLinkClick} actionId="home-blog" />
          <DrawerLink href="/stories" label={t("info.successStories")} icon={Users} pathname={pathname} onClick={handleLinkClick} actionId="home-success-stories" />
          <DrawerLink href="/about" label={t("about.title")} icon={Info} pathname={pathname} onClick={handleLinkClick} actionId="home-about" />
        </DrawerSection>

        <DrawerSection title={t("nav.termsAndGdpr")} sectionId="home-legal">
          <DrawerLink href="/privacy" label={t("legal.privacyTitle")} icon={ShieldCheck} pathname={pathname} onClick={handleLinkClick} actionId="home-privacy" />
          <DrawerLink href="/cookies" label={t("legal.cookiesTitle")} icon={Lock} pathname={pathname} onClick={handleLinkClick} actionId="home-cookies" />
          <DrawerLink href="/terms" label={t("legal.termsTitle")} icon={FileText} pathname={pathname} onClick={handleLinkClick} actionId="home-terms" />
          <DrawerLink href="/dmca" label={t("legal.dmcaTitle")} icon={AlertTriangle} pathname={pathname} onClick={handleLinkClick} actionId="home-dmca" />
          <DrawerButton label={t("cookieConsent.settings")} icon={Settings} onClick={handleCookieSettings} actionId="home-cookie-settings" />
        </DrawerSection>
      </div>

      {user && (
        <div className="border-t border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
            data-drawer-action="home-logout"
          >
            <LogOut className="h-5 w-5" />
            {t("nav.logout")}
          </button>
        </div>
      )}
    </div>
  );
}

function DrawerSection({ title, sectionId, children }: { title: string; sectionId: string; children: React.ReactNode }) {
  const headingId = useId();

  return (
    <section className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800" aria-labelledby={headingId} data-drawer-section={sectionId}>
      <h2 id={headingId} className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
        {title}
      </h2>
      <ul className="flex flex-col gap-0.5">
        {Children.toArray(children).map((child, index) => (
          <li key={index}>{child}</li>
        ))}
      </ul>
    </section>
  );
}

function DrawerLink({
  href,
  label,
  icon: Icon,
  pathname,
  onClick,
  actionId,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  pathname: string;
  onClick: () => void;
  actionId: string;
}) {
  const hrefPath = href.split(/[?#]/)[0] || "/";
  const active = pathname === hrefPath || (hrefPath !== "/" && pathname.startsWith(`${hrefPath}/`));
  return (
    <Link
      href={href as "/"}
      onClick={onClick}
      data-drawer-action={actionId}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300"
          : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
      }`}
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );
}

function DrawerButton({
  label,
  icon: Icon,
  onClick,
  actionId,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  actionId: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-drawer-action={actionId}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      <Icon className="h-5 w-5 shrink-0" />
      {label}
    </button>
  );
}
