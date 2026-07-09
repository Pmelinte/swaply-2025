"use client";

import { useEffect, useMemo } from "react";
import { usePathname } from "@/i18n/navigation";
import { useDrawerStore, type DrawerVariant } from "@/lib/state/drawerStore";
import { getDrawerVariantForPathname } from "@/lib/drawer/routeToDrawerVariant";
import DrawerHome from "./variants/DrawerHome";
import DrawerChat from "./variants/DrawerChat";
import DrawerExplore from "./variants/DrawerExplore";
import DrawerMatching from "./variants/DrawerMatching";
import DrawerExchange from "./variants/DrawerExchange";
import DrawerContextualPage from "./variants/DrawerContextualPage";

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

    return getDrawerVariantForPathname(pathname);
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
