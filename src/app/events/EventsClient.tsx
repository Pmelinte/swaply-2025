"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Tag,
  Plus,
  ChevronRight,
  CalendarDays,
  PartyPopper,
} from "lucide-react";

interface SwapEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  time: string;
  location: string;
  organizer: string;
  attendees: number;
  maxAttendees: number;
  isAttending: boolean;
}

const DEMO_EVENTS: SwapEvent[] = [
  {
    id: "evt-1",
    title: "Book Swap Weekend",
    description: "Bring your read books and find new ones! All genres welcome.",
    category: "Books",
    date: "2026-04-05",
    time: "10:00 - 16:00",
    location: "Central Library, Bucharest",
    organizer: "BookLovers Community",
    attendees: 23,
    maxAttendees: 50,
    isAttending: false,
  },
  {
    id: "evt-2",
    title: "Electronics & Gadgets Meet",
    description: "Swap phones, tablets, accessories. Working items only!",
    category: "Electronics",
    date: "2026-04-12",
    time: "11:00 - 15:00",
    location: "Tech Hub, Cluj-Napoca",
    organizer: "TechSwap RO",
    attendees: 15,
    maxAttendees: 30,
    isAttending: false,
  },
  {
    id: "evt-3",
    title: "Kids Clothes & Toys Exchange",
    description: "Perfect for parents! Swap outgrown clothes and toys.",
    category: "Kids",
    date: "2026-04-19",
    time: "09:00 - 13:00",
    location: "Community Center, Timișoara",
    organizer: "ParentSwap",
    attendees: 31,
    maxAttendees: 40,
    isAttending: true,
  },
  {
    id: "evt-4",
    title: "Vintage & Retro Fair",
    description: "Vintage clothing, vinyl records, retro decor and more.",
    category: "Vintage",
    date: "2026-04-26",
    time: "12:00 - 18:00",
    location: "Old Town Square, Brașov",
    organizer: "RetroSwap",
    attendees: 42,
    maxAttendees: 60,
    isAttending: false,
  },
  {
    id: "evt-5",
    title: "Plant Swap Spring Edition",
    description: "Trade cuttings, seedlings, and potted plants.",
    category: "Plants",
    date: "2026-05-03",
    time: "10:00 - 14:00",
    location: "Botanical Garden, Iași",
    organizer: "GreenSwap",
    attendees: 18,
    maxAttendees: 25,
    isAttending: false,
  },
];

export default function EventsClient() {
  const { user } = useAppState();
  const t = useTranslations("events");
  const [events, setEvents] = useState(DEMO_EVENTS);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const categories = useMemo(() => [...new Set(events.map((e) => e.category))].sort(), [events]);

  const filtered = useMemo(() => {
    if (!categoryFilter) return events;
    return events.filter((e) => e.category === categoryFilter);
  }, [events, categoryFilter]);

  const upcomingEvents = filtered
    .filter((e) => new Date(e.date) >= new Date())
    .sort((a, b) => a.date.localeCompare(b.date));

  const pastEvents = filtered
    .filter((e) => new Date(e.date) < new Date())
    .sort((a, b) => b.date.localeCompare(a.date));

  const toggleAttend = (eventId: string) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? {
              ...e,
              isAttending: !e.isAttending,
              attendees: e.isAttending ? e.attendees - 1 : e.attendees + 1,
            }
          : e
      )
    );
  };

  const EventCard = ({ event }: { event: SwapEvent }) => {
    const isPast = new Date(event.date) < new Date();
    const isFull = event.attendees >= event.maxAttendees;

    return (
      <div className={`rounded-2xl border bg-white/80 p-5 shadow-sm backdrop-blur transition hover:shadow-md dark:bg-zinc-900/80 ${
        isPast ? "border-zinc-200 opacity-70 dark:border-zinc-800" : "border-zinc-200 dark:border-zinc-800"
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                {event.category}
              </span>
              {event.isAttending && (
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  {t("attending")}
                </span>
              )}
            </div>
            <h3 className="mt-2 text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {event.title}
            </h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{event.description}</p>

            <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(event.date).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {event.time}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {event.location}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {event.attendees}/{event.maxAttendees}
              </span>
            </div>
          </div>

          {!isPast && user && (
            <button
              onClick={() => toggleAttend(event.id)}
              disabled={isFull && !event.isAttending}
              className={`ml-3 shrink-0 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                event.isAttending
                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300"
                  : isFull
                    ? "bg-zinc-100 text-zinc-400 cursor-not-allowed dark:bg-zinc-800"
                    : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {event.isAttending ? t("leave") : isFull ? t("full") : t("join")}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <PartyPopper className="h-6 w-6 text-amber-500" />
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{t("title")}</h1>
          </div>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t("subtitle")}</p>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setCategoryFilter(null)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            !categoryFilter ? "bg-blue-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300"
          }`}
        >
          {t("allCategories")}
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat === categoryFilter ? null : cat)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              categoryFilter === cat ? "bg-blue-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Upcoming */}
      {upcomingEvents.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            <CalendarDays className="h-5 w-5 text-blue-500" />
            {t("upcoming")}
          </h2>
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {/* Past */}
      {pastEvents.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-zinc-500 dark:text-zinc-400">
            <Clock className="h-5 w-5" />
            {t("past")}
          </h2>
          <div className="space-y-3">
            {pastEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 py-12 dark:border-zinc-700">
          <CalendarDays className="mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-600" />
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{t("noEvents")}</p>
          <p className="mt-1 text-xs text-zinc-500">{t("noEventsDesc")}</p>
        </div>
      )}
    </div>
  );
}
