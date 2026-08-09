"use client";

import { Handshake, Mail } from "lucide-react";
import { SWAPLY_PUBLIC_SUPPORT_EMAIL } from "@/lib/legal-copy";

export default function PartnersPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/40">
          <Handshake className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
          Partner with Swaply
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-base leading-7 text-zinc-500 dark:text-zinc-400">
          Swaply is open to conversations with logistics, travel, payment and service providers. A conversation, adapter or product concept is not presented as an active commercial integration until it is separately approved and verified.
        </p>
      </div>

      <div className="mx-auto max-w-3xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          Partnership status
        </h2>
        <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          There is currently no public claim of a fixed number of active partners, active countries, integrated couriers or paid partnership tiers. Provider capabilities shown elsewhere on Swaply must be read according to their explicit status: foundation, disabled or planned.
        </p>
      </div>

      <div className="mx-auto max-w-3xl rounded-2xl border border-blue-200 bg-blue-50/60 p-6 dark:border-blue-900 dark:bg-blue-950/20">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          Contact
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          For a partnership enquiry, contact Swaply using the public support address. No response-time or acceptance guarantee is made.
        </p>
        <a
          href={`mailto:${SWAPLY_PUBLIC_SUPPORT_EMAIL}?subject=Swaply%20partnership%20enquiry`}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
        >
          <Mail className="h-4 w-4" />
          {SWAPLY_PUBLIC_SUPPORT_EMAIL}
        </a>
      </div>
    </div>
  );
}