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
  Mail,
  MessageSquare,
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
  Building2,
  Wrench,
  CalendarDays,
  Search,
  Trophy,
  Star,
  UserRound,
  Bell,
  History,
  Plus,
  Users,
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
    <>
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
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
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

        <DrawerSection title={t("nav.explore")}>
          <DrawerLink href="/objects" label={t("branches.objects")} icon={Package} pathname={pathname} onClick={handleLinkClick} />
          <DrawerLink href="/properties" label={t("branches.properties")} icon={Building2} pathname={pathname} onClick={handleLinkClick} />
          <DrawerLink href="/services" label={t("branches.services")} icon={Wrench} pathname={pathname} onClick={handleLinkClick} />
          <DrawerLink href="/events" label={t("branches.events")} icon={CalendarDays} pathname={pathname} onClick={handleLinkClick} />
          <DrawerLink href="/explore" label={t("nav.explore")} icon={Search} pathname={pathname} onClick={handleLinkClick} />
        </DrawerSection>

        {user && (
          <DrawerSection title={t("common.myDesk")}>
            <DrawerLink href="/profile" label={t("profile.title")} icon={UserRound} pathname={pathname} onClick={handleLinkClick} />
            <DrawerLink href="/my-objects" label={t("myObjects.title")} icon={Package} pathname={pathname} onClick={handleLinkClick} />
            <DrawerLink href="/notifications" label={t("notifications.title")} icon={Bell} pathname={pathname} onClick={handleLinkClick} />
            <DrawerLink href="/history" label={t("history.title")} icon={History} pathname={pathname} onClick={handleLinkClick} />
          </DrawerSection>
        )}

        <DrawerSection title={t("info.guideTitle")}>
          <DrawerLink href="/info" label={t("info.pageTitle")} icon={Info} pathname={pathname} onClick={handleLinkClick} />
          <DrawerLink href="/about" label={t("about.title")} icon={BookOpen} pathname={pathname} onClick={handleLinkClick} />
          <DrawerLink href="/safety" label={t("legal.safetyTitle")} icon={ShieldAlert} pathname={pathname} onClick={handleLinkClick} />
          <DrawerLink href="/terms" label={t("legal.termsTitle")} icon={FileText} pathname={pathname} onClick={handleLinkClick} />
        </DrawerSection>

        <DrawerSection title={t("profile.reputationAndTokens")}>
          <DrawerLink href="/info#monetizare" label={t("profile.badgeBenefits")} icon={Star} pathname={pathname} onClick={handleLinkClick} />
          <DrawerLink href="/pricing" label={t("pricing.title")} icon={Tag} pathname={pathname} onClick={handleLinkClick} />
          <DrawerLink href="/stories" label={t("info.successStories")} icon={Users} pathname={pathname} onClick={handleLinkClick} />
          <DrawerLink href="/info#leaderboard" label={t("leaderboard.title")} icon={Trophy} pathname={pathname} onClick={handleLinkClick} />
        </DrawerSection>

        <DrawerSection title={t("nav.info")}>
          <DrawerLink href="/blog" label={t("blog.pageTitle")} icon={BookOpen} pathname={pathname} onClick={handleLinkClick} />
          <DrawerLink href="/contact" label={t("contact.title")} icon={Mail} pathname={pathname} onClick={handleLinkClick} />
          <DrawerLink href="/feedback" label={t("feedback.title")} icon={MessageSquare} pathname={pathname} onClick={handleLinkClick} />
        </DrawerSection>

        <DrawerSection title={t("nav.termsAndGdpr")}>
          <DrawerLink href="/privacy" label={t("legal.privacyTitle")} icon={ShieldCheck} pathname={pathname} onClick={handleLinkClick} />
          <DrawerLink href="/cookies" label={t("legal.cookiesTitle")} icon={Lock} pathname={pathname} onClick={handleLinkClick} />
          <DrawerLink href="/dmca" label={t("legal.dmcaTitle")} icon={AlertTriangle} pathname={pathname} onClick={handleLinkClick} />
          <DrawerLink href="/copyright" label={t("legal.copyrightTitle")} icon={FileText} pathname={pathname} onClick={handleLinkClick} />
          <DrawerButton label={t("cookieConsent.settings")} icon={Settings} onClick={handleCookieSettings} />
        </DrawerSection>
      </div>

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
  const headingId = useId();

  return (
    <section
      className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800"
      aria-labelledby={headingId}
    >
      <h2
        id={headingId}
        className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500"
      >
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
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  pathname: string;
  onClick: () => void;
}) {
  const hrefPath = href.split(/[?#]/)[0] || "/";
  const active = pathname === hrefPath || (hrefPath !== "/" && pathname.startsWith(`${hrefPath}/`));
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
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      <Icon className="h-5 w-5 shrink-0" />
      {label}
    </button>
  );
}
