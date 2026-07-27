"use client";

import { useCallback, type ComponentType } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  Activity,
  BookOpen,
  CalendarDays,
  CheckSquare,
  CircleUserRound,
  Handshake,
  Home,
  Info,
  Map,
  MessageSquare,
  PackageSearch,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  SlidersHorizontal,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useDrawerStore } from "@/lib/state/drawerStore";
import {
  getContextualDrawerConfig,
  type ContextualDrawerIcon,
  type ContextualDrawerPage,
} from "@/lib/drawer/contextualDrawerConfig";

const iconMap: Record<ContextualDrawerIcon, ComponentType<{ className?: string }>> = {
  activity: Activity,
  book: BookOpen,
  calendar: CalendarDays,
  checklist: CheckSquare,
  home: Home,
  info: Info,
  map: Map,
  message: MessageSquare,
  plus: Plus,
  search: Search,
  shield: ShieldCheck,
  sparkles: Sparkles,
  sliders: SlidersHorizontal,
  users: Users,
};

type DrawerTheme = {
  eyebrow: string;
  headerClassName: string;
  iconClassName: string;
  sectionClassName: string;
  itemClassName: string;
  pageIcon: ComponentType<{ className?: string }>;
};

const drawerThemes: Record<ContextualDrawerPage, DrawerTheme> = {
  profile: theme("Profile", "from-violet-600 to-fuchsia-500", "bg-violet-500/20", "border-violet-200/80", "hover:bg-violet-50 dark:hover:bg-violet-950/40", CircleUserRound),
  objects: theme("Objects", "from-sky-600 to-cyan-500", "bg-sky-500/20", "border-sky-200/80", "hover:bg-sky-50 dark:hover:bg-sky-950/40", PackageSearch),
  my_items: theme("My objects", "from-blue-700 to-indigo-500", "bg-blue-500/20", "border-blue-200/80", "hover:bg-blue-50 dark:hover:bg-blue-950/40", PackageSearch),
  item_detail: theme("Object details", "from-cyan-700 to-teal-500", "bg-cyan-500/20", "border-cyan-200/80", "hover:bg-cyan-50 dark:hover:bg-cyan-950/40", Info),
  item_editor: theme("Object editor", "from-emerald-700 to-green-500", "bg-emerald-500/20", "border-emerald-200/80", "hover:bg-emerald-50 dark:hover:bg-emerald-950/40", Plus),
  properties: theme("Properties", "from-amber-700 to-orange-500", "bg-amber-500/20", "border-amber-200/80", "hover:bg-amber-50 dark:hover:bg-amber-950/40", Home),
  services: theme("Services", "from-rose-700 to-pink-500", "bg-rose-500/20", "border-rose-200/80", "hover:bg-rose-50 dark:hover:bg-rose-950/40", Wrench),
  events: theme("Events", "from-purple-700 to-violet-500", "bg-purple-500/20", "border-purple-200/80", "hover:bg-purple-50 dark:hover:bg-purple-950/40", CalendarDays),
  matching: theme("Matching", "from-indigo-700 to-blue-500", "bg-indigo-500/20", "border-indigo-200/80", "hover:bg-indigo-50 dark:hover:bg-indigo-950/40", Sparkles),
  messages: theme("Messages", "from-teal-700 to-emerald-500", "bg-teal-500/20", "border-teal-200/80", "hover:bg-teal-50 dark:hover:bg-teal-950/40", MessageSquare),
  chat: theme("Chat", "from-green-700 to-lime-500", "bg-green-500/20", "border-green-200/80", "hover:bg-green-50 dark:hover:bg-green-950/40", Users),
  exchange: theme("Exchange", "from-orange-700 to-red-500", "bg-orange-500/20", "border-orange-200/80", "hover:bg-orange-50 dark:hover:bg-orange-950/40", Handshake),
  blog: theme("Blog", "from-zinc-800 to-slate-600", "bg-white/15", "border-zinc-300/80", "hover:bg-zinc-100 dark:hover:bg-zinc-800", BookOpen),
  stories: theme("Stories", "from-pink-700 to-rose-500", "bg-pink-500/20", "border-pink-200/80", "hover:bg-pink-50 dark:hover:bg-pink-950/40", Activity),
};

function theme(
  eyebrow: string,
  gradient: string,
  iconClassName: string,
  sectionBorder: string,
  itemHover: string,
  pageIcon: DrawerTheme["pageIcon"],
): DrawerTheme {
  return {
    eyebrow,
    headerClassName: `bg-gradient-to-br ${gradient}`,
    iconClassName,
    sectionClassName: sectionBorder,
    itemClassName: itemHover,
    pageIcon,
  };
}

function translateKey(t: ReturnType<typeof useTranslations>, key: string) {
  try {
    const value = t(key);
    return value || key;
  } catch {
    return key;
  }
}

export default function DrawerContextualPage({ page }: { page: ContextualDrawerPage }) {
  const t = useTranslations();
  const close = useDrawerStore((s) => s.close);
  const config = getContextualDrawerConfig(page);
  const drawerTheme = drawerThemes[page];
  const PageIcon = drawerTheme.pageIcon;
  const handleLinkClick = useCallback(() => close(), [close]);

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-drawer-page={page}>
      <header className={`relative overflow-hidden px-4 pb-5 pt-4 text-white ${drawerTheme.headerClassName}`}>
        <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10" aria-hidden="true" />
        <div className="absolute -bottom-12 -left-10 h-28 w-28 rounded-full bg-black/10" aria-hidden="true" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex min-w-0 gap-3">
            <div className={`mt-0.5 rounded-2xl p-2.5 backdrop-blur-sm ${drawerTheme.iconClassName}`}>
              <PageIcon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/75">
                {drawerTheme.eyebrow}
              </p>
              <h2 className="mt-0.5 text-xl font-extrabold leading-tight">
                {translateKey(t, config.titleKey)}
              </h2>
              {config.descriptionKey && (
                <p className="mt-1.5 text-sm leading-5 text-white/80">
                  {translateKey(t, config.descriptionKey)}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            className="rounded-xl bg-white/10 p-2 text-white transition hover:bg-white/20"
            aria-label={translateKey(t, "common.close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-zinc-50 px-4 py-4 dark:bg-zinc-950">
        <div className="space-y-4">
          {config.sections.map((section, sectionIndex) => (
            <section
              key={`${page}-${section.id}`}
              className={`rounded-2xl border bg-white p-3 shadow-sm dark:bg-zinc-900 ${drawerTheme.sectionClassName}`}
              data-drawer-section={`${page}-${section.id}`}
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
                  {translateKey(t, section.titleKey)}
                </h3>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  {sectionIndex + 1}
                </span>
              </div>
              <div className="space-y-1.5">
                {section.items.map((item) => {
                  const Icon = iconMap[item.icon];
                  const content = (
                    <>
                      <span className={`rounded-lg p-1.5 ${drawerTheme.iconClassName}`}>
                        <Icon className="h-4 w-4 shrink-0" />
                      </span>
                      <span className="min-w-0 flex-1">{translateKey(t, item.labelKey)}</span>
                    </>
                  );

                  const className = `flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm font-semibold transition ${
                    item.disabled
                      ? "cursor-not-allowed text-zinc-400 dark:text-zinc-600"
                      : `text-zinc-700 dark:text-zinc-200 ${drawerTheme.itemClassName}`
                  }`;

                  if (item.href && !item.disabled) {
                    return (
                      <Link
                        key={item.id}
                        href={item.href as "/"}
                        onClick={handleLinkClick}
                        className={className}
                        data-drawer-action={`${page}-${item.id}`}
                      >
                        {content}
                      </Link>
                    );
                  }

                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={item.disabled}
                      className={className}
                      data-drawer-action={`${page}-${item.id}`}
                    >
                      {content}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
