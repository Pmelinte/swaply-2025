"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/ui";
import {
  Handshake, Star, Zap, Globe, CheckCircle, ArrowRight, Mail,
} from "lucide-react";

const TIERS = [
  {
    id: "free",
    icon: Globe,
    color: "zinc",
    features: ["Basic listing in service directory", "Link to your website", "Visible in your country"],
  },
  {
    id: "featured",
    icon: Star,
    color: "amber",
    features: ["Priority placement in results", "Logo display", "Featured badge", "Visible in all countries"],
  },
  {
    id: "premium",
    icon: Zap,
    color: "blue",
    features: ["All Featured benefits", "Affiliate tracking integration", "Custom landing page", "Dedicated account manager", "API access"],
  },
] as const;

export default function PartnersPage() {
  const t = useTranslations("common");
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/40">
          <Handshake className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
          Partner with Swaply
        </h1>
        <p className="mt-2 text-base text-zinc-500 dark:text-zinc-400">
          Reach millions of users across 40+ countries. List your service on Swaply.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-200 bg-white/70 p-4 text-center dark:border-zinc-800 dark:bg-zinc-900/70">
          <p className="text-2xl font-bold text-blue-600">43</p>
          <p className="text-xs text-zinc-500">Languages</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white/70 p-4 text-center dark:border-zinc-800 dark:bg-zinc-900/70">
          <p className="text-2xl font-bold text-blue-600">40+</p>
          <p className="text-xs text-zinc-500">Countries</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white/70 p-4 text-center dark:border-zinc-800 dark:bg-zinc-900/70">
          <p className="text-2xl font-bold text-blue-600">10+</p>
          <p className="text-xs text-zinc-500">Service types</p>
        </div>
      </div>

      {/* Service types */}
      <SectionCard title="Service Categories We Feature">
        <div className="grid gap-2 sm:grid-cols-2">
          {["Domestic couriers", "International shipping", "Airlines", "Train operators", "Bus companies", "Rideshare apps", "Car rental", "Accommodation platforms", "Payment providers", "Local transport"].map((s) => (
            <div key={s} className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
              {s}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Tiers */}
      <SectionCard title="Partnership Tiers">
        <div className="grid gap-4 sm:grid-cols-3">
          {TIERS.map((tier) => {
            const Icon = tier.icon;
            return (
              <div
                key={tier.id}
                className={`rounded-xl border p-5 ${
                  tier.color === "blue"
                    ? "border-blue-300 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30"
                    : tier.color === "amber"
                    ? "border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30"
                    : "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800"
                }`}
              >
                <div className="mb-3 flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${
                    tier.color === "blue" ? "text-blue-600" : tier.color === "amber" ? "text-amber-600" : "text-zinc-500"
                  }`} />
                  <h3 className="font-bold capitalize text-zinc-900 dark:text-zinc-50">{tier.id}</h3>
                </div>
                <ul className="space-y-1.5">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-sm text-zinc-600 dark:text-zinc-300">
                      <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Contact form */}
      <SectionCard title="Get in Touch">
        {submitted ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <CheckCircle className="h-12 w-12 text-emerald-500" />
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Thank you!</p>
            <p className="text-sm text-zinc-500">We&apos;ll review your application and get back to you within 48 hours.</p>
          </div>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-500">Company Name</label>
                <input type="text" required className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-500">Country</label>
                <input type="text" required className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-500">Email</label>
                <input type="email" required className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-500">Service Type</label>
                <select required className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100">
                  <option value="">Select...</option>
                  <option value="courier_domestic">Domestic Courier</option>
                  <option value="courier_international">International Shipping</option>
                  <option value="airline">Airline</option>
                  <option value="train">Train</option>
                  <option value="bus">Bus</option>
                  <option value="rideshare">Rideshare</option>
                  <option value="car_rental">Car Rental</option>
                  <option value="accommodation">Accommodation</option>
                  <option value="payment_method">Payment Method</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-500">Website</label>
              <input type="url" required className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-500">Message</label>
              <textarea rows={3} className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100" />
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-blue-700"
            >
              <Mail className="h-4 w-4" />
              Submit Partnership Request
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}
      </SectionCard>
    </div>
  );
}
