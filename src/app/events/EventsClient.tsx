"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Calendar,
  Clock,
  Trophy,
  ChevronRight,
  Hash,
  Sparkles,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";

interface WeeklyEventRow {
  id: string;
  week_number: number;
  year: number;
  title: string;
  emoji: string;
  description: string;
  focus_categories: string[];
  challenge_description: string;
  challenge_badge_name: string;
  hashtags: string[];
  sponsor_name: string | null;
  sponsor_logo_url: string | null;
  starts_at: string;
  ends_at: string;
}

type EventStatus = "past" | "current" | "future";

function getEventStatus(event: WeeklyEventRow): EventStatus {
  const now = Date.now();
  if (new Date(event.ends_at).getTime() < now) return "past";
  if (new Date(event.starts_at).getTime() > now) return "future";
  return "current";
}

function useCountdown(endDate: string) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    function calc() {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) return "";
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      if (d > 0) return `${d}z ${h}h`;
      return `${h}h ${m}m`;
    }
    setTimeLeft(calc());
    const interval = setInterval(() => setTimeLeft(calc()), 60000);
    return () => clearInterval(interval);
  }, [endDate]);

  return timeLeft;
}

function formatDateRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${s.toLocaleDateString("ro-RO", opts)} – ${e.toLocaleDateString("ro-RO", opts)}`;
}

/* ── Hero Section for Current Event ── */
function CurrentEventHero({ event }: { event: WeeklyEventRow }) {
  const t = useTranslations("events");
  const countdown = useCountdown(event.ends_at);

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 p-6 text-white shadow-xl sm:p-8">
      <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5 blur-xl" />

      <div className="relative">
        <div className="flex items-center gap-2 text-sm font-medium text-amber-100">
          <Sparkles className="h-4 w-4" />
          {t("currentEvent")}
        </div>

        <div className="mt-2 flex items-center gap-3">
          <span className="text-4xl sm:text-5xl">{event.emoji}</span>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">{event.title}</h1>
            <p className="mt-1 text-sm text-amber-100">
              {t("week")} {event.week_number} · {formatDateRange(event.starts_at, event.ends_at)}
            </p>
          </div>
        </div>

        <p className="mt-4 max-w-xl text-sm text-amber-50">{event.description}</p>

        {/* Challenge */}
        <div className="mt-5 rounded-2xl bg-white/15 p-4 backdrop-blur">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Trophy className="h-4 w-4 text-yellow-200" />
            {t("weeklyChallenge")}
          </div>
          <p className="mt-1 text-sm text-amber-50">{event.challenge_description}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-full bg-yellow-400/20 px-2.5 py-0.5 text-xs font-semibold text-yellow-100">
              🏅 {event.challenge_badge_name}
            </span>
            {countdown && (
              <span className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white">
                <Clock className="h-3 w-3" />
                {countdown}
              </span>
            )}
          </div>
        </div>

        {/* Hashtags */}
        <div className="mt-4 flex flex-wrap gap-2">
          {event.hashtags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur"
            >
              <Hash className="h-3 w-3" />
              {tag.replace("#", "")}
            </span>
          ))}
        </div>

        {/* Categories */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {event.focus_categories.map((cat) => (
            <span
              key={cat}
              className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
            >
              {cat}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Calendar Grid Card ── */
function EventCard({ event }: { event: WeeklyEventRow }) {
  const status = getEventStatus(event);
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className={`w-full rounded-2xl border p-4 text-left shadow-sm transition hover:shadow-md ${
        status === "current"
          ? "border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 dark:border-amber-700 dark:from-amber-900/20 dark:to-orange-900/20"
          : status === "past"
            ? "border-zinc-200 bg-zinc-50/50 opacity-70 dark:border-zinc-800 dark:bg-zinc-900/50"
            : "border-zinc-200 bg-white/80 dark:border-zinc-800 dark:bg-zinc-900/80"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{event.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {event.title}
            </h3>
            {status === "current" && (
              <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                LIVE
              </span>
            )}
            {status === "past" && (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
            )}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            <Calendar className="mr-1 inline h-3 w-3" />
            {formatDateRange(event.starts_at, event.ends_at)}
          </p>
        </div>
        <ChevronRight
          className={`h-4 w-4 shrink-0 text-zinc-400 transition ${expanded ? "rotate-90" : ""}`}
        />
      </div>

      {expanded && (
        <div className="mt-3 space-y-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <p className="text-xs text-zinc-600 dark:text-zinc-300">{event.description}</p>
          <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300">
            <Trophy className="h-3.5 w-3.5" />
            {event.challenge_description}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {event.hashtags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-300"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {event.focus_categories.map((cat) => (
              <span
                key={cat}
                className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              >
                {cat}
              </span>
            ))}
          </div>
          <p className="text-[10px] text-zinc-400">
            🏅 Badge: {event.challenge_badge_name}
          </p>
        </div>
      )}
    </button>
  );
}

export default function EventsClient() {
  const t = useTranslations("events");
  const [events, setEvents] = useState<WeeklyEventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((d) => setEvents(d.events ?? []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const currentEvent = useMemo(
    () => events.find((e) => getEventStatus(e) === "current") ?? null,
    [events],
  );

  const pastEvents = useMemo(
    () => events.filter((e) => getEventStatus(e) === "past").reverse(),
    [events],
  );

  const futureEvents = useMemo(
    () => events.filter((e) => getEventStatus(e) === "future"),
    [events],
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-amber-500" />
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {t("weeklyTitle")}
          </h1>
        </div>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {t("weeklySubtitle")}
        </p>
      </div>

      {/* Current Event Hero */}
      {currentEvent && <CurrentEventHero event={currentEvent} />}

      {/* No active event */}
      {!currentEvent && events.length > 0 && (
        <div className="rounded-2xl border-2 border-dashed border-zinc-200 p-8 text-center dark:border-zinc-700">
          <CalendarDays className="mx-auto mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-600" />
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            {t("noActiveEvent")}
          </p>
          <p className="mt-1 text-xs text-zinc-500">{t("noActiveEventDesc")}</p>
        </div>
      )}

      {/* Future Events */}
      {futureEvents.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            <Sparkles className="h-5 w-5 text-amber-500" />
            {t("upcomingWeeks")}
          </h2>
          <div className="space-y-2">
            {futureEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-zinc-500 dark:text-zinc-400">
            <Clock className="h-5 w-5" />
            {t("pastWeeks")}
          </h2>
          <div className="space-y-2">
            {pastEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {events.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 py-12 dark:border-zinc-700">
          <CalendarDays className="mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-600" />
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            {t("noEvents")}
          </p>
          <p className="mt-1 text-xs text-zinc-500">{t("noEventsDesc")}</p>
        </div>
      )}
    </div>
  );
}
