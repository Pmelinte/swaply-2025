import type { ReactNode } from "react";
import clsx from "clsx";
import Link from "next/link";
import type { BadgeTier } from "@/lib/types";

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={clsx(
        "rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80",
        className,
      )}
    >
      <header className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {title}
          </h2>
          {description ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
          ) : null}
        </div>
        {action}
      </header>
      <div className="space-y-3 text-sm text-zinc-800 dark:text-zinc-200">
        {children}
      </div>
    </section>
  );
}

export function Pill({
  children,
  color = "zinc",
}: {
  children: React.ReactNode;
  color?: "green" | "blue" | "zinc" | "amber" | "red";
}) {
  const palette = {
    green: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200",
    zinc: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
    amber:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
    red: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200",
  } as const;
  return (
    <span className={clsx("inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium", palette[color])}>
      {children}
    </span>
  );
}

export function Badge({ tier }: { tier: BadgeTier }) {
  const config = {
    free: { label: "Free", color: "bg-zinc-100 text-zinc-800" },
    premium: { label: "Premium", color: "bg-amber-100 text-amber-800" },
    platinum: { label: "Platinum", color: "bg-blue-100 text-blue-800" },
  } as const;
  const resolved = config[tier] ?? config.free;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
        resolved.color,
      )}
    >
      <span className="h-2 w-2 rounded-full bg-current" aria-hidden />
      {resolved.label}
    </span>
  );
}

export function CTAButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost";
}) {
  const styles =
    variant === "primary"
      ? "bg-blue-600 text-white hover:bg-blue-700"
      : "bg-transparent text-blue-700 hover:text-blue-900 dark:text-blue-200 dark:hover:text-blue-100";

  return (
    <Link
      href={href}
      className={clsx(
        "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition",
        styles,
      )}
    >
      {children}
    </Link>
  );
}

export function Divider() {
  return <div className="h-px w-full bg-zinc-200 dark:bg-zinc-800" />;
}

type PageStateDefinition = {
  key: "loading" | "empty" | "error";
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function NextStepRecommendation({
  steps,
}: {
  steps: Array<{ label: string; href: string; description: string }>;
}) {
  if (!steps.length) return null;
  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4 shadow-sm dark:border-blue-900 dark:bg-blue-950/40">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
        Următorul pas recomandat
      </p>
      <div className="space-y-2">
        {steps.map((step) => (
          <Link
            key={step.href}
            href={step.href}
            className="flex items-center justify-between rounded-xl bg-white/70 p-3 text-sm transition hover:bg-white dark:bg-zinc-900/60 dark:hover:bg-zinc-800/80"
          >
            <div>
              <p className="font-semibold text-zinc-900 dark:text-zinc-50">{step.label}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{step.description}</p>
            </div>
            <span className="text-blue-600 dark:text-blue-300">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function StateShowcase({
  title,
  states,
}: {
  title: string;
  states: PageStateDefinition[];
}) {
  const pillColor: Record<PageStateDefinition["key"], "amber" | "zinc" | "red"> =
    {
      loading: "amber",
      empty: "zinc",
      error: "red",
    };

  return (
    <div className="space-y-2">
      <p className="text-xs uppercase text-zinc-500 dark:text-zinc-400">{title}</p>
      <div className="grid gap-2 md:grid-cols-3">
        {states.map((state) => (
          <div
            key={state.key}
            className="space-y-2 rounded-2xl border border-dashed border-zinc-200 bg-white/70 p-3 text-sm text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-200"
          >
            <div className="flex items-center justify-between">
              <Pill color={pillColor[state.key]}>{state.key}</Pill>
              {state.action}
            </div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {state.title}
            </h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">{state.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Reusable loading state placeholder */
export function LoadingState({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-zinc-400 dark:text-zinc-500">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-500 dark:border-zinc-600 dark:border-t-blue-400" />
      {message && <p className="text-sm">{message}</p>}
    </div>
  );
}

/** Reusable empty state with optional CTA */
export function EmptyState({
  message,
  ctaLabel,
  ctaHref,
}: {
  message: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-200 py-12 text-center dark:border-zinc-700">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{message}</p>
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}

/** Reusable error state with retry */
export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-red-200 bg-red-50/50 py-8 text-center dark:border-red-900 dark:bg-red-950/20">
      <p className="text-sm font-medium text-red-700 dark:text-red-300">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          Try again
        </button>
      )}
    </div>
  );
}
