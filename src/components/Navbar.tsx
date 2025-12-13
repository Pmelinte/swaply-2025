// src/components/Navbar.tsx

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type NotificationsApiResponse =
  | { ok: true; notifications: any[]; unreadCount: number }
  | { ok: false; error: string };

type WishlistApiResponse =
  | { ok: true; entries?: any[]; items?: any[] }
  | { ok: false; error: string };

export default function Navbar() {
  const [notifUnread, setNotifUnread] = useState<number>(0);
  const [wishlistCount, setWishlistCount] = useState<number>(0);

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
          // dacă nu e logat sau endpointul nu e gata, nu spargem navbar-ul
          setNotifUnread(0);
        }
      } catch {
        if (mounted) setNotifUnread(0);
      }
    };

    loadNotifications();

    // refresh ușor, ca să vezi badge-ul crescând când vin mesaje
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

        // API-ul tău poate întoarce items (preview) sau entries (rows)
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
      { href: "/items", label: "Items" },
      { href: "/categories/object", label: "Categorii" }, // fallback: vezi notes mai jos
      { href: "/wishlist", label: "Wishlist", badge: wishlistCount },
      { href: "/chat", label: "Chat" },
      { href: "/notifications", label: "Notificări", badge: notifUnread },
      { href: "/settings/profile", label: "Profil" },
      { href: "/map", label: "Hartă" },
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

        {/* Links */}
        <nav className="flex items-center gap-2 flex-wrap">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative px-3 py-2 rounded-md text-sm font-semibold hover:bg-gray-100 transition"
            >
              {item.label}

              {"badge" in item && typeof item.badge === "number" && item.badge > 0 && (
                <span className="ml-2 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 text-[11px] font-bold rounded-full bg-red-600 text-white align-middle">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </div>

      {/* NOTE:
          - Link-ul /categories/object e un fallback simplu.
          - Dacă ai deja o pagină de categorii (ex: /categories), schimbă href aici.
      */}
    </header>
  );
}