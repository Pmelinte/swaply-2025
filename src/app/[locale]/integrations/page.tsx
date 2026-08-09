"use client";

import { useMemo, useState } from "react";
import {
  Box,
  Car,
  Globe,
  HandCoins,
  Hotel,
  Package,
  Plane,
  Shield,
  Train,
  Truck,
} from "lucide-react";

type IntegrationStatus = "foundation" | "disabled" | "planned";
type Category = "all" | "shipping" | "travel" | "finance" | "services";

type Integration = {
  id: string;
  name: string;
  description: string;
  category: Exclude<Category, "all">;
  icon: React.ReactNode;
  status: IntegrationStatus;
  note: string;
};

const INTEGRATIONS: Integration[] = [
  {
    id: "domestic-couriers",
    name: "Domestic courier foundation",
    description: "Courier-related application routes and data structures exist, but no universal live courier network is claimed.",
    category: "shipping",
    icon: <Truck className="h-5 w-5" />,
    status: "foundation",
    note: "Provider availability must be proven individually before it is described as live.",
  },
  {
    id: "dhl",
    name: "DHL Express",
    description: "Provider adapter foundation only.",
    category: "shipping",
    icon: <Globe className="h-5 w-5" />,
    status: "disabled",
    note: "No operational DHL integration is claimed in Production.",
  },
  {
    id: "packaging",
    name: "Packaging guidance",
    description: "Packaging recommendation foundation exists independently of any commercial supplier activation.",
    category: "shipping",
    icon: <Box className="h-5 w-5" />,
    status: "foundation",
    note: "Supplier or affiliate relationships are not presented as active without evidence.",
  },
  {
    id: "flights",
    name: "Flight providers",
    description: "Travel-provider concepts and adapters are planned for optional logistics support.",
    category: "travel",
    icon: <Plane className="h-5 w-5" />,
    status: "disabled",
    note: "No paid travel provider is activated by this page.",
  },
  {
    id: "accommodation",
    name: "Accommodation providers",
    description: "Accommodation-provider concepts are present as product foundation.",
    category: "travel",
    icon: <Hotel className="h-5 w-5" />,
    status: "planned",
    note: "No active affiliate or booking integration is claimed.",
  },
  {
    id: "car-rental",
    name: "Car rental providers",
    description: "Car-rental support is a planned optional integration area.",
    category: "travel",
    icon: <Car className="h-5 w-5" />,
    status: "planned",
    note: "No active commercial provider relationship is claimed.",
  },
  {
    id: "ground-transport",
    name: "Ground transport providers",
    description: "Ground-transport support is a planned optional integration area.",
    category: "travel",
    icon: <Train className="h-5 w-5" />,
    status: "planned",
    note: "No provider is represented as operational unless separately verified.",
  },
  {
    id: "ridehailing",
    name: "Ride-hailing links",
    description: "Ride-hailing deep-link concepts may be used where available.",
    category: "travel",
    icon: <Car className="h-5 w-5" />,
    status: "foundation",
    note: "A deep link is not described as a commercial integration.",
  },
  {
    id: "stripe",
    name: "Stripe billing foundation",
    description: "Billing routes exist, but no new paid plan is publicly offered until commercial configuration is approved and verified.",
    category: "finance",
    icon: <HandCoins className="h-5 w-5" />,
    status: "foundation",
    note: "Existing billing infrastructure does not by itself prove a live public paid plan.",
  },
  {
    id: "paypal",
    name: "PayPal",
    description: "Alternative payment provider foundation only.",
    category: "finance",
    icon: <HandCoins className="h-5 w-5" />,
    status: "disabled",
    note: "No operational PayPal offering is claimed.",
  },
  {
    id: "escrow",
    name: "Escrow provider concept",
    description: "Escrow is a planned optional provider capability, not a live Swaply protection service.",
    category: "finance",
    icon: <Shield className="h-5 w-5" />,
    status: "disabled",
    note: "Swaply does not claim live escrow protection in Production.",
  },
  {
    id: "insurance",
    name: "Insurance provider concept",
    description: "Insurance is a planned optional provider capability.",
    category: "services",
    icon: <Shield className="h-5 w-5" />,
    status: "disabled",
    note: "No insurance product or provider is activated by this page.",
  },
];

const CATEGORY_LABELS: Record<Category, { label: string; icon: React.ReactNode }> = {
  all: { label: "All", icon: <Globe className="h-4 w-4" /> },
  shipping: { label: "Shipping", icon: <Package className="h-4 w-4" /> },
  travel: { label: "Travel", icon: <Plane className="h-4 w-4" /> },
  finance: { label: "Finance", icon: <HandCoins className="h-4 w-4" /> },
  services: { label: "Services", icon: <Shield className="h-4 w-4" /> },
};

function statusClasses(status: IntegrationStatus) {
  if (status === "foundation") {
    return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300";
  }
  if (status === "disabled") {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300";
  }
  return "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
}

export default function IntegrationsPage() {
  const [category, setCategory] = useState<Category>("all");

  const filtered = useMemo(
    () =>
      category === "all"
        ? INTEGRATIONS
        : INTEGRATIONS.filter((integration) => integration.category === category),
    [category],
  );

  const foundationCount = INTEGRATIONS.filter((item) => item.status === "foundation").length;
  const disabledCount = INTEGRATIONS.filter((item) => item.status === "disabled").length;
  const plannedCount = INTEGRATIONS.filter((item) => item.status === "planned").length;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
          Integrations
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          This page is a capability register, not a list of live commercial partners. Foundation means application support exists; disabled means a provider is not operationally enabled; planned means future work.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900 dark:bg-blue-950/20">
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{foundationCount}</p>
          <p className="text-xs text-blue-700/80 dark:text-blue-300/80">Foundation</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900 dark:bg-amber-950/20">
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{disabledCount}</p>
          <p className="text-xs text-amber-700/80 dark:text-amber-300/80">Disabled</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
          <p className="text-2xl font-bold text-zinc-700 dark:text-zinc-200">{plannedCount}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Planned</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(CATEGORY_LABELS) as Category[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setCategory(key)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              category === key
                ? "bg-blue-600 text-white"
                : "bg-white text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            {CATEGORY_LABELS[key].icon}
            {CATEGORY_LABELS[key].label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((integration) => (
          <article
            key={integration.id}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {integration.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {integration.name}
                  </h2>
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${statusClasses(integration.status)}`}>
                    {integration.status}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                  {integration.description}
                </p>
                <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                  {integration.note}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}