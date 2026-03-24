"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { loadStripe, type Stripe as StripeJs } from "@stripe/stripe-js";
import { Zap, CheckCircle, Loader2, AlertCircle, Clock } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";

const BOOST_OPTIONS = [
  { duration: "24h", label: "Boost 24h", price: "5 RON", durationHours: 24 },
  { duration: "72h", label: "Boost 72h", price: "12 RON", durationHours: 72 },
  { duration: "7d", label: "Boost 7 zile", price: "25 RON", durationHours: 168 },
] as const;

interface BoostPanelProps {
  itemId: string;
  userId: string;
  userEmail: string;
}

type BoostStatus = "idle" | "loading" | "awaiting_payment" | "processing" | "success" | "error";

interface ActiveBoost {
  expires_at: string;
  duration_hours: number;
}

let stripePromise: Promise<StripeJs | null> | null = null;
function getStripeJs() {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    stripePromise = key ? loadStripe(key) : Promise.resolve(null);
  }
  return stripePromise;
}

function getInitialBoostStatus(): BoostStatus {
  if (typeof window === "undefined") return "idle";
  const params = new URLSearchParams(window.location.search);
  if (params.get("boost") === "success") {
    // Clean up URL
    const url = new URL(window.location.href);
    url.searchParams.delete("boost");
    window.history.replaceState({}, "", url.toString());
    return "success";
  }
  return "idle";
}

export function BoostPanel({ itemId, userId, userEmail }: BoostPanelProps) {
  const [status, setStatus] = useState<BoostStatus>(getInitialBoostStatus);
  const [error, setError] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);
  const [activeBoost, setActiveBoost] = useState<ActiveBoost | null>(null);

  // Check for existing active boost
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    let cancelled = false;

    supabase
      .from("item_boosts")
      .select("expires_at, duration_hours")
      .eq("item_id", itemId)
      .eq("stripe_payment_status", "succeeded")
      .gt("expires_at", new Date().toISOString())
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) {
          setActiveBoost(data as ActiveBoost);
        }
      });

    return () => { cancelled = true; };
  }, [itemId]);

  const handleBoost = useCallback(async (duration: string) => {
    setStatus("loading");
    setError(null);
    setSelectedDuration(duration);

    try {
      // 1. Create PaymentIntent via our API
      const res = await fetch("/api/payments/boost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, userId, userEmail, duration }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Eroare la crearea plății");
        setStatus("error");
        return;
      }

      // 2. Redirect to Stripe payment page
      setStatus("awaiting_payment");
      const stripe = await getStripeJs();
      if (!stripe) {
        setError("Stripe nu este disponibil");
        setStatus("error");
        return;
      }

      const { error: redirectError } = await stripe.confirmPayment({
        clientSecret: data.clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}${window.location.pathname}?boost=success`,
        },
      });

      if (redirectError) {
        // User closed the payment sheet or card was declined
        if (redirectError.type !== "validation_error") {
          setError(redirectError.message ?? "Plata a eșuat");
        }
        setStatus("idle");
        return;
      }

      // If we get here without redirect, payment succeeded
      setStatus("success");
    } catch (err) {
      console.error("[BoostPanel] Error:", err);
      setError("Eroare neașteptată. Încearcă din nou.");
      setStatus("error");
    }
  }, [itemId, userId, userEmail]);

  // Compute hours left from active boost (avoid Date.now() in render)
  const [now] = useState(() => Date.now());
  const hoursLeft = useMemo(() => {
    if (!activeBoost) return 0;
    const expiresAt = new Date(activeBoost.expires_at).getTime();
    return Math.max(0, Math.ceil((expiresAt - now) / 3600000));
  }, [activeBoost, now]);

  // Active boost display
  if (activeBoost) {
    const expiresAt = new Date(activeBoost.expires_at);

    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-800 dark:bg-amber-900/20">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">
            Boost activ
          </span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300">
          <Clock className="h-3 w-3" />
          {hoursLeft > 0
            ? `Expiră în ${hoursLeft}h (${expiresAt.toLocaleDateString("ro-RO")})`
            : "Boost-ul a expirat"}
        </div>
      </div>
    );
  }

  // Success state
  if (status === "success") {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50/80 p-4 dark:border-green-800 dark:bg-green-900/20">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <span className="text-sm font-semibold text-green-800 dark:text-green-200">
            Boost activat cu succes!
          </span>
        </div>
        <p className="mt-1 text-xs text-green-700 dark:text-green-300">
          Obiectul tău va apărea în top în listări.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-gradient-to-br from-amber-50/50 to-orange-50/50 p-4 shadow-sm dark:border-zinc-700 dark:from-amber-950/20 dark:to-orange-950/20">
      <div className="mb-3 flex items-center gap-2">
        <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
          Crește vizibilitatea
        </span>
      </div>
      <p className="mb-3 text-xs text-zinc-600 dark:text-zinc-400">
        Obiectul tău va apărea primul în listări și va avea badge-ul &quot;Promovat&quot;.
      </p>

      {error && (
        <div className="mb-3 flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-2">
        {BOOST_OPTIONS.map((opt) => (
          <button
            key={opt.duration}
            type="button"
            disabled={status === "loading" || status === "awaiting_payment"}
            onClick={() => handleBoost(opt.duration)}
            className="flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium text-zinc-800 transition hover:border-amber-300 hover:bg-amber-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-amber-600 dark:hover:bg-amber-900/20"
          >
            <span className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              {opt.label}
            </span>
            <span className="flex items-center gap-1.5">
              {status === "loading" && selectedDuration === opt.duration && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )}
              <span className="font-bold text-amber-700 dark:text-amber-400">
                {opt.price}
              </span>
            </span>
          </button>
        ))}
      </div>

      <p className="mt-2 text-center text-[10px] text-zinc-400 dark:text-zinc-500">
        Plata securizată prin Stripe. Visa, Mastercard, Apple Pay, Google Pay.
      </p>
    </div>
  );
}
