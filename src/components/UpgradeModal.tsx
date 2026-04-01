"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { X, Crown, Lock, Loader2, Sparkles } from "lucide-react";
import { useAppState } from "@/lib/state";
import { requiredPlan, PLAN_INFO, type SubscriptionFeature } from "@/lib/utils/subscriptions";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  feature: SubscriptionFeature;
  /** Optional custom message to display */
  message?: string;
}

/**
 * Modal shown when a Free user tries to access a Premium/Platinum feature.
 * Redirects to Stripe Checkout for the required plan.
 */
export function UpgradeModal({ open, onClose, feature, message }: UpgradeModalProps) {
  const { user } = useAppState();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [loading, setLoading] = useState(false);

  const required = requiredPlan(feature);
  const planInfo = PLAN_INFO[required];

  // Sync open prop with dialog element
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open]);

  const handleUpgrade = useCallback(async () => {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "subscription",
          planId: required,
          interval: "monthly",
          userId: user.id,
          userEmail: user.email,
          returnPage: "pricing",
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Upgrade checkout error:", err);
    } finally {
      setLoading(false);
    }
  }, [user, required]);

  return (
    <dialog
      ref={dialogRef}
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
      className="mx-auto w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl backdrop:bg-black/40 backdrop:backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-800"
      onClose={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-700"
        aria-label="Inchide"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
          <Lock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
        </div>

        <h3 id="upgrade-modal-title" className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
          Functie {planInfo.name}
        </h3>

        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          {message ?? `Upgrade la ${planInfo.name} pentru acces nelimitat la aceasta functionalitate.`}
        </p>

        {/* Plan highlight */}
        <div className="mt-4 w-full rounded-xl border border-amber-200 bg-amber-50/80 p-3 dark:border-amber-800 dark:bg-amber-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                {planInfo.name}
              </span>
            </div>
            <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
              {planInfo.priceLabel}
            </span>
          </div>
          {required === "premium" && (
            <ul className="mt-2 space-y-1 text-left text-xs text-zinc-600 dark:text-zinc-400">
              <li className="flex items-center gap-1"><Sparkles className="h-3 w-3 text-amber-500" /> Articole nelimitate</li>
              <li className="flex items-center gap-1"><Sparkles className="h-3 w-3 text-amber-500" /> Matching prioritar</li>
              <li className="flex items-center gap-1"><Sparkles className="h-3 w-3 text-amber-500" /> Analytics & fara reclame</li>
              <li className="flex items-center gap-1"><Sparkles className="h-3 w-3 text-amber-500" /> 50 tokens/luna</li>
            </ul>
          )}
          {required === "platinum" && (
            <ul className="mt-2 space-y-1 text-left text-xs text-zinc-600 dark:text-zinc-400">
              <li className="flex items-center gap-1"><Sparkles className="h-3 w-3 text-amber-500" /> Tot din Premium +</li>
              <li className="flex items-center gap-1"><Sparkles className="h-3 w-3 text-amber-500" /> Pin pe harta & badge</li>
              <li className="flex items-center gap-1"><Sparkles className="h-3 w-3 text-amber-500" /> Suport prioritar</li>
              <li className="flex items-center gap-1"><Sparkles className="h-3 w-3 text-amber-500" /> Tokens nelimitate</li>
            </ul>
          )}
        </div>

        <button
          type="button"
          onClick={handleUpgrade}
          disabled={loading}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Crown className="h-4 w-4" />
          )}
          Upgrade acum — {planInfo.priceLabel}
        </button>

        <button
          type="button"
          onClick={onClose}
          className="mt-2 text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          Mai tarziu
        </button>
      </div>
    </dialog>
  );
}

/**
 * Hook to manage upgrade modal state.
 */
export function useUpgradeModal() {
  const [modalState, setModalState] = useState<{
    open: boolean;
    feature: SubscriptionFeature;
    message?: string;
  }>({ open: false, feature: "browse" });

  const showUpgrade = useCallback((feature: SubscriptionFeature, message?: string) => {
    setModalState({ open: true, feature, message });
  }, []);

  const closeUpgrade = useCallback(() => {
    setModalState((prev) => ({ ...prev, open: false }));
  }, []);

  const upgradeModal = (
    <UpgradeModal
      open={modalState.open}
      onClose={closeUpgrade}
      feature={modalState.feature}
      message={modalState.message}
    />
  );

  return { showUpgrade, closeUpgrade, upgradeModal };
}
