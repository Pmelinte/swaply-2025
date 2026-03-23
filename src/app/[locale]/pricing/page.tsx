"use client";

import { Suspense, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/ui";
import { Check, X, ChevronDown, ArrowRight, Crown, Building2, Star, Loader2, ExternalLink } from "lucide-react";
import { useAppState } from "@/lib/state";

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-zinc-100 dark:border-zinc-800">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-3 text-left"
      >
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{question}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <p className="pb-3 text-sm text-zinc-600 dark:text-zinc-300">{answer}</p>
      )}
    </div>
  );
}

const FREE_FEATURES = [
  { key: "free1", included: true },
  { key: "free2", included: true },
  { key: "free3", included: true },
  { key: "free4", included: true },
  { key: "free5", included: true },
  { key: "free6", included: false },
  { key: "free7", included: false },
  { key: "free8", included: false },
] as const;

const PREMIUM_FEATURES = [
  "premium1",
  "premium2",
  "premium3",
  "premium4",
  "premium5",
  "premium6",
] as const;

const BUSINESS_FEATURES = [
  "business1",
  "business2",
  "business3",
  "business4",
] as const;

export default function PricingPage() {
  return (
    <Suspense>
      <PricingContent />
    </Suspense>
  );
}

function PricingContent() {
  const t = useTranslations("pricing");
  const { user, subscription } = useAppState();
  const searchParams = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const paymentSuccess = searchParams.get("payment") === "success" || searchParams.get("subscription") === "success";
  const paymentCanceled = searchParams.get("payment") === "cancelled";

  const currentPlan = subscription?.planId ?? user?.badge ?? "free";
  const stripeCustomerId = subscription?.stripeCustomerId;

  async function handleUpgrade(planId: "premium" | "platinum") {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    setLoadingPlan(planId);
    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "subscription",
          planId,
          interval: "monthly",
          userId: user.id,
          userEmail: user.email,
          returnPage: "pricing",
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("Checkout error:", data.error);
      }
    } catch (err) {
      console.error("Checkout error:", err);
    } finally {
      setLoadingPlan(null);
    }
  }

  async function handleManageSubscription() {
    if (!stripeCustomerId) return;
    setLoadingPlan("manage");
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
    } catch (err) {
      console.error("Portal error:", err);
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Success / Cancel banners */}
      {paymentSuccess && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center text-sm font-medium text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300">
          Felicitari! Abonamentul tau a fost activat cu succes. Ai primit +100 tokens bonus!
        </div>
      )}
      {paymentCanceled && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-sm font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
          Plata a fost anulata. Poti incerca din nou oricand.
        </div>
      )}

      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
          {t("title")}
        </h1>
        <p className="mt-2 text-base text-zinc-500 dark:text-zinc-400">
          {t("subtitle")}
        </p>
      </div>

      {/* Plans */}
      <div className="grid gap-5 sm:grid-cols-3">
        {/* Free */}
        <div className="relative rounded-2xl border-2 border-blue-500 bg-white p-6 shadow-sm dark:bg-zinc-800">
          {currentPlan === "free" && (
            <span className="absolute -top-3 left-4 flex items-center gap-1 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-bold text-white">
              <Star className="h-3 w-3" />
              Plan actual
            </span>
          )}
          <h3 className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">
            {t("freeTitle")}
          </h3>
          <p className="mt-2">
            <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">0 lei</span>
            <span className="text-sm text-zinc-400"> / {t("month")}</span>
          </p>
          <ul className="mt-5 space-y-2.5">
            {FREE_FEATURES.map((f) => (
              <li key={f.key} className="flex items-start gap-2 text-sm">
                {f.included ? (
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                ) : (
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-zinc-300 dark:text-zinc-600" />
                )}
                <span className={f.included ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400 dark:text-zinc-500"}>
                  {t(f.key)}
                </span>
              </li>
            ))}
          </ul>
          {currentPlan === "free" ? (
            <span className="mt-6 block w-full rounded-full bg-zinc-100 py-2.5 text-center text-sm font-bold text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400">
              {t("freeButton")}
            </span>
          ) : (
            <Link
              href="/login"
              className="mt-6 block w-full rounded-full bg-blue-600 py-2.5 text-center text-sm font-bold text-white transition hover:bg-blue-700"
            >
              {t("freeButton")}
            </Link>
          )}
        </div>

        {/* Premium */}
        <div className="relative rounded-2xl border border-amber-300 bg-white p-6 shadow-sm dark:border-amber-700 dark:bg-zinc-800">
          {currentPlan === "premium" && (
            <span className="absolute -top-3 left-4 flex items-center gap-1 rounded-full bg-amber-500 px-3 py-0.5 text-xs font-bold text-white">
              <Star className="h-3 w-3" />
              Plan actual
            </span>
          )}
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {t("premiumTitle")}
            </h3>
          </div>
          <p className="mt-2">
            <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">19 lei</span>
            <span className="text-sm text-zinc-400"> / {t("month")}</span>
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            {t("premiumYearly")}
          </p>
          <p className="mt-4 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {t("premiumIncludes")}
          </p>
          <ul className="mt-3 space-y-2.5">
            {PREMIUM_FEATURES.map((key) => (
              <li key={key} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                <span className="text-zinc-700 dark:text-zinc-300">{t(key)}</span>
              </li>
            ))}
          </ul>
          {currentPlan === "premium" ? (
            <button
              type="button"
              onClick={handleManageSubscription}
              disabled={loadingPlan === "manage" || !stripeCustomerId}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border-2 border-amber-400 bg-amber-50 py-2.5 text-sm font-bold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50 dark:border-amber-600 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50"
            >
              {loadingPlan === "manage" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              Gestioneaza abonamentul
            </button>
          ) : currentPlan === "platinum" ? (
            <span className="mt-6 block w-full rounded-full bg-zinc-100 py-2.5 text-center text-sm font-bold text-zinc-400 dark:bg-zinc-700">
              Inclus in Platinum
            </span>
          ) : (
            <button
              type="button"
              onClick={() => handleUpgrade("premium")}
              disabled={loadingPlan === "premium"}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border-2 border-amber-400 bg-amber-50 py-2.5 text-sm font-bold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50 dark:border-amber-600 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50"
            >
              {loadingPlan === "premium" && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("premiumButton")}
            </button>
          )}
        </div>

        {/* Business / Platinum */}
        <div className="relative rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
          {currentPlan === "platinum" && (
            <span className="absolute -top-3 left-4 flex items-center gap-1 rounded-full bg-zinc-700 px-3 py-0.5 text-xs font-bold text-white dark:bg-zinc-500">
              <Star className="h-3 w-3" />
              Plan actual
            </span>
          )}
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {t("businessTitle")}
            </h3>
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {t("businessFor")}
          </p>
          <p className="mt-3">
            <span className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
              49 lei
            </span>
            <span className="text-sm text-zinc-400"> / {t("month")}</span>
          </p>
          <p className="mt-4 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {t("businessIncludes")}
          </p>
          <ul className="mt-3 space-y-2.5">
            {BUSINESS_FEATURES.map((key) => (
              <li key={key} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                <span className="text-zinc-700 dark:text-zinc-300">{t(key)}</span>
              </li>
            ))}
          </ul>
          {currentPlan === "platinum" ? (
            <button
              type="button"
              onClick={handleManageSubscription}
              disabled={loadingPlan === "manage" || !stripeCustomerId}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border-2 border-zinc-200 bg-zinc-50 py-2.5 text-sm font-bold text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
            >
              {loadingPlan === "manage" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              Gestioneaza abonamentul
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleUpgrade("platinum")}
              disabled={loadingPlan === "platinum"}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border-2 border-zinc-200 bg-zinc-50 py-2.5 text-sm font-bold text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
            >
              {loadingPlan === "platinum" && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("businessButton")}
            </button>
          )}
        </div>
      </div>

      {/* FAQ */}
      <SectionCard title={t("faqTitle")}>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          <FaqItem question={t("faqQ1")} answer={t("faqA1")} />
          <FaqItem question={t("faqQ2")} answer={t("faqA2")} />
          <FaqItem question={t("faqQ3")} answer={t("faqA3")} />
        </div>
      </SectionCard>

      {/* CTA */}
      {!user && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-200 bg-gradient-to-br from-blue-50 to-white p-8 text-center shadow-sm dark:border-zinc-700 dark:from-blue-950/30 dark:to-zinc-900">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-base font-bold text-white shadow-md transition hover:bg-blue-700"
          >
            {t("ctaButton")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
