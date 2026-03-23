"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Coins } from "lucide-react";

interface TokenToastMessage {
  id: string;
  amount: number;
  reason: string;
}

// Global event bus for token toast notifications
const listeners = new Set<(msg: TokenToastMessage) => void>();

export function showTokenToast(amount: number, reason: string) {
  const msg: TokenToastMessage = { id: `${Date.now()}-${Math.random()}`, amount, reason };
  listeners.forEach((fn) => fn(msg));
}

export function TokenToast() {
  const tToast = useTranslations("tokenToast");
  const [toasts, setToasts] = useState<TokenToastMessage[]>([]);

  const addToast = useCallback((msg: TokenToastMessage) => {
    setToasts((prev) => [...prev, msg]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== msg.id));
    }, 4000);
  }, []);

  useEffect(() => {
    listeners.add(addToast);
    return () => { listeners.delete(addToast); };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="animate-in slide-in-from-bottom-2 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-lg dark:border-amber-800 dark:bg-amber-950/90"
          style={{
            animation: "slideUp 0.3s ease-out, fadeOut 0.5s ease-in 3.5s forwards",
          }}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
            <Coins className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-800 dark:text-amber-200">
              +{toast.amount} tokens
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              {tToast.has(toast.reason) ? tToast(toast.reason) : toast.reason}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
