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
import DrawerContextualPage from "./variants/DrawerContextualPage";

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
 * Conversation/exchange detail pages may still pass richer variants with ids.
 * Major public pages get contextual variants so the hamburger is not a
 * duplicated global navigation menu.
 */
function variantFromPath(rawPath: string): DrawerVariant {
  const pathname = stripLocale(rawPath);

  if (pathname === "/objects" || pathname.startsWith("/objects/")) {
    return { type: "contextual", page: "objects" };
  }
  if (pathname === "/properties" || pathname.startsWith("/properties/")) {
    return { type: "contextual", page: "properties" };
  }
  if (pathname === "/services" || pathname.startsWith("/services/")) {
    return { type: "contextual", page: "services" };
  }
  if (pathname === "/events" || pathname.startsWith("/events/")) {
    return { type: "contextual", page: "events" };
  }
  if (pathname === "/matching" || pathname.startsWith("/matching/")) {
    return { type: "matching" };
  }
  if (pathname === "/messages" || pathname.startsWith("/messages/")) {
    return { type: "contextual", page: "messages" };
  }
  if (pathname === "/chat" || pathname.startsWith("/chat/")) {
    return { type: "contextual", page: "chat" };
  }
  if (pathname === "/exchange") {
    return { type: "contextual", page: "exchange" };
  }
  if (pathname === "/explore" || pathname.startsWith("/explore/")) {
    return { type: "explore" };
  }
  if (pathname === "/blog" || pathname.startsWith("/blog/")) {
    return { type: "contextual", page: "blog" };
  }
  if (pathname === "/stories" || pathname.startsWith("/stories/")) {
    return { type: "contextual", page: "stories" };
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
    // For every other case the current path determines which drawer to show.
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
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={close}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal={open ? "true" : undefined}
        aria-hidden={open ? undefined : "true"}
        aria-label="Side drawer"
        className={`fixed left-0 top-0 z-50 flex h-full w-[320px] max-w-full flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out dark:bg-zinc-900 sm:w-[380px] ${
          open ? "translate-x-0 pointer-events-auto" : "-translate-x-full pointer-events-none"
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
        {effectiveVariant.type === "contextual" && (
          <DrawerContextualPage page={effectiveVariant.page} />
        )}
      </aside>
    </>
  );
}

export default UnifiedSideDrawer;
