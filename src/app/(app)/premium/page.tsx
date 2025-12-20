"use client";

import { useState } from "react";

const PLANS = [
  { id: "silver", label: "Silver", description: "Acces premium de bază" },
  { id: "gold", label: "Gold", description: "Acces extins + highlights" },
  { id: "platinum", label: "Platinum", description: "Tot + suport prioritar" },
] as const;

export default function PremiumPage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const startCheckout = async (plan: string) => {
    try {
      setLoadingPlan(plan);
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        alert(data?.message ?? data?.error ?? "Nu se poate porni checkout-ul.");
        return;
      }
      window.location.href = data.url;
    } catch {
      alert("Nu se poate porni checkout-ul.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Premium</h1>
      <p className="text-sm text-muted-foreground">
        Abonamentele activează account_type=premium după confirmarea Stripe.
      </p>

      <div className="grid md:grid-cols-3 gap-4">
        {PLANS.map((plan) => (
          <div key={plan.id} className="border rounded-lg p-4 bg-white space-y-3">
            <div className="text-lg font-semibold">{plan.label}</div>
            <div className="text-sm text-gray-600">{plan.description}</div>
            <button
              className="w-full rounded bg-black text-white px-4 py-2 text-sm"
              onClick={() => startCheckout(plan.id)}
              disabled={loadingPlan === plan.id}
            >
              {loadingPlan === plan.id ? "Se deschide…" : "Activează"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
