"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface Props {
  onSave: (details: Record<string, unknown>, cost?: number) => Promise<void>;
}

const COURIERS = ["FanCourier", "DPD", "GLS", "Cargus", "Other"];

export function TransportService({ onSave }: Props) {
  const t = useTranslations("exchangePage");
  const [courier, setCourier] = useState("FanCourier");
  const [pickup, setPickup] = useState("");
  const [delivery, setDelivery] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave({ courier, pickup, delivery });
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-50">
        🚚 {t("transportTitle")}
      </h3>

      <div className="flex flex-wrap gap-2">
        {COURIERS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCourier(c)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              courier === c
                ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300"
                : "border-zinc-200 text-zinc-500 hover:border-zinc-400 dark:border-zinc-700"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div>
        <p className="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">{t("pickupAddress")}</p>
        <input
          type="text"
          value={pickup}
          onChange={(e) => setPickup(e.target.value)}
          className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        />
      </div>

      <div>
        <p className="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">{t("deliveryAddress")}</p>
        <input
          type="text"
          value={delivery}
          onChange={(e) => setDelivery(e.target.value)}
          className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        />
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || !pickup || !delivery}
        className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {saving ? "…" : t("orderPickup")}
      </button>
    </div>
  );
}
