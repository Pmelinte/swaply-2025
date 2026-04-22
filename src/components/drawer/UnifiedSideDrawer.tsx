"use client";

import { useEffect, useMemo } from "react";
import { usePathname } from "@/i18n/navigation";
import { locales } from "@/i18n/config";
import { useDrawerStore, type DrawerVariant } from "@/lib/state/drawerStore";
import DrawerHome from "./variants/DrawerHome";
import DrawerChat from "./variants/DrawerChat";
import DrawerExplore from "./variants/DrawerExplore";
import DrawerMatching from "./variants/DrawerMatching";
import DrawerExchange from "./variants/DrawerExchange";

/**
 * Defensive locale strip. next-intl's usePathname from our wrapper is
 * supposed to return a pathname without the locale prefix, but different
 * combinations of next-intl / next versions have been observed leaking it
 * through. This keeps the matcher correct regardless of which shape we get.
 *
 * Uses the declared locales list (handles 2-char AND 3-char locales like `fil`).
 */
function stripLocale(p: string): string {
  const segments = p.split("/");
  if (
    segments.length > 1 &&
    (locales as readonly string[]).includes(segments[1])
  ) {
    const rest = "/" + segments.slice(2).join("/");
    return rest === "/" ? "/" : rest;
  }
  return p;
}

/**
 * Derives a fallback drawer variant from the current pathname so the drawer
 * shows sensible content even if a page opened it without calling openWith().
 *
 * Fallbacks never set ids we can't recover from the path alone — `/chat/[id]`
 * and `/exchange/[id]` fall back to `home` because the drawer cannot safely
 * render a variant that needs those ids. Pages that want the chat/exchange
 * variants must call openWith({...}) themselves.
 */
function variantFromPath(rawPath: string): DrawerVariant {
  const pathname = stripLocale(rawPath);
  if (pathname === "/matching" || pathname.startsWith("/matching/")) {
    return { type: "matching" };
  }
  if (pathname === "/explore" || pathname.startsWith("/explore/")) {
    return { type: "explore" };
  }
  return { type: "home" };
}

export function UnifiedSideDrawer() {
  const pathname = usePathname();
  const open = useDrawerStore((s) => s.open);
  const storedVariant = useDrawerStore((s) => s.variant);
  const close = useDrawerStore((s) => s.close);

  const effectiveVariant = useMemo<DrawerVariant>(() => {
    // chat and exchange variants carry required IDs that can't be derived
    // from the path, so the stored variant is always authoritative for them.
    if (storedVariant?.type === "chat" || storedVariant?.type === "exchange") {
      return storedVariant;
    }
    // For every other case the current path determines which drawer to show:
    // /explore → filter drawer, /matching → matching drawer, else → home drawer.
    return variantFromPath(pathname);
  }, [storedVariant, pathname]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={close}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Side drawer"
        className={`fixed left-0 top-0 z-50 flex h-full w-[320px] max-w-full flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out dark:bg-zinc-900 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {effectiveVariant.type === "home" && <DrawerHome />}
        {effectiveVariant.type === "chat" && (
          <DrawerChat conversationId={effectiveVariant.conversationId} />
        )}
        {effectiveVariant.type === "explore" && <DrawerExplore />}
        {effectiveVariant.type === "matching" && <DrawerMatching />}
        {effectiveVariant.type === "exchange" && (
          <DrawerExchange swapId={effectiveVariant.swapId} />
        )}
      </aside>
    </>
  );
}

export default UnifiedSideDrawer;
