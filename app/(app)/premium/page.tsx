"use client";

import { useState } from "react";

type CheckoutResponse =
  | { ok: true; checkoutUrl: string }
  | { ok: false; error: string; details?: string };

export default function PremiumPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data: CheckoutResponse = await res.json();

      if (!res.ok || !("ok" in data) || data.ok === false) {
        setError(data?.error ?? "Checkout indisponibil.");
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setError("Checkout indisponibil.");
      }
    } catch (err: any) {
      setError(err?.message ?? "Eroare la inițierea plății.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Premium</h1>
        <p className="text-sm text-gray-600">
          Activează contul Premium pentru match-uri boostate, vizibilitate
          crescută și acces extins la API.
        </p>
      </header>

      <div className="rounded-xl border p-6 space-y-4 bg-white">
        <h2 className="text-xl font-semibold">Plan Premium</h2>
        <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
          <li>Boost în rezultatele de matching</li>
          <li>Acces API extins (plan paid)</li>
          <li>Badge Premium pe profil</li>
        </ul>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={startCheckout}
          disabled={loading}
          className="px-4 py-2 rounded-md bg-black text-white disabled:opacity-60"
        >
          {loading ? "Se deschide Stripe…" : "Activează Premium"}
        </button>
      </div>
    </div>
  );
}
