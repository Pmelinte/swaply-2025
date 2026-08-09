"use client";

import { Link } from "@/i18n/navigation";
import { ArrowRight, MessageCircle, Search, Upload } from "lucide-react";

const STEPS = [
  {
    title: "List what you can offer",
    text: "Create a listing with the details another person needs to understand the proposed exchange.",
    icon: Upload,
  },
  {
    title: "Discover possible exchanges",
    text: "Browse and compare listings and available matching signals without assuming that every suggestion is AI-generated or guaranteed.",
    icon: Search,
  },
  {
    title: "Discuss and agree",
    text: "Use the platform communication and exchange flow to agree the scope, timing and logistics with the other participant.",
    icon: MessageCircle,
  },
] as const;

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
          About Swaply
        </h1>
        <p className="mx-auto mt-2 max-w-3xl text-base leading-7 text-zinc-500 dark:text-zinc-400">
          Swaply is a web platform for people who want to discover and arrange voluntary exchanges of objects, properties, services and events.
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          What Swaply is building
        </h2>
        <div className="mt-3 space-y-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          <p>
            Swaply is designed around direct exchange: a participant lists something they can offer, discovers another listing, discusses the terms and records the exchange flow on the platform.
          </p>
          <p>
            Some capabilities have production implementations, while others exist only as foundations, demos, disabled providers or planned work. Swaply does not present those states as equivalent.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          How it works
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {STEPS.map(({ title, text, icon: Icon }) => (
            <div
              key={title}
              className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-50">{title}</h3>
              <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-blue-200 bg-blue-50/60 p-6 dark:border-blue-900 dark:bg-blue-950/20">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          Public-truth rule
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          A feature is described as live only when its operational state can be demonstrated. Provider foundations, demos and future plans are labelled accordingly.
        </p>
      </section>

      <div className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-200 bg-gradient-to-br from-blue-50 to-white p-8 text-center shadow-sm dark:border-zinc-700 dark:from-blue-950/30 dark:to-zinc-900">
        <Link
          href="/register"
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-base font-bold text-white shadow-md transition hover:bg-blue-700"
        >
          Create account
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}