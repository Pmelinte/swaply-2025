"use client";

import { usePathname, Link } from "@/i18n/navigation";
import Image from "next/image";
import { useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import {
  X,
  Home,
  Box,
  HeartHandshake,
  MessageCircle,
  Shuffle,
  Building2,
  Wrench,
  CalendarDays,
  User,
  Heart,
  Clock,
  Package,
  Coins,
  Trophy,
  Info,
  Mail,
  MessageSquare,
  LogOut,
  LogIn,
  UserPlus,
} from "lucide-react";

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SideDrawer({ isOpen, onClose }: SideDrawerProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const { user, logout } = useAppState();

  const stableClose = useCallback(() => onClose(), [onClose]);

  // Close on route change
  useEffect(() => {
    stableClose();
  }, [pathname, stableClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") stableClose();
    }
    if (isOpen) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, stableClose]);

  const handleLogout = async () => {
    stableClose();
    await logout();
  };

  const navLinks = [
    { href: "/" as const, label: t("nav.home"), icon: Home },
    { href: "/objects" as const, label: t("nav.objects"), icon: Box },
    { href: "/match" as const, label: t("nav.matching"), icon: HeartHandshake },
    { href: "/chat" as const, label: t("nav.messages"), icon: MessageCircle },
    { href: "/change" as const, label: t("nav.exchange"), icon: Shuffle },
  ];

  const categoryLinks = [
    { href: "/objects" as const, label: t("branches.objects"), icon: Box },
    { href: "/properties" as const, label: t("branches.properties"), icon: Building2 },
    { href: "/services" as const, label: t("branches.services"), icon: Wrench },
    { href: "/events" as const, label: t("branches.events"), icon: CalendarDays },
  ];

  const userLinks = [
    { href: "/profile" as const, label: t("nav.profile"), icon: User },
    { href: "/favorites" as const, label: t("favorites.title"), icon: Heart },
    { href: "/history" as const, label: t("history.title"), icon: Clock },
    { href: "/my-objects" as const, label: t("myObjects.title"), icon: Package },
  ];

  const monetizationLinks = [
    { href: "/monetization" as const, label: t("contextBar.tokens"), icon: Coins },
    { href: "/leaderboard" as const, label: t("leaderboard.title"), icon: Trophy },
  ];

  const infoLinks = [
    { href: "/about" as const, label: t("about.title"), icon: Info },
    { href: "/contact" as const, label: t("contact.title"), icon: Mail },
    { href: "/feedback" as const, label: t("feedback.title"), icon: MessageSquare },
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={stableClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-[280px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out dark:bg-zinc-900 sm:w-[320px] ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <Link href="/" className="flex items-center gap-2" onClick={stableClose}>
            <Image src="/logo-swaply.svg" alt="Swaply" width={28} height={28} className="h-7 w-7" />
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Swaply</span>
          </Link>
          <button
            type="button"
            onClick={stableClose}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label={t("common.close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* User profile section */}
          {user ? (
            <div className="border-b border-zinc-100 px-4 py-4 dark:border-zinc-800">
              <Link href="/profile" onClick={stableClose} className="flex items-center gap-3">
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
            </div>
          ) : (
            <div className="flex gap-2 border-b border-zinc-100 px-4 py-4 dark:border-zinc-800">
              <Link
                href="/login"
                onClick={stableClose}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <LogIn className="h-4 w-4" />
                {t("nav.login")}
              </Link>
              <Link
                href="/register"
                onClick={stableClose}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <UserPlus className="h-4 w-4" />
                {t("login.registration")}
              </Link>
            </div>
          )}

          {/* Main navigation */}
          <DrawerSection title={t("nav.quickNav")}>
            {navLinks.map((link) => (
              <DrawerLink key={link.href} {...link} pathname={pathname} onClick={stableClose} />
            ))}
          </DrawerSection>

          {/* Categories */}
          <DrawerSection title={t("branches.tagline").split("—")[0].trim()}>
            {categoryLinks.map((link) => (
              <DrawerLink key={`cat-${link.href}`} {...link} pathname={pathname} onClick={stableClose} />
            ))}
          </DrawerSection>

          {/* User features (logged in only) */}
          {user && (
            <DrawerSection title={t("nav.profile")}>
              {userLinks.map((link) => (
                <DrawerLink key={link.href} {...link} pathname={pathname} onClick={stableClose} />
              ))}
            </DrawerSection>
          )}

          {/* Monetization (logged in only) */}
          {user && (
            <DrawerSection title={t("contextBar.monetization")}>
              {monetizationLinks.map((link) => (
                <DrawerLink key={link.href} {...link} pathname={pathname} onClick={stableClose} />
              ))}
            </DrawerSection>
          )}

          {/* Info & Support */}
          <DrawerSection title={t("nav.info")}>
            {infoLinks.map((link) => (
              <DrawerLink key={link.href} {...link} pathname={pathname} onClick={stableClose} />
            ))}
          </DrawerSection>
        </div>

        {/* Footer: Logout */}
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
      </aside>
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
