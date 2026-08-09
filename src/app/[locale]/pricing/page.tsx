"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { ExternalLink, Loader2 } from "lucide-react";
import { useAppState } from "@/lib/state";

export default function PricingPage() {
  const { user, subscription } = useAppState();
  const [loading, setLoading] = useState(false);

  const stripeCustomerId = subscription?.stripeCustomerId;

  async function handleManageSubscription() {
    if (!stripeCustomerId) return;

    setLoading(true);
    try {
      const res = await fetch("/api/payments/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stripeCustomerId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Subscription portal error:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
          Pricing
        </h1>
        <p className="mt-2 text-base text-zinc-500 dark:text-zinc-400">
          Core swapping is currently available without a published paid-plan price.
        </p>
      </div>

      <div className="mx-auto max-w-2xl rounded-2xl border-2 border-blue-500 bg-white p-6 shadow-sm dark:bg-zinc-800">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          Core access
        </h2>
        <p className="mt-2 text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
          Free
        </p>
        <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          Swaply does not charge a Swaply commission on the basic user-to-user swap itself.
          Third-party services, delivery, travel, payment or other optional services may have
          their own costs when and if they are separately offered.
        </p>

        {!user && (
          <Link
            href="/register"
            className="mt-6 inline-flex rounded-full bg-blue-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Create account
          </Link>
        )}
      </div>

      <div className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-amber-50/60 p-6 dark:border-amber-900 dark:bg-amber-950/20">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
          Paid plans
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          No new Premium or Business subscription price is publicly offered here until the
          commercial plan, provider configuration, checkout flow and entitlements have been
          approved and verified in Production.
        </p>
      </div>

      {stripeCustomerId && (
        <div className="mx-auto max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            Existing subscription
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            An existing billing customer can open the provider portal when it is available.
          </p>
          <button
            type="button"
            onClick={handleManageSubscription}
            disabled={loading}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
            Manage existing subscription
          </button>
        </div>
      )}
    </div>
  );
}