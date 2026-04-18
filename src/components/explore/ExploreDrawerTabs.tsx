"use client";

import type { ComponentType } from "react";
import { useTranslations } from "next-intl";
import { Eye, Search, User } from "lucide-react";
import type { ExploreTab } from "@/lib/explore/exploreFilterTypes";

interface Props {
  active: ExploreTab;
  onChange: (tab: ExploreTab) => void;
}

export function ExploreDrawerTabs({ active, onChange }: Props) {
  const t = useTranslations("exploreDrawer");

  const tabs: { value: ExploreTab; icon: ComponentType<{ className?: string }>; labelKey: string }[] = [
    { value: "offer", icon: Eye, labelKey: "tabOffer" },
    { value: "want", icon: Search, labelKey: "tabWant" },
    { value: "profile", icon: User, labelKey: "tabProfile" },
  ];

  return (
    <div className="flex border-b border-zinc-200 dark:border-zinc-700">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-sm font-medium transition relative ${
              isActive
                ? "text-blue-600 dark:text-blue-400"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{t(tab.labelKey)}</span>
            {isActive && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
            )}
          </button>
        );
      })}
    </div>
  );
}
