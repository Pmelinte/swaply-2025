"use client";

import { useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { useDrawerStore, type DrawerVariant } from "@/lib/state/drawerStore";
import { getDrawerVariantForPathname } from "@/lib/drawer/routeToDrawerVariant";
import DrawerHome from "./variants/DrawerHome";
import DrawerChat from "./variants/DrawerChat";
import DrawerExplore from "./variants/DrawerExplore";
import DrawerMatching from "./variants/DrawerMatching";
import DrawerExchange from "./variants/DrawerExchange";
import DrawerContextualPage from "./variants/DrawerContextualPage";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function getFocusableElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => element.getAttribute("aria-hidden") !== "true",
  );
}

export function UnifiedSideDrawer() {
  const t = useTranslations();
  const pathname = usePathname();
  const open = useDrawerStore((s) => s.open);
  const storedVariant = useDrawerStore((s) => s.variant);
  const close = useDrawerStore((s) => s.close);
  const drawerRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const effectiveVariant = useMemo<DrawerVariant>(() => {
    // chat and exchange variants carry required IDs that can't be derived
    // from the path, so the stored variant is always authoritative for them.
    if (storedVariant?.type === "chat" || storedVariant?.type === "exchange") {
      return storedVariant;
    }

    return getDrawerVariantForPathname(pathname);
  }, [storedVariant, pathname]);

  // Move focus into the drawer on open and restore it to the opener on close.
  useEffect(() => {
    if (open) {
      const activeElement = document.activeElement;
      previousFocusRef.current = activeElement instanceof HTMLElement ? activeElement : null;

      const frame = window.requestAnimationFrame(() => {
        const drawer = drawerRef.current;
        if (!drawer) return;
        const [firstFocusable] = getFocusableElements(drawer);
        (firstFocusable ?? drawer).focus();
      });

      return () => window.cancelAnimationFrame(frame);
    }

    const previousFocus = previousFocusRef.current;
    if (previousFocus?.isConnected) {
      previousFocus.focus();
    }
    previousFocusRef.current = null;
  }, [open]);

  // Close on Escape and keep keyboard focus inside the modal drawer.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }

      if (event.key !== "Tab") return;

      const drawer = drawerRef.current;
      if (!drawer) return;

      const focusableElements = getFocusableElements(drawer);
      if (focusableElements.length === 0) {
        event.preventDefault();
        drawer.focus();
        return;
      }

      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey) {
        if (activeElement === firstFocusable || !drawer.contains(activeElement)) {
          event.preventDefault();
          lastFocusable.focus();
        }
        return;
      }

      if (activeElement === lastFocusable || !drawer.contains(activeElement)) {
        event.preventDefault();
        firstFocusable.focus();
      }
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
        ref={drawerRef}
        id="swaply-contextual-drawer"
        role="dialog"
        aria-modal={open ? "true" : undefined}
        aria-hidden={open ? undefined : "true"}
        aria-label={t("nav.contextMenu")}
        tabIndex={-1}
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
