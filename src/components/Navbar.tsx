"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useGamification } from "@/features/gamification/hooks/use-gamification";
import LanguageSelector from "@/components/LanguageSelector";

type NotificationsApiResponse =
  | { ok: true; notifications: any[]; unreadCount: number }
  | { ok: false; error: string };

type WishlistApiResponse =
  | { ok: true; entries?: any[]; items?: any[] }
  | { ok: false; error: string };

function rankEmoji(rank: string) {
  switch (rank) {
    case "platinum":
      return "💎";
    case "gold":
      return "🥇";
    case "silver":
      return "🥈";
    default:
      return "🥉";
  }
}

export default function Navbar() {
  const [notifUnread, setNotifUnread] = useState<number>(0);
  const [wishlistCount, setWishlistCount] = useState<number>(0);

  // 🔹 Gamification (rank + points)
  const { rank, points } = useGamification();

  // ------------------------------------------------
  // Notifications unread count (best-effort)
  // ------------------------------------------------
  useEffect(() => {
    let mounted = true;

    const loadNotifications = async () => {
      try {
        const res = await fetch("/api/notifications?unreadOnly=true&limit=1", {
          cache: "no-store",
        });
        const data: NotificationsApiResponse = await res.json();

        if (!mounted) return;

        if (res.ok && data.ok) {
          setNotifUnread(data.unreadCount ?? 0);
        } else {
          setNotifUnread(0);
        }
      } catch {
        if (mounted) setNotifUnread(0);
      }
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // ------------------------------------------------
  // Wishlist count (best-effort)
  // ------------------------------------------------
  useEffect(() => {
    let mounted = true;

    const loadWishlist = async () => {
      try {
        const res = await fetch("/api/wishlist", { cache: "no-store" });
        const data: WishlistApiResponse = await res.json();

        if (!mounted) return;

        if (!res.ok || !data.ok) {
          setWishlistCount(0);
          return;
        }

        const entries = (data as any).entries ?? [];
        const items = (data as any).items ?? [];

        const count = Array.isArray(items)
          ? items.length
          : Array.isArray(entries)
          ? entries.length
          : 0;

        setWishlistCount(count);
      } catch {
        if (mounted) setWishlistCount(0);
      }
    };

    loadWishlist();
    const interval = setInterval(loadWishlist, 20000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const nav = useMemo(
    () => [
      { href: "/browse", label: "Browse" },
      { href: "/items", label: "Items" },
      { href: "/wishlist", label: "Wishlist", badge: wishlistCount },
      { href: "/matches", label: "Matches" },
      { href: "/swaps", label: "Swaps" },
      { href: "/chat", label: "Chat" },
      { href: "/map", label: "Hartă" },
      { href: "/premium", label: "Premium" },
      { href: "/admin", label: "Admin" },
      { href: "/login", label: "Login" },
      { href: "/logout", label: "Logout" },
    ],
    [notifUnread, wishlistCount],
  );

  return (
    <header className="w-full border-b bg-white">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="font-extrabold text-lg tracking-tight">
          Swaply
        </Link>

        {/* Center nav */}
        <nav className="flex items-center gap-2 flex-wrap">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative px-3 py-2 rounded-md text-sm font-semibold hover:bg-gray-100 transition"
            >
              {item.label}

              {"badge" in item && typeof item.badge === "number" && item.badge > 0 && (
                <span className="ml-2 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 text-[11px] font-bold rounded-full bg-red-600 text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSelector />
          <Link
            href="/settings/profile"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold hover:bg-gray-100 transition"
            title={`Rang: ${rank} (${points} puncte)`}
          >
            <span className="text-lg">{rankEmoji(rank)}</span>
            <span className="hidden sm:inline capitalize">{rank}</span>
            <span className="text-xs text-gray-500 hidden md:inline">
              {points}p
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
