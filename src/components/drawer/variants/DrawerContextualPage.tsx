"use client";

import { useCallback, type ComponentType } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  Activity,
  BookOpen,
  CalendarDays,
  CheckSquare,
  Home,
  Info,
  Map,
  MessageSquare,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Users,
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
  const handleLinkClick = useCallback(() => close(), [close]);

  return (
    <>
      <div className="flex items-start justify-between gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            {translateKey(t, "nav.contextMenu")}
          </p>
          <h2 className="truncate text-lg font-bold text-zinc-900 dark:text-zinc-50">
            {translateKey(t, config.titleKey)}
          </h2>
          {config.descriptionKey && (
            <p className="mt-1 text-sm leading-5 text-zinc-500 dark:text-zinc-400">
              {translateKey(t, config.descriptionKey)}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={close}
          className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          aria-label={translateKey(t, "common.close")}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-4">
          {config.sections.map((section) => (
            <section
              key={section.id}
              className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                {translateKey(t, section.titleKey)}
              </h3>
              <div className="space-y-1.5">
                {section.items.map((item) => {
                  const Icon = iconMap[item.icon];
                  const content = (
                    <>
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="min-w-0 flex-1">{translateKey(t, item.labelKey)}</span>
                    </>
                  );

                  const className = `flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                    item.disabled
                      ? "cursor-not-allowed text-zinc-400 dark:text-zinc-600"
                      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`;

                  if (item.href && !item.disabled) {
                    return (
                      <Link key={item.id} href={item.href as "/"} onClick={handleLinkClick} className={className}>
                        {content}
                      </Link>
                    );
                  }

                  return (
                    <button key={item.id} type="button" disabled={item.disabled} className={className}>
                      {content}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
