"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useAppState } from "@/lib/state";

type EventRow = { id: string; title: string | null; description: string | null; owner_id: string | null; status: string | null; is_active: boolean | null; event_data: Record<string, unknown> | null; swap_wants_description: string | null; perceived_value_tier: string | null };

function text(value: unknown, fallback = "—") { return typeof value === "string" && value.trim() ? value : fallback; }
function bool(value: unknown) { return value ? "Yes" : "No"; }
function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-zinc-200 p-3 text-sm dark:border-zinc-800"><p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</p><p className="mt-1 text-zinc-900 dark:text-zinc-100">{value}</p></div>; }

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const locale = useLocale();
  const { user } = useAppState();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/items/events/${params.id}`).then(async (r) => {
      const body = await r.json().catch(() => null);
      if (!r.ok) throw new Error(body?.error ?? "Event unavailable");
      setEvent(body.event ?? null);
    }).catch((err: Error) => setError(err.message)).finally(() => setLoading(false));
  }, [params.id]);

  const data = useMemo(() => event?.event_data ?? {}, [event?.event_data]);
  if (loading) return <div className="p-8 text-center text-zinc-400">Loading event…</div>;
  if (error || !event) return <div className="p-8 text-center text-zinc-400">{error ?? "This event is unavailable."}</div>;
  const isOwner = user?.id === event.owner_id;

  return <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm font-semibold text-amber-600">{text(data.event_type_l1, "Event")}</p>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3"><h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{event.title}</h1>{isOwner && <Link className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900" href={`/${locale}/events/${event.id}/edit`}>Manage event</Link>}</div>
      <p className="mt-3 whitespace-pre-line text-sm text-zinc-600 dark:text-zinc-300">{event.description}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Info label="Date" value={`${text(data.start_date)} ${text(data.start_time, "")}`.trim()} />
        <Info label="Location" value={data.is_online ? "Online" : [data.venue_name, data.city, data.country].filter(Boolean).join(", ") || "To be coordinated"} />
        <Info label="Capacity" value={`${data.capacity_available ?? "—"}/${data.capacity_total ?? "—"} places`} />
        <Info label="Transferable" value={bool(data.is_transferable)} />
        <Info label="Booking deadline" value={text(data.booking_deadline_date, "Coordinate before exchange")} />
        <Info label="Issuer / ID rules" value={data.id_required ? "ID may be required by issuer or venue" : "Check issuer rules before exchange"} />
        <Info label="Optional package" value={[data.includes_transport && "transport", data.includes_accommodation && "accommodation", data.includes_meals && "meals", data.includes_equipment && "equipment"].filter(Boolean).join(", ") || "No required paid package"} />
        <Info label="Wants in return" value={event.swap_wants_description ?? "Open to fair swaps"} />
      </div>
    </section>
  </main>;
}
