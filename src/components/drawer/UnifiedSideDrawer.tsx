"use client";

import { useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { usePathname } from "@/i18n/navigation";
import { useDrawerStore, type DrawerVariant } from "@/lib/state/drawerStore";
import DrawerHome from "./variants/DrawerHome";
import DrawerChat from "./variants/DrawerChat";
import DrawerExplore from "./variants/DrawerExplore";
import DrawerMatching from "./variants/DrawerMatching";
import DrawerExchange from "./variants/DrawerExchange";

/**
 * Derives a fallback drawer variant from the current pathname so the drawer
 * shows sensible content even if a page opened it without calling openWith().
 *
 * Fallbacks never set ids we can't recover from the path alone — `/chat/[id]`
 * and `/exchange/[id]` fall back to `home` because the drawer cannot safely
 * render a variant that needs those ids. Pages that want the chat/exchange
 * variants must call openWith({...}) themselves.
 */
function variantFromPath(pathname: string): DrawerVariant {
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

  const effectiveVariant = useMemo<DrawerVariant>(
    () => storedVariant ?? variantFromPath(pathname),
    [storedVariant, pathname],
  );

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
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {effectiveVariant.type}
          </span>
          <button
            type="button"
            onClick={close}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label="Close drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {effectiveVariant.type === "home" && <DrawerHome />}
          {effectiveVariant.type === "chat" && (
            <DrawerChat conversationId={effectiveVariant.conversationId} />
          )}
          {effectiveVariant.type === "explore" && <DrawerExplore />}
          {effectiveVariant.type === "matching" && <DrawerMatching />}
          {effectiveVariant.type === "exchange" && (
            <DrawerExchange swapId={effectiveVariant.swapId} />
          )}
        </div>
      </aside>
    </>
  );
}

export default UnifiedSideDrawer;
