"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

interface Stats {
  usersCount: number;
  objectsCount: number;
  swapsCount: number;
  citiesCount: number;
}

function AnimatedNumber({ target, duration = 1500 }: { target: number; duration?: number }) {
  const [current, setCurrent] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    if (target <= 0 || animated.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || animated.current) return;
        animated.current = true;

        const start = performance.now();
        const step = (now: number) => {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          // ease-out cubic
          const eased = 1 - Math.pow(1 - progress, 3);
          setCurrent(Math.round(eased * target));
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      },
      { threshold: 0.3 },
    );

    const el = ref.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, [target, duration]);

  return <span ref={ref}>{current.toLocaleString()}</span>;
}

function StatCard({
  icon,
  value,
  label,
  showNumber,
  fallbackLabel,
}: {
  icon: string;
  value: number;
  label: string;
  showNumber: boolean;
  fallbackLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-200/60 bg-white px-4 py-5 shadow-sm dark:border-zinc-700/50 dark:bg-zinc-900">
      <span className="text-2xl" role="img" aria-hidden="true">
        {icon}
      </span>
      <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        {showNumber ? <AnimatedNumber target={value} /> : (fallbackLabel ?? "")}
      </span>
      <span className="text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
    </div>
  );
}

export function StatsBar() {
  const t = useTranslations("home");
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/stats");
        if (res.ok && !cancelled) {
          setStats(await res.json());
        }
      } catch {
        // silently fail — section just won't render
      }
    }

    load();
    const interval = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Don't render until data loaded
  if (!stats) return null;

  // Hide entirely if no objects at all
  if (stats.objectsCount < 1) return null;

  const showUsersNumber = stats.usersCount >= 50;
  const showSwapsNumber = stats.swapsCount >= 5;
  const showCitiesNumber = stats.citiesCount >= 3;

  return (
    <section className="rounded-2xl bg-[#F8F9FA] px-4 py-8 shadow-sm dark:bg-zinc-800/50 sm:px-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon="👥"
          value={stats.usersCount}
          label={t("statsUsers")}
          showNumber={showUsersNumber}
          fallbackLabel={t("statsCommunityGrowing")}
        />
        <StatCard
          icon="📦"
          value={stats.objectsCount}
          label={t("statsObjects")}
          showNumber={true}
        />
        <StatCard
          icon="🤝"
          value={stats.swapsCount}
          label={t("statsSwaps")}
          showNumber={showSwapsNumber}
          fallbackLabel={t("statsCommunityGrowing")}
        />
        <StatCard
          icon="🏙️"
          value={stats.citiesCount}
          label={t("statsCities")}
          showNumber={showCitiesNumber}
          fallbackLabel={t("statsCommunityGrowing")}
        />
      </div>
    </section>
  );
}
