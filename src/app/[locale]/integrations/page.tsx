"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SectionCard, Pill } from "@/components/ui-custom";
import {
  Package, Plane, Car, Train, Shield, Box, HandCoins, Hotel,
  Truck, Globe, ExternalLink, CheckCircle, AlertCircle, Clock,
} from "lucide-react";

// ── Integration definitions ──

type IntegrationStatus = "active" | "needs_key" | "coming_soon";
type Category = "all" | "shipping" | "travel" | "finance" | "services";

interface Integration {
  id: string;
  name: string;
  description: string;
  category: Category;
  icon: React.ReactNode;
  status: IntegrationStatus;
  endpoint?: string;
  envVars: string[];
  revenueModel: string;
  docsUrl?: string;
  features: string[];
}

const INTEGRATIONS: Integration[] = [
  // ── Shipping ──
  {
    id: "domestic-couriers",
    name: "Domestic Couriers",
    description: "Country-specific courier services — auto-detected per user location",
    category: "shipping",
    icon: <Truck className="h-5 w-5" />,
    status: "active",
    endpoint: "POST /api/courier/estimate, /api/courier/create-awb, /api/courier/track",
    envVars: ["FANCOURIER_CLIENT_ID", "SAMEDAY_API_KEY", "CARGUS_API_KEY"],
    revenueModel: "8% markup on shipping",
    features: ["Cost estimation", "AWB creation", "Package tracking", "40+ countries supported"],
  },
  {
    id: "country-services",
    name: "Country Service Registry",
    description: "Per-country courier, payment, and transport configuration for 40+ countries",
    category: "shipping",
    icon: <Truck className="h-5 w-5" />,
    status: "active",
    endpoint: "POST /api/courier/estimate, /api/courier/create-awb",
    envVars: ["CARGUS_API_KEY"],
    revenueModel: "8% markup pe transport",
    features: ["Estimare cost", "Creare AWB", "Tracking"],
  },
  {
    id: "dhl",
    name: "DHL Express",
    description: "International express shipping — 220+ countries",
    category: "shipping",
    icon: <Globe className="h-5 w-5" />,
    status: "needs_key",
    endpoint: "POST /api/dhl/rates, /api/dhl/ship, GET /api/dhl/track",
    envVars: ["DHL_API_KEY", "DHL_API_SECRET", "DHL_ACCOUNT_NUMBER"],
    revenueModel: "8% markup on shipping",
    docsUrl: "https://developer.dhl.com",
    features: ["Price quote", "Create shipment", "International tracking", "PDF label"],
  },
  {
    id: "packaging",
    name: "Packaging & Swaply Kits",
    description: "Packaging recommendations, suppliers and branded Swaply kits",
    category: "shipping",
    icon: <Box className="h-5 w-5" />,
    status: "active",
    endpoint: "POST /api/packaging/recommend",
    envVars: ["PACKAGING_AFFILIATE_ID"],
    revenueModel: "5-8% affiliate + 40-60% margin on own kits",
    features: ["Size recommendation", "Supplier links", "Swaply Eco Kits", "Packaging guide"],
  },

  // ── Travel ──
  {
    id: "flights",
    name: "Flight Tickets",
    description: "Kiwi.com, Skyscanner, Google Flights — search and affiliate",
    category: "travel",
    icon: <Plane className="h-5 w-5" />,
    status: "needs_key",
    endpoint: "POST /api/travel/flights",
    envVars: ["KIWI_API_KEY", "KIWI_AFFILIATE_ID", "SKYSCANNER_AFFILIATE_ID"],
    revenueModel: "CPA €3-8/booking (Kiwi), CPC €0.15-0.40 (Skyscanner)",
    docsUrl: "https://tequila.kiwi.com",
    features: ["Flight search", "Price comparison", "Affiliate links", "Price estimate"],
  },
  {
    id: "accommodation",
    name: "Booking / Airbnb / VRBO",
    description: "Accommodation for home swaps — affiliate links",
    category: "travel",
    icon: <Hotel className="h-5 w-5" />,
    status: "active",
    endpoint: "POST /api/travel/accommodation",
    envVars: ["BOOKING_AFFILIATE_ID", "AIRBNB_AFFILIATE_ID", "VRBO_AFFILIATE_ID"],
    revenueModel: "25-40% Booking commission, 2-3% Airbnb",
    features: ["Search links", "Location suggestions", "3 platforms integrated"],
  },
  {
    id: "car-rental",
    name: "Car Rental",
    description: "Rentalcars, DiscoverCars, AutoEurope — affiliate links",
    category: "travel",
    icon: <Car className="h-5 w-5" />,
    status: "active",
    endpoint: "POST /api/travel/car-rental",
    envVars: ["RENTALCARS_AFFILIATE_ID", "DISCOVERCARS_AFFILIATE_ID", "AUTOEUROPE_AFFILIATE_ID"],
    revenueModel: "4-8% commission per booking",
    features: ["3 provider links", "Price estimate", "Destination suggestions"],
  },
  {
    id: "ground-transport",
    name: "Ground Transport",
    description: "FlixBus, BlaBlaCar, Omio, Rome2rio — local railways per country",
    category: "travel",
    icon: <Train className="h-5 w-5" />,
    status: "active",
    endpoint: "POST /api/travel/ground-transport",
    envVars: ["FLIXBUS_AFFILIATE_ID", "OMIO_AFFILIATE_ID", "BLABLACAR_AFFILIATE_ID"],
    revenueModel: "3-5% CPA per booking",
    features: ["Bus", "Train", "Carpooling", "Multi-modal comparison"],
  },
  {
    id: "ridehailing",
    name: "Bolt / Uber / Grab",
    description: "Deep links to ride-hailing for swap meetups worldwide",
    category: "travel",
    icon: <Car className="h-5 w-5" />,
    status: "active",
    endpoint: "Integrated in swap page",
    envVars: ["BOLT_PARTNER_ID", "UBER_AFFILIATE_TOKEN"],
    revenueModel: "5-8% Bolt, CPA $3-5 Uber",
    features: ["Deep link Bolt", "Deep link Uber", "Waze navigation", "Grab (Asia)"],
  },

  // ── Finance ──
  {
    id: "stripe",
    name: "Stripe",
    description: "Card payments, Apple Pay, Google Pay — tokens and subscriptions",
    category: "finance",
    icon: <HandCoins className="h-5 w-5" />,
    status: "active",
    endpoint: "POST /api/payments/checkout, /api/payments/webhook",
    envVars: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
    revenueModel: "Direct token & subscription sales",
    features: ["Buy tokens", "Subscriptions", "Boost & Featured", "Swap insurance"],
  },
  {
    id: "paypal",
    name: "PayPal",
    description: "Alternative payments — tokens and subscriptions via PayPal",
    category: "finance",
    icon: <HandCoins className="h-5 w-5" />,
    status: "needs_key",
    endpoint: "POST /api/payments/paypal/create, /api/payments/paypal/capture",
    envVars: ["PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET", "PAYPAL_WEBHOOK_ID"],
    revenueModel: "Direct token & subscription sales",
    docsUrl: "https://developer.paypal.com",
    features: ["Buy tokens", "Recurring subscriptions", "Webhooks"],
  },
  {
    id: "escrow",
    name: "Escrow.com",
    description: "Secure transactions with trusted third party",
    category: "finance",
    icon: <Shield className="h-5 w-5" />,
    status: "needs_key",
    endpoint: "POST /api/escrow/create, /api/escrow/action",
    envVars: ["ESCROW_API_KEY", "ESCROW_API_EMAIL"],
    revenueModel: "3.5% commission on declared value",
    docsUrl: "https://www.escrow.com/api/docs",
    features: ["Create transaction", "Inspection flow", "Actions (fund/ship/receive/accept)", "Full protection"],
  },

  // ── Services ──
  {
    id: "insurance",
    name: "Insurance (XCover)",
    description: "Shipping, travel, and property insurance",
    category: "services",
    icon: <Shield className="h-5 w-5" />,
    status: "needs_key",
    endpoint: "POST /api/insurance/quote, /api/insurance/purchase",
    envVars: ["XCOVER_API_KEY", "XCOVER_PARTNER_ID"],
    revenueModel: "15% commission on premiums",
    features: ["Shipping quote", "Travel quote", "Property quote", "Policy purchase", "Claims"],
  },
];

// ── Status helpers ──

function StatusBadge({ status, t }: { status: IntegrationStatus; t: (key: string) => string }) {
  switch (status) {
    case "active":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          <CheckCircle className="h-3 w-3" /> {t("statusActive")}
        </span>
      );
    case "needs_key":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
          <AlertCircle className="h-3 w-3" /> {t("statusNeedsKey")}
        </span>
      );
    case "coming_soon":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          <Clock className="h-3 w-3" /> {t("statusComingSoon")}
        </span>
      );
  }
}

// ── Page Component ──

export default function IntegrationsPage() {
  const t = useTranslations("integrations");
  const [category, setCategory] = useState<Category>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const CATEGORY_LABELS: Record<Category, { label: string; icon: React.ReactNode }> = {
    all: { label: t("categoryAll"), icon: <Globe className="h-4 w-4" /> },
    shipping: { label: t("categoryShipping"), icon: <Package className="h-4 w-4" /> },
    travel: { label: t("categoryTravel"), icon: <Plane className="h-4 w-4" /> },
    finance: { label: t("categoryFinance"), icon: <HandCoins className="h-4 w-4" /> },
    services: { label: t("categoryServices"), icon: <Shield className="h-4 w-4" /> },
  };

  const filtered = category === "all"
    ? INTEGRATIONS
    : INTEGRATIONS.filter((i) => i.category === category);

  const counts = {
    total: INTEGRATIONS.length,
    active: INTEGRATIONS.filter((i) => i.status === "active").length,
    needsKey: INTEGRATIONS.filter((i) => i.status === "needs_key").length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {t("title")}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {t("subtitle")}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-200 bg-white/70 p-3 text-center dark:border-zinc-800 dark:bg-zinc-900/70">
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{counts.total}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("totalIntegrations")}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-center dark:border-emerald-900 dark:bg-emerald-950/30">
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{counts.active}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">{t("activeMockReady")}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-center dark:border-amber-900 dark:bg-amber-950/30">
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{counts.needsKey}</p>
          <p className="text-xs text-amber-600 dark:text-amber-400">{t("needsApiKey")}</p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              category === cat
                ? "bg-blue-600 text-white"
                : "bg-white/70 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900/70 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            {CATEGORY_LABELS[cat].icon}
            {CATEGORY_LABELS[cat].label}
          </button>
        ))}
      </div>

      {/* Integrations List */}
      <div className="space-y-3">
        {filtered.map((integration) => {
          const isExpanded = expanded === integration.id;

          return (
            <div
              key={integration.id}
              className="rounded-xl border border-zinc-200 bg-white/70 dark:border-zinc-800 dark:bg-zinc-900/70"
            >
              {/* Header row */}
              <button
                type="button"
                onClick={() => setExpanded(isExpanded ? null : integration.id)}
                className="flex w-full items-center gap-3 p-4 text-left"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                  {integration.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                      {integration.name}
                    </h3>
                    <StatusBadge status={integration.status} t={t} />
                  </div>
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {integration.description}
                  </p>
                </div>
                <span className={`text-zinc-400 transition ${isExpanded ? "rotate-180" : ""}`}>
                  ▾
                </span>
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Features */}
                    <div>
                      <p className="mb-1.5 text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                        {t("features")}
                      </p>
                      <ul className="space-y-1">
                        {integration.features.map((f) => (
                          <li key={f} className="flex items-center gap-1.5 text-sm text-zinc-700 dark:text-zinc-300">
                            <CheckCircle className="h-3 w-3 text-emerald-500" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Revenue */}
                    <div>
                      <p className="mb-1.5 text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                        {t("revenueModel")}
                      </p>
                      <p className="text-sm text-zinc-700 dark:text-zinc-300">
                        {integration.revenueModel}
                      </p>
                    </div>

                    {/* API Endpoint */}
                    {integration.endpoint && (
                      <div>
                        <p className="mb-1.5 text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                          {t("apiEndpoint")}
                        </p>
                        <code className="text-xs text-blue-600 dark:text-blue-400">
                          {integration.endpoint}
                        </code>
                      </div>
                    )}

                    {/* Env Vars */}
                    <div>
                      <p className="mb-1.5 text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                        {t("envVars")}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {integration.envVars.map((v) => (
                          <Pill key={v} color="zinc">{v}</Pill>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Docs link */}
                  {integration.docsUrl && (
                    <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                      <a
                        href={integration.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {t("apiDocs")}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info footer */}
      <SectionCard
        title={t("howItWorks")}
        description={t("howItWorksDesc")}
      >
        <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
          <p>
            <strong className="text-zinc-800 dark:text-zinc-200">{t("activeMockReady")}</strong> — {t("activeMockDesc")}
          </p>
          <p>
            <strong className="text-zinc-800 dark:text-zinc-200">{t("statusNeedsKey")}</strong> — {t("needsKeyDesc")}
          </p>
          <p>
            <strong className="text-zinc-800 dark:text-zinc-200">{t("affiliateLinks")}</strong> — {t("affiliateDesc")}
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
