"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { sendGAEvent } from "@next/third-parties/google";
import { X, UserPlus } from "lucide-react";

interface AuthGateModalProps {
  children: React.ReactNode;
  returnTo?: string;
  /** GA4 event name to fire when the gate is triggered */
  gaEvent?: string;
}

/**
 * Wraps an interaction button. On click, shows a modal prompting
 * the guest to create a free account instead of performing the action.
 */
export function AuthGateModal({ children, returnTo = "/login", gaEvent }: AuthGateModalProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("guest");

  const handleOpen = () => {
    setOpen(true);
    if (gaEvent) {
      sendGAEvent("event", gaEvent);
    }
    sendGAEvent("event", "register_from_object_page");
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        className="relative cursor-pointer"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleOpen();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleOpen();
          }
        }}
      >
        <div className="pointer-events-none">{children}</div>
        <div className="absolute inset-0 rounded-xl bg-white/60 backdrop-blur-[2px] dark:bg-zinc-900/60" />
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-800">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-700"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
                <UserPlus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                {t("modalTitle")}
              </h3>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                {t("modalDescription")}
              </p>
              <Link
                href={returnTo}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <UserPlus className="h-4 w-4" />
                {t("modalCta")}
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-2 text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                {t("modalDismiss")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
