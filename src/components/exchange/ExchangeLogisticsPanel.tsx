"use client";

import { useEffect, useState } from "react";
import {
  EXCHANGE_METHOD_LABELS,
  EXCHANGE_STATUS_LABELS,
  type ExchangeLogisticsState,
  type ExchangeMethod,
  type ExchangeStatus,
} from "@/lib/exchange/exchangeLogistics";

const METHODS = Object.keys(EXCHANGE_METHOD_LABELS) as ExchangeMethod[];
const STATUSES = Object.keys(EXCHANGE_STATUS_LABELS) as ExchangeStatus[];

interface Props {
  swapId: string | null | undefined;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function ExchangeLogisticsPanel({ swapId }: Props) {
  const [logistics, setLogistics] = useState<ExchangeLogisticsState | null>(null);
  const [method, setMethod] = useState<ExchangeMethod>("local_meetup");
  const [status, setStatus] = useState<ExchangeStatus>("planning");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!swapId) return;
    let cancelled = false;
    fetch(`/api/swaps/${swapId}/logistics`)
      .then((response) => response.json())
      .then((payload) => {
        if (cancelled) return;
        const next = payload.logistics as ExchangeLogisticsState | null;
        setLogistics(next);
        if (next?.method) setMethod(next.method);
        if (next?.status) setStatus(next.status);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [swapId]);

  async function saveMethod() {
    if (!swapId || saving) return;
    setSaving(true);
    const response = await fetch(`/api/swaps/${swapId}/logistics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_method", method }),
    });
    if (response.ok) {
      const payload = await response.json();
      setLogistics(payload.logistics);
    }
    setSaving(false);
  }

  async function saveStatus() {
    if (!swapId || saving) return;
    setSaving(true);
    const response = await fetch(`/api/swaps/${swapId}/logistics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "set_status",
        status,
        title: EXCHANGE_STATUS_LABELS[status],
      }),
    });
    if (response.ok) {
      const payload = await response.json();
      setLogistics(payload.logistics);
    }
    setSaving(false);
  }

  if (!swapId) return null;

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Exchange logistics</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Choose how the exchange will happen and keep both users aligned.
        </p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Method</label>
          <div className="flex gap-2">
            <select
              value={method}
              onChange={(event) => setMethod(event.target.value as ExchangeMethod)}
              className="min-w-0 flex-1 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            >
              {METHODS.map((entry) => (
                <option key={entry} value={entry}>
                  {EXCHANGE_METHOD_LABELS[entry]}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={saving}
              onClick={() => void saveMethod()}
              className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:bg-zinc-400"
            >
              Save
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Status</label>
          <div className="flex gap-2">
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as ExchangeStatus)}
              className="min-w-0 flex-1 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            >
              {STATUSES.map((entry) => (
                <option key={entry} value={entry}>
                  {EXCHANGE_STATUS_LABELS[entry]}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={saving}
              onClick={() => void saveStatus()}
              className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:bg-zinc-400"
            >
              Update
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-950">
        <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Timeline</p>
        {logistics?.timeline?.length ? (
          <div className="mt-3 space-y-2">
            {logistics.timeline.slice().reverse().map((event) => (
              <div key={event.id} className="rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-50">{event.title}</p>
                  <span className="text-xs text-zinc-500">{formatDate(event.created_at)}</span>
                </div>
                {event.description && (
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{event.description}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs text-zinc-500">No logistics timeline yet.</p>
        )}
      </div>
    </section>
  );
}
