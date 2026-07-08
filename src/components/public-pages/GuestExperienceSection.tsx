"use client";

import { Link } from "@/i18n/navigation";
import {
  getGuestProofExamplesForPage,
  type GuestProofAction,
  type GuestProofRegion,
} from "@/lib/public-pages/publicGuestProof";
import type { PublicExperiencePage } from "@/lib/public-pages/publicPageExperienceConfig";

const REGION_LABELS: Record<GuestProofRegion, string> = {
  europe: "Europe",
  americas: "Americas",
  asia: "Asia",
  africa: "Africa",
  oceania: "Oceania",
  global: "Global",
};

const ACTION_LABELS: Record<GuestProofAction, string> = {
  browse: "Browse before login",
  learn: "Learn before login",
  compare: "Compare before login",
  preview: "Preview before login",
  start_after_login: "Real action after login",
};

const ACTION_STYLES: Record<GuestProofAction, string> = {
  browse: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  learn: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  compare: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
  preview: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  start_after_login: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

interface GuestExperienceSectionProps {
  page: PublicExperiencePage;
  title?: string;
  subtitle?: string;
  ctaHref?: string;
  ctaLabel?: string;
  limit?: number;
  className?: string;
}

export function GuestExperienceSection({
  page,
  title = "Public preview examples",
  subtitle = "Visitors can understand Swaply before creating an account. Real proposals, chat and profile editing still require login.",
  ctaHref = "/register",
  ctaLabel = "Create a free account",
  limit = 2,
  className = "",
}: GuestExperienceSectionProps) {
  const examples = getGuestProofExamplesForPage(page).slice(0, limit);

  if (examples.length === 0) return null;

  return (
    <section
      data-testid={`guest-experience-${page}`}
      className={`rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 ${className}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
            Guest experience
          </p>
          <h2 className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">{title}</h2>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
        </div>
        <Link
          href={ctaHref}
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          {ctaLabel}
        </Link>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {examples.map((example) => (
          <article
            key={example.id}
            data-testid="guest-proof-card"
            className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/60"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-600 shadow-sm dark:bg-zinc-900 dark:text-zinc-300">
                {REGION_LABELS[example.region]}
              </span>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${ACTION_STYLES[example.action]}`}>
                {ACTION_LABELS[example.action]}
              </span>
              {example.requiresLogin && (
                <span className="rounded-full bg-zinc-200 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  Login gated
                </span>
              )}
            </div>
            <h3 className="mt-3 text-sm font-bold text-zinc-900 dark:text-zinc-50">{example.title}</h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{example.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
