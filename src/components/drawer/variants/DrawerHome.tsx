"use client";

import { Children, useCallback, useEffect, useId, useRef } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  Bell,
  BookOpen,
  ChevronRight,
  Handshake,
  Info,
  LogIn,
  LogOut,
  Package,
  Plus,
  ShieldAlert,
  Sparkles,
  Star,
  UserPlus,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { useAppState } from "@/lib/state";
import { useDrawerStore } from "@/lib/state/drawerStore";

export default function DrawerHome() {
  const t = useTranslations();
  const pathname = usePathname();
  const { user, logout } = useAppState();
  const close = useDrawerStore((state) => state.close);
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (previousPathname.current !== pathname) {
      previousPathname.current = pathname;
      close();
    }
  }, [pathname, close]);

  const handleLinkClick = useCallback(() => close(), [close]);

  const handleLogout = async () => {
    close();
    await logout();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-drawer-page="home">
      <header className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 px-4 pb-5 pt-4 text-white">
        <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/10" aria-hidden="true" />
        <div className="absolute -bottom-14 -left-10 h-32 w-32 rounded-full bg-black/10" aria-hidden="true" />
        <div className="relative flex items-start justify-between gap-3">
          <Link href="/" className="flex min-w-0 items-center gap-3" onClick={handleLinkClick}>
            <span className="rounded-2xl bg-white/15 p-2.5 backdrop-blur-sm">
              <Image src="/logo-swaply.svg" alt="Swaply" width={30} height={30} className="h-8 w-8" />
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

      <div className="flex-1 overflow-y-auto bg-zinc-50 px-4 py-4 dark:bg-zinc-950">
        {user ? (
          <AuthenticatedHome
            user={user}
            pathname={pathname}
            onNavigate={handleLinkClick}
            t={t}
          />
        ) : (
          <GuestHome pathname={pathname} onNavigate={handleLinkClick} t={t} />
        )}
      </div>

      {user && (
        <div className="border-t border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
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

function GuestHome({
  pathname,
  onNavigate,
  t,
}: {
  pathname: string;
  onNavigate: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="space-y-4" data-home-state="guest">
      <section className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm dark:border-blue-950 dark:bg-zinc-900" data-drawer-section="home-onboarding">
        <div className="mb-3 flex items-start gap-3">
          <span className="rounded-xl bg-blue-50 p-2 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{t("info.pageTitle")}</h3>
            <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">{t("about.title")}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <PrimaryAction href="/register" icon={UserPlus} label={t("login.registration")} onClick={onNavigate} actionId="home-register" />
          <SecondaryAction href="/login" icon={LogIn} label={t("nav.login")} onClick={onNavigate} actionId="home-login" />
        </div>
      </section>

      <HomePanel title={t("info.guideTitle")} sectionId="home-get-started">
        <HomeAction href="/info" label={t("info.pageTitle")} icon={Info} pathname={pathname} onClick={onNavigate} actionId="home-how-it-works" />
        <HomeAction href="/safety" label={t("legal.safetyTitle")} icon={ShieldAlert} pathname={pathname} onClick={onNavigate} actionId="home-safety" />
        <HomeAction href="/blog" label={t("blog.pageTitle")} icon={BookOpen} pathname={pathname} onClick={onNavigate} actionId="home-blog" />
        <HomeAction href="/stories" label={t("info.successStories")} icon={Users} pathname={pathname} onClick={onNavigate} actionId="home-stories" />
      </HomePanel>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900" data-drawer-section="home-unlocks">
        <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">{t("common.myDesk")}</h3>
        <div className="grid grid-cols-2 gap-2">
          <PreviewCard icon={UserRound} label={t("profile.title")} />
          <PreviewCard icon={Package} label={t("myObjects.title")} />
          <PreviewCard icon={Sparkles} label={t("nav.matching")} />
          <PreviewCard icon={Handshake} label={t("nav.exchange")} />
        </div>
      </section>
    </div>
  );
}

function AuthenticatedHome({
  user,
  pathname,
  onNavigate,
  t,
}: {
  user: { avatarUrl?: string | null; displayName: string; email?: string | null };
  pathname: string;
  onNavigate: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="space-y-4" data-home-state="authenticated">
      <section className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm dark:border-blue-950 dark:bg-zinc-900" data-drawer-section="home-profile-status">
        <Link href="/profile" onClick={onNavigate} className="flex items-center gap-3" data-drawer-action="home-profile">
          {user.avatarUrl ? (
            <Image src={user.avatarUrl} alt={user.displayName} width={48} height={48} className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-base font-bold text-white">
              {(user.displayName || user.email || "?")[0].toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-50">{user.displayName}</p>
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{user.email}</p>
          </div>
          <ChevronRight className="h-5 w-5 text-zinc-400" />
        </Link>
        <PrimaryAction href="/objects/new" icon={Plus} label={t("nav.addObject")} onClick={onNavigate} actionId="home-add-object" fullWidth />
      </section>

      <HomePanel title={t("common.myDesk")} sectionId="home-status">
        <HomeAction href="/notifications" label={t("notifications.title")} icon={Bell} pathname={pathname} onClick={onNavigate} actionId="home-notifications" />
        <HomeAction href="/my-objects" label={t("myObjects.title")} icon={Package} pathname={pathname} onClick={onNavigate} actionId="home-active-objects" />
        <HomeAction href="/exchange" label={t("nav.exchange")} icon={Handshake} pathname={pathname} onClick={onNavigate} actionId="home-active-exchanges" />
      </HomePanel>

      <HomePanel title={t("profile.reputationAndTokens")} sectionId="home-recommendations">
        <HomeAction href="/matching" label={t("nav.matching")} icon={Sparkles} pathname={pathname} onClick={onNavigate} actionId="home-ai-recommendations" />
        <HomeAction href="/info#monetizare" label={t("profile.badgeBenefits")} icon={Star} pathname={pathname} onClick={onNavigate} actionId="home-rank-tokens" />
      </HomePanel>

      <HomePanel title={t("info.guideTitle")} sectionId="home-guidance">
        <HomeAction href="/blog" label={t("blog.pageTitle")} icon={BookOpen} pathname={pathname} onClick={onNavigate} actionId="home-blog" />
        <HomeAction href="/stories" label={t("info.successStories")} icon={Users} pathname={pathname} onClick={onNavigate} actionId="home-stories" />
      </HomePanel>
    </div>
  );
}

function HomePanel({ title, sectionId, children }: { title: string; sectionId: string; children: React.ReactNode }) {
  const headingId = useId();

  return (
    <section
      className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      data-drawer-section={sectionId}
      aria-labelledby={headingId}
    >
      <h2 id={headingId} className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
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

function HomeAction({ href, label, icon: Icon, pathname, onClick, actionId }: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; pathname: string; onClick: () => void; actionId: string }) {
  const hrefPath = href.split(/[?#]/)[0] || "/";
  const active = pathname === hrefPath || (hrefPath !== "/" && pathname.startsWith(`${hrefPath}/`));

  return (
    <Link href={href as "/"} onClick={onClick} data-drawer-action={actionId} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${active ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300" : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"}`}>
      <span className="rounded-lg bg-zinc-100 p-1.5 dark:bg-zinc-800"><Icon className="h-4 w-4" /></span>
      <span className="min-w-0 flex-1">{label}</span>
      <ChevronRight className="h-4 w-4 text-zinc-400" />
    </Link>
  );
}

function PreviewCard({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
      <Icon className="mb-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
      <p className="text-xs font-semibold leading-4 text-zinc-700 dark:text-zinc-200">{label}</p>
    </div>
  );
}

function PrimaryAction({ href, icon: Icon, label, onClick, actionId, fullWidth = false }: { href: string; icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void; actionId: string; fullWidth?: boolean }) {
  return (
    <Link href={href as "/"} onClick={onClick} data-drawer-action={actionId} className={`${fullWidth ? "mt-3 flex w-full" : "flex"} items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700`}>
      <Icon className="h-4 w-4" />{label}
    </Link>
  );
}

function SecondaryAction({ href, icon: Icon, label, onClick, actionId }: { href: string; icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void; actionId: string }) {
  return (
    <Link href={href as "/"} onClick={onClick} data-drawer-action={actionId} className="flex items-center justify-center gap-2 rounded-xl border border-blue-200 px-3 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950/30">
      <Icon className="h-4 w-4" />{label}
    </Link>
  );
}
