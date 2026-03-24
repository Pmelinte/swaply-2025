"use client";

import { useMemo } from "react";
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import {
  Home,
  Box,
  HeartHandshake,
  ClipboardList,
  Shuffle,
} from "lucide-react";

const ACTIVE_SWAP_STATUSES = new Set(["pending", "accepted", "in_progress", "delivered_by_a", "delivered_by_b"]);

export function FooterNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const { user, swaps } = useAppState();

  // Count urgent desk tasks (pending proposals where user is responder + deliveries needing confirmation + completed without review)
  const deskBadge = useMemo(() => {
    if (!user) return 0;
    let count = 0;
    for (const s of swaps) {
      if (s.status === "pending" && s.responderId === user.id) count++;
      if (s.status === "delivered_by_a" && s.responderId === user.id && !s.responderConfirmed) count++;
      if (s.status === "delivered_by_b" && s.requesterId === user.id && !s.requesterConfirmed) count++;
      if (s.status === "completed" && !s.feedback) count++;
    }
    return count;
  }, [swaps, user]);

  const links = [
    { href: "/", label: t("home"), icon: Home, badge: 0 },
    { href: "/objects", label: t("objects"), icon: Box, badge: 0 },
    { href: "/match", label: t("matching"), icon: HeartHandshake, badge: 0 },
    { href: "/desk", label: t("desk"), icon: ClipboardList, badge: deskBadge },
    { href: "/change", label: t("exchange"), icon: Shuffle, badge: 0 },
  ];

  return (
    <nav aria-label="Main navigation" className="sticky bottom-0 z-20 border-t border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="mx-auto grid max-w-6xl grid-cols-5 gap-1 px-2 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
        {links.map((link) => {
          const Icon = link.icon;
          const active =
            pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`relative flex flex-col items-center gap-1 rounded-xl px-2 py-2 transition hover:bg-zinc-100 dark:hover:bg-zinc-800 ${active ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-100" : ""}`}
            >
              <span className="relative">
                <Icon className="h-5 w-5" />
                {link.badge > 0 && (
                  <span className="absolute -right-2 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
                    {link.badge > 9 ? "9+" : link.badge}
                  </span>
                )}
              </span>
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
