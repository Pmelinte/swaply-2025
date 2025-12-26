import type { ReactNode } from "react";
import clsx from "clsx";
import Link from "next/link";
import { BadgeTier } from "@/lib/types";

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

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
        config[tier].color,
      )}
    >
      <span className="h-2 w-2 rounded-full bg-current" aria-hidden />
      {config[tier].label}
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
