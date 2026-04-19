"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname, Link } from "@/i18n/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { useDrawerStore } from "@/lib/state/drawerStore";
import {
  X,
  Info,
  Mail,
  MessageSquare,
  LogOut,
  LogIn,
  UserPlus,
  Coins,
  Tag,
  BookOpen,
  FileText,
  ShieldCheck,
  Lock,
  ShieldAlert,
  AlertTriangle,
  Settings,
} from "lucide-react";

export default function DrawerHome() {
  const t = useTranslations();
  const pathname = usePathname();
  const { user, logout } = useAppState();
  const close = useDrawerStore((s) => s.close);
  const prevPathname = useRef(pathname);

  // Close when pathname changes (navigated away)
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

  const infoLinks = [
    { href: "/about" as const, label: t("about.title"), icon: Info },
    { href: "/blog" as const, label: "Blog", icon: BookOpen },
    { href: "/contact" as const, label: t("contact.title"), icon: Mail },
    { href: "/feedback" as const, label: t("feedback.title"), icon: MessageSquare },
  ];

  const legalLinks = [
    { href: "/terms" as const, label: t("legal.termsTitle"), icon: FileText },
    { href: "/privacy" as const, label: t("legal.privacyTitle"), icon: ShieldCheck },
    { href: "/cookies" as const, label: t("legal.cookiesTitle"), icon: Lock },
    { href: "/safety" as const, label: t("legal.safetyTitle"), icon: ShieldAlert },
    { href: "/dmca" as const, label: t("legal.dmcaTitle"), icon: AlertTriangle },
    { href: "/copyright" as const, label: t("legal.copyrightTitle"), icon: FileText },
  ];

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <Link href="/" className="flex items-center gap-2" onClick={handleLinkClick}>
          <Image src="/logo-swaply.svg" alt="Swaply" width={28} height={28} className="h-7 w-7" />
          <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Swaply</span>
        </Link>
        <button
          type="button"
          onClick={close}
          className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          aria-label={t("common.close")}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Auth / Profile section */}
        {user ? (
          <div className="border-b border-zinc-100 px-4 py-4 dark:border-zinc-800">
            <Link href="/profile" onClick={handleLinkClick} className="flex items-center gap-3">
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={user.displayName}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                  {(user.displayName || user.email || "?")[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {user.displayName}
                </p>
                <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {user.email}
                </p>
              </div>
            </Link>
            <nav className="mt-2 flex flex-col gap-0.5">
              <DrawerLink href="/pricing" label={t("pricing.title")} icon={Tag} pathname={pathname} onClick={handleLinkClick} />
              <DrawerLink href="/monetization" label="Swapleni" icon={Coins} pathname={pathname} onClick={handleLinkClick} />
            </nav>
          </div>
        ) : (
          <div className="flex gap-2 border-b border-zinc-100 px-4 py-4 dark:border-zinc-800">
            <Link
              href="/login"
              onClick={handleLinkClick}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <LogIn className="h-4 w-4" />
              {t("nav.login")}
            </Link>
            <Link
              href="/register"
              onClick={handleLinkClick}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <UserPlus className="h-4 w-4" />
              {t("login.registration")}
            </Link>
          </div>
        )}

        {/* Info */}
        <DrawerSection title={t("nav.info")}>
          {infoLinks.map((link) => (
            <DrawerLink key={link.href} {...link} pathname={pathname} onClick={handleLinkClick} />
          ))}
        </DrawerSection>

        {/* Legal */}
        <DrawerSection title="Legal">
          {legalLinks.map((link) => (
            <DrawerLink key={link.href} {...link} pathname={pathname} onClick={handleLinkClick} />
          ))}
          <DrawerButton
            label={t("cookieConsent.settings")}
            icon={Settings}
            onClick={handleCookieSettings}
          />
        </DrawerSection>
      </div>

      {/* Sticky Logout (logged in only) */}
      {user && (
        <div className="border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
          >
            <LogOut className="h-5 w-5" />
            {t("nav.logout")}
          </button>
        </div>
      )}
    </>
  );
}

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
      <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
        {title}
      </h3>
      <nav className="flex flex-col gap-0.5">{children}</nav>
    </div>
  );
}

function DrawerLink({
  href,
  label,
  icon: Icon,
  pathname,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  pathname: string;
  onClick: () => void;
}) {
  const active = pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
  return (
    <Link
      href={href as "/"}
      onClick={onClick}
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
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      <Icon className="h-5 w-5 shrink-0" />
      {label}
    </button>
  );
}
