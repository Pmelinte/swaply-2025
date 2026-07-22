"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useAppState } from "@/lib/state";
import { LoggedOutGate } from "@/components/gated";

type EventRow = { id: string; title: string; description: string; status: string; is_active: boolean; event_data: Record<string, unknown> | null; swap_wants_description: string | null; perceived_value_tier: string | null };

export default function EditEventPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const locale = useLocale();
  const { user, loading } = useAppState();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/items/events/${params.id}`).then((r) => r.json()).then((body) => {
      if (body.event) { setEvent(body.event); setTitle(body.event.title ?? ""); setDescription(body.event.description ?? ""); }
      else setMessage(body.error ?? "Event not found");
    }).catch(() => setMessage("Event not found"));
  }, [params.id, user]);

  if (loading.auth) return <div className="p-8 text-center text-zinc-400">Loading…</div>;
  if (!user) return <LoggedOutGate returnTo={`/events/${params.id}/edit`} />;

  async function patch(body: Record<string, unknown>) {
    setSaving(true); setMessage(null);
    const response = await fetch(`/api/items/events/${params.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const payload = await response.json().catch(() => null);
    setSaving(false);
    if (!response.ok) { setMessage(payload?.error ?? "Could not update event"); return; }
    setEvent(payload.event); setMessage("Event updated");
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    await patch({ title, description, eventData: event?.event_data ?? {}, swapWantsDescription: event?.swap_wants_description, perceivedValueTier: event?.perceived_value_tier });
  }

  return <main className="mx-auto max-w-2xl px-4 py-8">
    <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Manage event</h1>
    {message && <p className="mt-4 rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800">{message}</p>}
    <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <label className="block text-sm font-semibold">Title<input className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
      <label className="block text-sm font-semibold">Description<textarea className="mt-1 min-h-36 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950" value={description} onChange={(e) => setDescription(e.target.value)} /></label>
      <div className="flex flex-wrap gap-2"><button disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Save</button><button type="button" disabled={saving} onClick={() => patch({ status: "active" })} className="rounded-lg border px-4 py-2 text-sm">Activate</button><button type="button" disabled={saving} onClick={() => patch({ status: "paused" })} className="rounded-lg border px-4 py-2 text-sm">Pause</button><button type="button" disabled={saving} onClick={() => patch({ status: "archived" })} className="rounded-lg border px-4 py-2 text-sm">Expire</button><button type="button" onClick={() => router.push(`/${locale}/events/${params.id}`)} className="rounded-lg border px-4 py-2 text-sm">View</button></div>
    </form>
  </main>;
}
