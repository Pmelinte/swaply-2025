"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Trophy, ChevronRight, Clock } from "lucide-react";

interface EventData {
  id: string;
  title: string;
  emoji: string;
  description: string;
  challenge_description: string;
  hashtags: string[];
  starts_at: string;
  ends_at: string;
}

function calcCountdown(endDate: string) {
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return "Expirat";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (d > 0) return `${d}z ${h}h`;
  return `${h}h ${m}m`;
}

function useCountdown(endDate: string) {
  const [timeLeft, setTimeLeft] = useState(() => calcCountdown(endDate));

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(calcCountdown(endDate)), 60000);
    return () => clearInterval(interval);
  }, [endDate]);

  return timeLeft;
}

export function CurrentEventBanner() {
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/events/current")
      .then((r) => r.json())
      .then((d) => setEvent(d.event ?? null))
      .catch(() => setEvent(null))
      .finally(() => setLoading(false));
  }, []);

  const countdown = useCountdown(event?.ends_at ?? "");

  if (loading || !event) return null;

  return (
    <Link
      href={`/events`}
      className="group block overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 shadow-sm transition hover:shadow-md dark:border-amber-800 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-yellow-900/20"
    >
      <div className="flex items-center gap-4 p-4 sm:p-5">
        {/* Emoji */}
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-3xl shadow-sm">
          {event.emoji}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-50 sm:text-base">
              {event.title}
            </h3>
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              <Clock className="h-3 w-3" />
              {countdown}
            </span>
          </div>

          <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-300">
            <Trophy className="h-3.5 w-3.5 shrink-0" />
            Challenge: {event.challenge_description}
          </p>

          <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
            {event.hashtags[0]}
          </p>
        </div>

        {/* CTA arrow */}
        <div className="flex shrink-0 items-center gap-1 text-xs font-semibold text-amber-600 transition group-hover:text-amber-700 dark:text-amber-400">
          <span className="hidden sm:inline">Participă</span>
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
}
